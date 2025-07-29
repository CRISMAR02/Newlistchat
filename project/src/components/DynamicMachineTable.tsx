import React, { useState, useMemo } from 'react';
import { Edit, Trash2, ArrowUpDown, ArrowUp, ArrowDown, Calendar, MapPin, DollarSign, Package, ExternalLink, Settings } from 'lucide-react';
import { Machine, MachineField, MachineFilterState } from '../types/machine';
import { useMachineTableSettings } from '../hooks/useTableSettings';
import ColumnManager from './ColumnManager';

interface DynamicMachineTableProps {
  machines: Machine[];
  onEdit?: (machine: Machine) => void;
  onDelete?: (id: string) => void;
  onOpenLink?: (url: string, title: string) => void;
  isAuthenticated: boolean;
  filters: MachineFilterState;
  onFiltersChange: (filters: MachineFilterState) => void;
}

const DynamicMachineTable: React.FC<DynamicMachineTableProps> = ({
  machines,
  onEdit,
  onDelete,
  onOpenLink,
  isAuthenticated,
  filters,
  onFiltersChange
}) => {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showColumnManager, setShowColumnManager] = useState(false);
  const { settings, addColumn, removeColumn, updateColumn, resetToDefault } = useMachineTableSettings();

  const visibleColumns = useMemo(() => {
    return settings.columns
      .filter(col => col.visible)
      .sort((a, b) => a.order - b.order);
  }, [settings.columns]);

  const filteredAndSortedMachines = useMemo(() => {
    let filtered = machines.filter(machine => {
      const matchesSearch = !filters.searchTerm || 
        Object.values(machine).some(value => 
          value?.toString().toLowerCase().includes(filters.searchTerm.toLowerCase())
        );
      
      const matchesEstado = !filters.estado || 
        machine.estado === filters.estado;
      
      const matchesUbicacion = !filters.ubicacion || 
        machine.ubicacion === filters.ubicacion;

      return matchesSearch && matchesEstado && matchesUbicacion;
    });

    if (filters.sortBy) {
      filtered = [...filtered].sort((a, b) => {
        const aValue = a[filters.sortBy as MachineField]?.toString() || '';
        const bValue = b[filters.sortBy as MachineField]?.toString() || '';
        
        const comparison = aValue.localeCompare(bValue, 'es', { numeric: true });
        return filters.sortOrder === 'desc' ? -comparison : comparison;
      });
    }

    return filtered;
  }, [machines, filters]);

  const handleSort = (field: MachineField) => {
    onFiltersChange({
      ...filters,
      sortBy: field,
      sortOrder: filters.sortBy === field && filters.sortOrder === 'asc' ? 'desc' : 'asc'
    });
  };

  const handleDelete = (id: string) => {
    if (deleteConfirm === id && onDelete) {
      onDelete(id);
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(id);
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  const getSortIcon = (field: MachineField) => {
    if (filters.sortBy !== field) return <ArrowUpDown className="w-4 h-4 opacity-50" />;
    return filters.sortOrder === 'asc' ? 
      <ArrowUp className="w-4 h-4 text-blue-600" /> : 
      <ArrowDown className="w-4 h-4 text-blue-600" />;
  };

  const getStatusColor = (estado: string) => {
    switch (estado?.toUpperCase()) {
      case 'EN STOCK - LIBRE': return 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border-blue-300';
      case 'FACTURADO': return 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 border-green-300';
      case 'ENTREGADO': return 'bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-800 border-emerald-300';
      case 'IDA3 - EN CONFERENCIA - LIBRE': return 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border-yellow-300';
      case 'DISPONIBLE EMBARQUE - LIBRE': return 'bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 border-purple-300';
      default: return 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border-gray-300';
    }
  };

  const formatCurrency = (value: number | string) => {
    const num = typeof value === 'string' ? parseFloat(value.replace(/[^\d.-]/g, '')) : value;
    if (isNaN(num)) return value;
    return new Intl.NumberFormat('es-PY', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(num);
  };

  const formatCellValue = (value: any, column: any) => {
    if (!value) return '';
    
    switch (column.type) {
      case 'number':
        if (column.key.includes('Price') || column.key.includes('Amount') || column.key === 'nc') {
          return formatCurrency(value);
        }
        return typeof value === 'number' ? value.toLocaleString() : value;
      case 'date':
        return value instanceof Date ? value.toLocaleDateString() : value;
      case 'select':
        if (column.key === 'estado') {
          return (
            <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(value)}`}>
              {value}
            </span>
          );
        }
        if (column.key === 'ubicacion') {
          return (
            <span className="inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full border bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border-blue-200">
              <MapPin className="w-3 h-3 mr-1" />
              {value}
            </span>
          );
        }
        return value;
      case 'url':
        return value ? (
          <button
            onClick={() => onOpenLink?.(value, 'Enlace')}
            className="text-blue-600 hover:text-blue-800 underline"
            title="Abrir enlace"
          >
            Ver enlace
          </button>
        ) : '';
      default:
        if (column.key === 'cuadroTfDe') {
          return (
            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
              <Calendar className="w-3 h-3 mr-1" />
              {value}
            </span>
          );
        }
        return value;
    }
  };

  return (
    <>
      <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden shadow-[2px_2px_6px_rgba(0,0,0,0.3),-2px_-2px_6px_rgba(255,255,255,0.1)]">
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-slate-700">
          <h3 className="text-sm sm:text-base font-medium text-white">Máquinas</h3>
          {isAuthenticated && (
            <button
              onClick={() => setShowColumnManager(true)}
              className="inline-flex items-center px-2 sm:px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors space-x-1 sm:space-x-2 text-xs sm:text-sm"
            >
              <Settings className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>Gestionar Columnas</span>
            </button>
          )}
        </div>
        
        {/* Mobile Card View */}
        <div className="block sm:hidden">
          {filteredAndSortedMachines.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 bg-slate-700 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Package className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-slate-300 font-medium">No se encontraron máquinas</p>
              <p className="text-slate-400 text-sm mt-1">Ajusta los filtros para ver resultados</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700">
              {filteredAndSortedMachines.map((machine, index) => (
                <div 
                  key={machine.id} 
                  className="p-4 hover:bg-slate-700 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-white truncate">{machine.codigo}</h4>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">{machine.descripcion}</p>
                    </div>
                    {isAuthenticated && (
                      <div className="flex space-x-1 ml-2">
                        <button
                          onClick={() => onEdit?.(machine)}
                          className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-slate-700 rounded-md transition-colors"
                          title="Editar"
                        >
                          <Edit className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDelete(machine.id!)}
                          className={`p-1.5 transition-colors rounded-md ${
                            deleteConfirm === machine.id 
                              ? 'text-red-300 bg-red-900' 
                              : 'text-red-400 hover:text-red-300 hover:bg-slate-700'
                          }`}
                          title={deleteConfirm === machine.id ? 'Confirmar eliminación' : 'Eliminar'}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                        {machine.link && (
                          <button
                            onClick={() => onOpenLink?.(machine.link!, machine.descripcion)}
                            className="p-1.5 text-green-400 hover:text-green-300 hover:bg-slate-700 rounded-md transition-colors"
                            title="Ver enlace"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {machine.totalAmountUSD && (
                      <div>
                        <span className="text-slate-400">Valor USD:</span>
                        <div className="mt-1 text-green-400 font-semibold">
                          {formatCurrency(machine.totalAmountUSD)}
                        </div>
                      </div>
                    )}
                    
                    {machine.estado && (
                      <div>
                        <span className="text-slate-400">Estado:</span>
                        <div className="mt-1">
                          <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(machine.estado)}`}>
                            {machine.estado}
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {machine.ubicacion && (
                      <div>
                        <span className="text-slate-400">Ubicación:</span>
                        <div className="mt-1">
                          <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full border bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border-blue-200">
                            <MapPin className="w-3 h-3 mr-1" />
                            {machine.ubicacion}
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {machine.cuadroTfDe && (
                      <div>
                        <span className="text-slate-400">Cuadro TF:</span>
                        <div className="mt-1">
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                            <Calendar className="w-3 h-3 mr-1" />
                            {machine.cuadroTfDe}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-slate-700">
              <tr>
                {visibleColumns.map((column) => (
                  <th 
                    key={column.key}
                    className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-600 transition-colors"
                    onClick={() => handleSort(column.key as MachineField)}
                  >
                    <div className="flex items-center space-x-2">
                      <span>{column.label}</span>
                      {getSortIcon(column.key as MachineField)}
                    </div>
                  </th>
                ))}
                {isAuthenticated && (
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-slate-800 divide-y divide-slate-700">
              {filteredAndSortedMachines.map((machine, index) => {
                const baseRowClass = index % 2 === 0 ? 'bg-slate-800' : 'bg-slate-750';
                
                return (
                  <tr 
                    key={machine.id} 
                    className={`transition-colors ${baseRowClass} hover:bg-slate-700`}
                  >
                    {visibleColumns.map((column) => (
                      <td key={column.key} className="px-4 py-3 whitespace-nowrap text-sm text-white">
                        {formatCellValue(machine[column.key], column)}
                      </td>
                    ))}
                    {isAuthenticated && (
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => onEdit?.(machine)}
                            className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-slate-700 rounded-md transition-colors"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(machine.id!)}
                            className={`p-1.5 transition-colors rounded-md ${
                              deleteConfirm === machine.id 
                                ? 'text-red-300 bg-red-900' 
                                : 'text-red-400 hover:text-red-300 hover:bg-slate-700'
                            }`}
                            title={deleteConfirm === machine.id ? 'Confirmar eliminación' : 'Eliminar'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          {machine.link && (
                            <button
                              onClick={() => onOpenLink?.(machine.link!, machine.descripcion)}
                              className="p-1.5 text-green-400 hover:text-green-300 hover:bg-slate-700 rounded-md transition-colors"
                              title="Ver enlace"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {filteredAndSortedMachines.length === 0 && (
          <div className="text-center py-12 sm:py-16 hidden sm:block">
            <div className="w-12 h-12 bg-slate-700 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Package className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-slate-300 font-medium">No se encontraron máquinas</p>
            <p className="text-slate-400 text-sm mt-1">Ajusta los filtros para ver resultados</p>
          </div>
        )}
      </div>

      <ColumnManager
        isOpen={showColumnManager}
        onClose={() => setShowColumnManager(false)}
        columns={settings.columns}
        onAddColumn={addColumn}
        onRemoveColumn={removeColumn}
        onUpdateColumn={updateColumn}
        onResetToDefault={resetToDefault}
        defaultColumns={settings.defaultColumns}
        title="Gestión de Columnas - Máquinas"
      />
    </>
  );
};

export default DynamicMachineTable;