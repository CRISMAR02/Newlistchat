import { useState, useEffect } from 'react';
import { SystemReport, ReportFilter } from '../types/report';
import { reportService } from '../services/reportService';

export const useReports = () => {
  const [reports, setReports] = useState<SystemReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = async (filters?: ReportFilter) => {
    setLoading(true);
    setError(null);
    try {
      const fetchedReports = await reportService.getReports(filters);
      setReports(fetchedReports);
    } catch (err: any) {
      setError(err.message || 'Error al cargar reportes');
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const createAuditLogReport = async (auditLogs: any[], filters?: any) => {
    try {
      const reportId = await reportService.createAuditLogReport(auditLogs, filters);
      await fetchReports(); // Refresh the list
      return reportId;
    } catch (err: any) {
      setError(err.message || 'Error al crear reporte de auditoría');
      throw err;
    }
  };

  const createSystemStatsReport = async (stats: any) => {
    try {
      const reportId = await reportService.createSystemStatsReport(stats);
      await fetchReports(); // Refresh the list
      return reportId;
    } catch (err: any) {
      setError(err.message || 'Error al crear reporte de estadísticas');
      throw err;
    }
  };

  const createDataExportReport = async (
    entityType: 'PRODUCT' | 'MACHINE',
    data: any[],
    format: string = 'XLSX'
  ) => {
    try {
      const reportId = await reportService.createDataExportReport(entityType, data, format);
      await fetchReports(); // Refresh the list
      return reportId;
    } catch (err: any) {
      setError(err.message || 'Error al crear reporte de exportación');
      throw err;
    }
  };

  const updateReportStatus = async (reportId: string, status: SystemReport['status']) => {
    try {
      await reportService.updateReportStatus(reportId, status);
      await fetchReports(); // Refresh the list
    } catch (err: any) {
      setError(err.message || 'Error al actualizar estado del reporte');
      throw err;
    }
  };

  const getReportStats = async () => {
    try {
      return await reportService.getReportStats();
    } catch (err: any) {
      console.error('Error getting report stats:', err);
      return {
        totalReports: 0,
        reportsByType: {},
        recentReports: 0,
        totalExports: 0
      };
    }
  };

  return {
    reports,
    loading,
    error,
    fetchReports,
    createAuditLogReport,
    createSystemStatsReport,
    createDataExportReport,
    updateReportStatus,
    getReportStats
  };
};