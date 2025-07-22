import React, { useState, useEffect } from 'react';
import { X, History, Search, Filter, Download, Eye, Clock, MapPin, User, Activity } from 'lucide-react';
import { AuditLog, AuditLogFilter } from '../types/auditLog';
import { auditService } from '../services/auditService';
import { useReports } from '../hooks/useReports';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';

interface AuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuditLogModal: React.FC<AuditLogModalProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>({});
  const [filters, setFilters] = useState<AuditLogFilter>({});
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const { createAuditLogReport } = useReports();

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
      fetchStats();
    }
  }, [isOpen]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const auditLogs = await auditService.getAuditLogs(filters);
      setLogs(auditLogs);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const auditStats = await auditService.getAuditStats();
      setStats(auditStats);
    } catch (error) {
      console.error('Error fetching audit stats:', error);
    }
  };

  const handleFilterChange = (newFilters: Partial<AuditLogFilter>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const applyFilters = () => {
    fetchLogs();
  };

  const exportToExcel = () => {
    // Create report entry first
    createAuditLogReport(logs, filters).then(() => {
      Swal.fire({
        icon: 'success',
        title: 'Reporte creado',
        text: 'El reporte se ha guardado en el sistema',
        timer: 2000,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
    }).catch(console.error);

    // Export to Excel
    const excelData = logs.map(log => ({
      'Fecha/Hora': log.timestamp.toLocaleString('es-ES'),
      'IP Usuario': log.userIP,
      'Acción': log.action,
      'Tipo': log.entityType,
      'Código': log.entityCode || '',
      'Resumen': log.summary,
      'Cambios': log.changes?.map(c => `${c.field}: ${c.oldValue} → ${c.newValue}`).join('; ') || ''
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);
    
    ws['!cols'] = [
      { wch: 20 }, // Fecha/Hora
      { wch: 15 }, // IP Usuario
      { wch: 15 }, // Acción
      { wch: 10 }, // Tipo
      { wch: 15 }, // Código
      { wch: 50 }, // Resumen
      { wch: 50 }  // Cambios
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Historial');
    const timestamp = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `historial_modificaciones_${timestamp}.xlsx`);
    
    Swal.fire({
      icon: 'success',
      title: '¡Exportación exitosa!',
      text: 'El archivo Excel se ha descargado correctamente',
      timer: 3000,
      showConfirmButton: false,
      toast: true,
      position: 'top-end'
    });
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE': return 'bg-green-900 text-green-300 border-green-700';
      case 'UPDATE': return 'bg-blue-900 text-blue-300 border-blue-700';
      case 'DELETE': return 'bg-red-900 text-red-300 border-red-700';
      case 'BULK_IMPORT': return 'bg-purple-900 text-purple-300 border-purple-700';
      case 'REMOVE_DUPLICATES': return 'bg-orange-900 text-orange-300 border-orange-700';
      default: return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'CREATE': return '➕';
      case 'UPDATE': return '✏️';
      case 'DELETE': return '🗑️';
      case 'BULK_IMPORT': return '📥';
      case 'REMOVE_DUPLICATES': return '🧹';
      default: return '📝';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl shadow-2xl w-full max-w-7xl h-5/6 flex flex-col border border-slate-700">
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-slate-700 rounded-xl flex items-center justify-center">
              <History className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Historial de Modificaciones</h2>
              <p className="text-sm text-slate-400">Registro completo de cambios en el sistema</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={exportToExcel}
              className="inline-flex items-center px-3 py-2 text-green-400 hover:text-green-300 transition-colors hover:bg-slate-700 rounded-lg space-x-2"
              title="Exportar a Excel"
            >
              <Download className="w-5 h-5" />
              <span className="text-sm">Exportar</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white transition-colors hover:bg-slate-700 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="p-6 border-b border-slate-700">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-700 p-4 rounded-lg">
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-slate-300">Total Registros</span>
              </div>
              <p className="text-2xl font-bold text-white mt-1">{stats.totalLogs || 0}</p>
            </div>
            <div className="bg-slate-700 p-4 rounded-lg">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-green-400" />
                <span className="text-sm text-slate-300">IPs Únicas</span>
              </div>
              <p className="text-2xl font-bold text-white mt-1">{stats.uniqueIPs || 0}</p>
            </div>
            <div className="bg-slate-700 p-4 rounded-lg">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-orange-400" />
                <span className="text-sm text-slate-300">Últimas 24h</span>
              </div>
              <p className="text-2xl font-bold text-white mt-1">{stats.recentActivity || 0}</p>
            </div>
            <div className="bg-slate-700 p-4 rounded-lg">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-slate-300">Filtrados</span>
              </div>
              <p className="text-2xl font-bold text-white mt-1">{logs.length}</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-slate-700">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar..."
                value={filters.searchTerm || ''}
                onChange={(e) => handleFilterChange({ searchTerm: e.target.value })}
                className="w-full pl-10 pr-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm text-white placeholder-slate-400"
              />
            </div>
            
            <select
              value={filters.action || ''}
              onChange={(e) => handleFilterChange({ action: e.target.value })}
              className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm text-white"
            >
              <option value="">Todas las acciones</option>
              <option value="CREATE">Crear</option>
              <option value="UPDATE">Actualizar</option>
              <option value="DELETE">Eliminar</option>
              <option value="BULK_IMPORT">Importar</option>
              <option value="REMOVE_DUPLICATES">Limpiar</option>
            </select>

            <select
              value={filters.entityType || ''}
              onChange={(e) => handleFilterChange({ entityType: e.target.value })}
              className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm text-white"
            >
              <option value="">Todos los tipos</option>
              <option value="PRODUCT">Implementos</option>
              <option value="MACHINE">Máquinas</option>
            </select>

            <input
              type="date"
              value={filters.startDate || ''}
              onChange={(e) => handleFilterChange({ startDate: e.target.value })}
              className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm text-white"
            />

            <input
              type="date"
              value={filters.endDate || ''}
              onChange={(e) => handleFilterChange({ endDate: e.target.value })}
              className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm text-white"
            />

            <button
              onClick={applyFilters}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Aplicar
            </button>
          </div>
        </div>
        
        {/* Logs Table */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-slate-400">Cargando historial...</p>
                </div>
              </div>
            ) : (
              <table className="min-w-full">
                <thead className="bg-slate-700 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase">Fecha/Hora</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase">IP Usuario</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase">Acción</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase">Tipo</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase">Código</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase">Resumen</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {logs.map((log, index) => (
                    <tr key={log.id} className={index % 2 === 0 ? 'bg-slate-800' : 'bg-slate-750'}>
                      <td className="px-4 py-3 text-sm text-white">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{log.timestamp.toLocaleString('es-ES')}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-3 h-3 text-blue-400" />
                          <div className="flex flex-col">
                            <span className="text-blue-300 font-mono text-xs">{log.userIP}</span>
                            {log.deviceInfo && (
                              <span className="text-slate-400 text-xs">{log.deviceInfo.platform}</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border ${getActionColor(log.action)}`}>
                          <span className="mr-1">{getActionIcon(log.action)}</span>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-300">{log.entityType}</td>
                      <td className="px-4 py-3 text-sm text-blue-300 font-mono">{log.entityCode || '-'}</td>
                      <td className="px-4 py-3 text-sm text-slate-300 max-w-xs truncate">{log.summary}</td>
                      <td className="px-4 py-3 text-sm">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="p-1 text-blue-400 hover:text-blue-300 transition-colors"
                          title="Ver detalles"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
          <div className="bg-slate-800 rounded-xl shadow-2xl max-w-2xl w-full border border-slate-700">
            <div className="flex items-center justify-between p-6 border-b border-slate-700">
              <h3 className="text-lg font-bold text-white">Detalles del Registro</h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-400">Fecha/Hora</label>
                  <p className="text-white">{selectedLog.timestamp.toLocaleString('es-ES')}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-400">IP Dispositivo</label>
                  <div>
                    <p className="text-blue-300 font-mono">{selectedLog.userIP}</p>
                    {selectedLog.deviceInfo && (
                      <div className="text-xs text-slate-400 mt-1">
                        <p>Plataforma: {selectedLog.deviceInfo.platform}</p>
                        <p>Idioma: {selectedLog.deviceInfo.language}</p>
                        <p>Zona horaria: {selectedLog.deviceInfo.timezone}</p>
                        <p>Resolución: {selectedLog.deviceInfo.screenResolution}</p>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-400">Acción</label>
                  <p className="text-white">{selectedLog.action}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-400">Tipo</label>
                  <p className="text-white">{selectedLog.entityType}</p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-slate-400">Resumen</label>
                <p className="text-white">{selectedLog.summary}</p>
              </div>

              {selectedLog.changes && selectedLog.changes.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-slate-400">Cambios Realizados</label>
                  <div className="mt-2 space-y-2">
                    {selectedLog.changes.map((change, index) => (
                      <div key={index} className="bg-slate-700 p-3 rounded-lg">
                        <div className="text-sm font-medium text-white">{change.field}</div>
                        <div className="text-xs text-slate-400 mt-1">
                          <span className="text-red-400">Antes:</span> {change.oldValue || 'vacío'} 
                          <span className="mx-2">→</span> 
                          <span className="text-green-400">Después:</span> {change.newValue || 'vacío'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedLog.userAgent && (
                <div>
                  <label className="text-sm font-medium text-slate-400">Navegador</label>
                  <p className="text-slate-300 text-xs">{selectedLog.userAgent}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogModal;