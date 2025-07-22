import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  where, 
  limit,
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { SystemReport, ReportFilter } from '../types/report';

const COLLECTION_NAME = 'reports';

export const reportService = {
  // Get user's device IP address (local IP)
  async getUserIP(): Promise<string> {
    try {
      // Try to get local IP address using WebRTC
      const localIP = await this.getLocalIP();
      if (localIP && localIP !== 'unknown') {
        return localIP;
      }
      
      // Fallback to public IP if local IP is not available
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return `${data.ip} (público)`;
    } catch (error) {
      console.warn('Could not get IP address:', error);
      return 'unknown';
    }
  },

  // Get local IP address using WebRTC
  async getLocalIP(): Promise<string> {
    return new Promise((resolve) => {
      try {
        const pc = new RTCPeerConnection({
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });
        
        let localIP = 'unknown';
        
        pc.createDataChannel('');
        
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            const candidate = event.candidate.candidate;
            const ipMatch = candidate.match(/(\d+\.\d+\.\d+\.\d+)/);
            if (ipMatch && ipMatch[1]) {
              const ip = ipMatch[1];
              // Filter out common non-local IPs
              if (!ip.startsWith('0.') && 
                  !ip.startsWith('127.') && 
                  !ip.startsWith('169.254.') &&
                  ip !== '0.0.0.0') {
                localIP = ip;
                pc.close();
                resolve(localIP);
              }
            }
          }
        };
        
        pc.createOffer()
          .then(offer => pc.setLocalDescription(offer))
          .catch(() => resolve('unknown'));
        
        // Timeout after 3 seconds
        setTimeout(() => {
          pc.close();
          resolve(localIP);
        }, 3000);
        
      } catch (error) {
        console.warn('WebRTC not available:', error);
        resolve('unknown');
      }
    });
  },

  // Generate a unique session ID
  generateSessionId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  },

  // Create a new report
  async createReport(
    reportType: SystemReport['reportType'],
    title: string,
    description: string,
    data: any,
    metadata?: SystemReport['metadata'],
    tags?: string[]
  ): Promise<string> {
    try {
      const userIP = await this.getUserIP();
      const userAgent = navigator.userAgent;
      const sessionId = sessionStorage.getItem('sessionId') || this.generateSessionId();
      
      // Store session ID for this session
      if (!sessionStorage.getItem('sessionId')) {
        sessionStorage.setItem('sessionId', sessionId);
      }

      const report: Omit<SystemReport, 'id'> = {
        timestamp: new Date(),
        reportType,
        title,
        description,
        data,
        generatedBy: {
          userIP,
          userAgent,
          sessionId
        },
        metadata: metadata || {},
        status: 'GENERATED',
        tags: tags || []
      };

      const docData = {
        timestamp: Timestamp.fromDate(report.timestamp),
        reportType: report.reportType,
        title: report.title,
        description: report.description,
        data: report.data,
        generatedBy: report.generatedBy,
        metadata: report.metadata,
        status: report.status,
        tags: report.tags
      };

      console.log('Creating report:', docData);
      const docRef = await addDoc(collection(db, COLLECTION_NAME), docData);
      console.log('Report created successfully with ID:', docRef.id);
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating report:', error);
      throw error;
    }
  },

  // Get all reports with filtering
  async getReports(filters?: ReportFilter): Promise<SystemReport[]> {
    try {
      let q = query(collection(db, COLLECTION_NAME), orderBy('timestamp', 'desc'));

      // Apply filters
      if (filters?.reportType) {
        q = query(q, where('reportType', '==', filters.reportType));
      }
      if (filters?.status) {
        q = query(q, where('status', '==', filters.status));
      }

      // Limit to last 500 entries for performance
      q = query(q, limit(500));

      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp.toDate(),
          metadata: {
            ...data.metadata,
            dateRange: data.metadata?.dateRange ? {
              start: data.metadata.dateRange.start?.toDate?.() || data.metadata.dateRange.start,
              end: data.metadata.dateRange.end?.toDate?.() || data.metadata.dateRange.end
            } : undefined
          }
        } as SystemReport;
      }).filter(report => {
        // Apply client-side filters for date range and search
        if (filters?.startDate && report.timestamp < new Date(filters.startDate)) {
          return false;
        }
        if (filters?.endDate && report.timestamp > new Date(filters.endDate + 'T23:59:59')) {
          return false;
        }
        if (filters?.searchTerm) {
          const searchLower = filters.searchTerm.toLowerCase();
          return (
            report.title.toLowerCase().includes(searchLower) ||
            report.description.toLowerCase().includes(searchLower) ||
            report.tags?.some(tag => tag.toLowerCase().includes(searchLower))
          );
        }
        return true;
      });
    } catch (error) {
      console.error('Error fetching reports:', error);
      throw error;
    }
  },

  // Update report status (e.g., mark as exported)
  async updateReportStatus(reportId: string, status: SystemReport['status']): Promise<void> {
    try {
      const reportRef = doc(db, COLLECTION_NAME, reportId);
      await updateDoc(reportRef, { status });
    } catch (error) {
      console.error('Error updating report status:', error);
      throw error;
    }
  },

  // Get report statistics
  async getReportStats(): Promise<any> {
    try {
      const reports = await this.getReports();
      const reportsByType = reports.reduce((acc, report) => {
        acc[report.reportType] = (acc[report.reportType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const recentReports = reports.filter(report => report.timestamp > yesterday).length;
      const totalExports = reports.filter(report => report.status === 'EXPORTED').length;

      return {
        totalReports: reports.length,
        reportsByType,
        recentReports,
        totalExports
      };
    } catch (error) {
      console.error('Error calculating report stats:', error);
      return {
        totalReports: 0,
        reportsByType: {},
        recentReports: 0,
        totalExports: 0
      };
    }
  },

  // Create audit log report
  async createAuditLogReport(auditLogs: any[], filters?: any): Promise<string> {
    const title = `Reporte de Auditoría - ${new Date().toLocaleDateString('es-ES')}`;
    const description = `Reporte de ${auditLogs.length} registros de auditoría`;
    
    const metadata = {
      recordCount: auditLogs.length,
      dateRange: filters?.startDate || filters?.endDate ? {
        start: filters.startDate ? new Date(filters.startDate) : undefined,
        end: filters.endDate ? new Date(filters.endDate) : undefined
      } : undefined,
      filters: filters || {},
      exportFormat: 'JSON'
    };

    return await this.createReport(
      'AUDIT_LOG',
      title,
      description,
      auditLogs,
      metadata,
      ['auditoria', 'historial', 'cambios']
    );
  },

  // Create system stats report
  async createSystemStatsReport(stats: any): Promise<string> {
    const title = `Estadísticas del Sistema - ${new Date().toLocaleDateString('es-ES')}`;
    const description = `Reporte de estadísticas generales del sistema`;
    
    const metadata = {
      recordCount: Object.keys(stats).length,
      exportFormat: 'JSON'
    };

    return await this.createReport(
      'SYSTEM_STATS',
      title,
      description,
      stats,
      metadata,
      ['estadisticas', 'sistema', 'metricas']
    );
  },

  // Create data export report
  async createDataExportReport(
    entityType: 'PRODUCT' | 'MACHINE',
    data: any[],
    format: string = 'XLSX'
  ): Promise<string> {
    const entityName = entityType === 'PRODUCT' ? 'Implementos' : 'Máquinas';
    const title = `Exportación de ${entityName} - ${new Date().toLocaleDateString('es-ES')}`;
    const description = `Exportación de ${data.length} registros de ${entityName.toLowerCase()}`;
    
    const metadata = {
      recordCount: data.length,
      exportFormat: format
    };

    return await this.createReport(
      'DATA_EXPORT',
      title,
      description,
      { entityType, records: data },
      metadata,
      ['exportacion', entityType.toLowerCase(), format.toLowerCase()]
    );
  }
};