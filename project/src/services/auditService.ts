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
import { AuditLog, AuditLogFilter } from '../types/auditLog';

const COLLECTION_NAME = 'audit_logs';

export const auditService = {
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

  // Get additional device information
  async getDeviceInfo(): Promise<{
    ip: string;
    userAgent: string;
    platform: string;
    language: string;
    timezone: string;
    screenResolution: string;
  }> {
    const ip = await this.getUserIP();
    
    return {
      ip,
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screenResolution: `${screen.width}x${screen.height}`
    };
  },

  // Log an audit entry
  async logAction(
    action: AuditLog['action'],
    entityType: AuditLog['entityType'],
    summary: string,
    entityId?: string,
    entityCode?: string,
    changes?: AuditLog['changes']
  ): Promise<void> {
    try {
      const deviceInfo = await this.getDeviceInfo();
      const sessionId = sessionStorage.getItem('sessionId') || this.generateSessionId();
      
      // Store session ID for this session
      if (!sessionStorage.getItem('sessionId')) {
        sessionStorage.setItem('sessionId', sessionId);
      }

      const auditLog: Omit<AuditLog, 'id'> = {
        timestamp: new Date(),
        userIP: deviceInfo.ip,
        action,
        entityType,
        entityId,
        entityCode,
        changes,
        summary,
        userAgent: deviceInfo.userAgent,
        sessionId
      };

      const docData = {
        timestamp: Timestamp.fromDate(auditLog.timestamp),
        userIP: auditLog.userIP,
        action: auditLog.action,
        entityType: auditLog.entityType,
        entityId: auditLog.entityId || null,
        entityCode: auditLog.entityCode || null,
        changes: auditLog.changes || null,
        summary: auditLog.summary,
        userAgent: auditLog.userAgent || null,
        sessionId: auditLog.sessionId || null,
        deviceInfo: {
          platform: deviceInfo.platform,
          language: deviceInfo.language,
          timezone: deviceInfo.timezone,
          screenResolution: deviceInfo.screenResolution
        }
      };

      console.log('Attempting to save audit log:', docData);
      const docRef = await addDoc(collection(db, COLLECTION_NAME), docData);
      console.log('Audit log saved successfully with ID:', docRef.id);

    } catch (error) {
      console.error('Error creating audit log:', error, {
        action,
        entityType,
        summary,
        entityId,
        entityCode
      });
      // Don't throw error to avoid breaking the main functionality
    }
  },

  // Generate a unique session ID
  generateSessionId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  },

  // Get all audit logs with filtering
  async getAuditLogs(filters?: AuditLogFilter): Promise<AuditLog[]> {
    try {
      let q = query(collection(db, COLLECTION_NAME), orderBy('timestamp', 'desc'));

      // Apply filters
      if (filters?.action) {
        q = query(q, where('action', '==', filters.action));
      }
      if (filters?.entityType) {
        q = query(q, where('entityType', '==', filters.entityType));
      }
      if (filters?.userIP) {
        q = query(q, where('userIP', '==', filters.userIP));
      }

      // Limit to last 1000 entries for performance
      q = query(q, limit(1000));

      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp.toDate()
        } as AuditLog;
      }).filter(log => {
        // Apply client-side filters for date range and search
        if (filters?.startDate && log.timestamp < new Date(filters.startDate)) {
          return false;
        }
        if (filters?.endDate && log.timestamp > new Date(filters.endDate + 'T23:59:59')) {
          return false;
        }
        if (filters?.searchTerm) {
          const searchLower = filters.searchTerm.toLowerCase();
          return (
            log.summary.toLowerCase().includes(searchLower) ||
            log.entityCode?.toLowerCase().includes(searchLower) ||
            log.userIP.includes(searchLower)
          );
        }
        return true;
      });
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      throw error;
    }
  },

  // Get recent activity (last 24 hours)
  async getRecentActivity(): Promise<AuditLog[]> {
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const q = query(
        collection(db, COLLECTION_NAME),
        where('timestamp', '>=', Timestamp.fromDate(yesterday)),
        orderBy('timestamp', 'desc'),
        limit(50)
      );

      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp.toDate()
        } as AuditLog;
      });
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      return [];
    }
  },

  // Calculate audit statistics
  async getAuditStats(): Promise<any> {
    try {
      const logs = await this.getAuditLogs();
      const uniqueIPs = new Set(logs.map(log => log.userIP)).size;
      const actionCounts = logs.reduce((acc, log) => {
        acc[log.action] = (acc[log.action] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const recentActivity = logs.filter(log => log.timestamp > yesterday).length;

      return {
        totalLogs: logs.length,
        uniqueIPs,
        actionCounts,
        recentActivity
      };
    } catch (error) {
      console.error('Error calculating audit stats:', error);
      return {
        totalLogs: 0,
        uniqueIPs: 0,
        actionCounts: {},
        recentActivity: 0
      };
    }
  }
};