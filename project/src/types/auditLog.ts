export interface AuditLog {
  id?: string;
  timestamp: Date;
  userIP: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'BULK_IMPORT' | 'REMOVE_DUPLICATES';
  entityType: 'PRODUCT' | 'MACHINE';
  entityId?: string;
  entityCode?: string;
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  summary: string;
  userAgent?: string;
  sessionId?: string;
  deviceInfo?: {
    platform: string;
    language: string;
    timezone: string;
    screenResolution: string;
  };
}

export interface AuditLogFilter {
  startDate?: string;
  endDate?: string;
  action?: string;
  entityType?: string;
  userIP?: string;
  searchTerm?: string;
}

export interface AuditStats {
  totalLogs: number;
  uniqueIPs: number;
  actionCounts: Record<string, number>;
  recentActivity: number;
}