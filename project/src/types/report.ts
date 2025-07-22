export interface SystemReport {
  id?: string;
  timestamp: Date;
  reportType: 'AUDIT_LOG' | 'SYSTEM_STATS' | 'USER_ACTIVITY' | 'DATA_EXPORT' | 'ERROR_LOG';
  title: string;
  description: string;
  data: any;
  generatedBy: {
    userIP: string;
    userAgent?: string;
    sessionId?: string;
  };
  metadata: {
    recordCount?: number;
    dateRange?: {
      start: Date;
      end: Date;
    };
    filters?: Record<string, any>;
    exportFormat?: string;
  };
  status: 'GENERATED' | 'EXPORTED' | 'ARCHIVED';
  tags?: string[];
}

export interface ReportFilter {
  startDate?: string;
  endDate?: string;
  reportType?: string;
  status?: string;
  searchTerm?: string;
}

export interface ReportStats {
  totalReports: number;
  reportsByType: Record<string, number>;
  recentReports: number;
  totalExports: number;
}