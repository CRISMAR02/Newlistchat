import { auditService } from '../services/auditService';
import { AuditLog } from '../types/auditLog';

export const useAuditLog = () => {
  const logProductAction = async (
    action: AuditLog['action'],
    summary: string,
    productId?: string,
    productCode?: string,
    changes?: AuditLog['changes']
  ) => {
    try {
      console.log('Logging product action:', { action, summary, productId, productCode, changes });
      await auditService.logAction(action, 'PRODUCT', summary, productId, productCode, changes);
    } catch (error) {
      console.error('Error logging product action:', error);
    }
  };

  const logMachineAction = async (
    action: AuditLog['action'],
    summary: string,
    machineId?: string,
    machineCode?: string,
    changes?: AuditLog['changes']
  ) => {
    try {
      console.log('Logging machine action:', { action, summary, machineId, machineCode, changes });
      await auditService.logAction(action, 'MACHINE', summary, machineId, machineCode, changes);
    } catch (error) {
      console.error('Error logging machine action:', error);
    }
  };

  const logBulkAction = async (
    entityType: 'PRODUCT' | 'MACHINE',
    action: 'BULK_IMPORT' | 'REMOVE_DUPLICATES',
    summary: string
  ) => {
    try {
      console.log('Logging bulk action:', { action, entityType, summary });
      await auditService.logAction(action, entityType, summary);
    } catch (error) {
      console.error('Error logging bulk action:', error);
    }
  };

  // Helper to detect changes between objects
  const detectChanges = (oldData: any, newData: any): AuditLog['changes'] => {
    const changes: AuditLog['changes'] = [];
    
    // Get all unique keys from both objects
    const allKeys = new Set([...Object.keys(oldData || {}), ...Object.keys(newData || {})]);
    
    allKeys.forEach(key => {
      // Skip system fields
      if (['id', 'createdAt', 'updatedAt'].includes(key)) return;
      
      const oldValue = oldData?.[key];
      const newValue = newData?.[key];
      
      // Convert to strings for comparison
      const oldStr = oldValue?.toString() || '';
      const newStr = newValue?.toString() || '';
      
      if (oldStr !== newStr) {
        changes.push({
          field: key,
          oldValue: oldValue,
          newValue: newValue
        });
      }
    });
    
    return changes;
  };

  return {
    logProductAction,
    logMachineAction,
    logBulkAction,
    detectChanges
  };
};