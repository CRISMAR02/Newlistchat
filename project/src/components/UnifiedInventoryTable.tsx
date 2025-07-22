import React, { useState, useMemo } from 'react';
import { Edit, Trash2, ArrowUpDown, ArrowUp, ArrowDown, Package, Settings, ExternalLink, Calendar, MapPin, DollarSign, Users, Truck } from 'lucide-react';
import { InventoryItem, InventoryFilterState } from '../types/inventory';

interface UnifiedInventoryTableProps {
  items: InventoryItem[];
  onEdit?: (item: InventoryItem) => void;
  onDelete?: (id: string, type: 'IMPLEMENTO' | 'MAQUINA') => void;
  onOpenLink?: (url: string, title: string) => void;
  isAuthenticated: boolean;
  filters: InventoryFilterState;
  onFiltersChange: (filters: InventoryFilterState) => void;
}

const UnifiedInventoryTable: React.FC<UnifiedInventoryTableProps> = ({
  items,
  onEdit,
  onDelete,
  onOpenLink,
  isAuthenticated,
  filters,
  onFiltersChange
}) => {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  
  // Obtener todas las columnas dinámicas de los datos
  const allColumns = useMemo(() => {
    const baseColumns = [
      { key: 'type', label: 'Tipo', sortable: true },
      { key: 'proveedor', label: 'Proveedor', sortable: true },
      { key: 'codigo', label: 'Código', sortable: true },
      { key: 'proforma', label: 'Proforma', sortable: true },
      { key: 'po', label: 'P.O', sortable: true },
      { key: 'factura', label: 'Factura', sortable: true },
      { key: 'estado', label: 'Estado', sortable: true },
      { key: 'descripcion', label: 'Descripción', sortable: false },
      { key: 'fechaLlegada', label: 'F. Llegada', sortable: true },
      { key: 'cliente', label: 'Cliente', sortable: true },
      { key: 'lugar', label: 'Lugar', sortable: true },
      { key: 'chassis', label: 'Chassis', sortable: true },
      { key: 'cr', label: 'CR', sortable: true },
      { key: 'orderNr', label: 'Order Nr', sortable: true }
    ];
    
    // Encontrar campos dinámicos
    const dynamicFields = new Set<string>();
    items.forEach(item => {
      Object.keys(item).forEach(key => {
        if (!['id', 'createdAt', 'updatedAt', 'link'].includes(key) && 
            !baseColumns.some(col => col.key === key)) {
          dynamicFields.add(key);
        }
      });
    });
    
    // Agregar columnas dinámicas
    const dynamicColumns = Array.from(dynamicFields).map(field => ({
      key: field,
      label: field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, ' '),
      sortable: true
    }));
    
    return [...baseColumns, ...dynamicColumns];
  }, [items]);

  const filteredAndSortedItems = useMemo(() => {
    let filtered = items.filter(item => {
      const matchesSearch = !filters.searchTerm || 
        Object.values(item).some(value => 
          value?.toString().toLowerCase().includes(filters.searchTerm.toLowerCase())
        );
      
      const matchesType = filters.type === 'ALL' || item.type === filters.type;
      const matchesProveedor = !filters.proveedor || item.proveedor === filters.proveedor;
      const matchesEstado = !filters.estado || item.estado === filters.estado;
      const matchesLugar = !filters.lugar || item.lugar === filters.lugar;
      const matchesCliente = !filters.cliente || item.cliente === filters.cliente;

      return matchesSearch && matchesType && matchesProveedor && matchesEstado && matchesLugar && matchesCliente;
    });

    if (filters.sortBy) {
      filtered = [...filtered].sort((a, b) => {
        const aValue = a[filters.sortBy]?.toString() || '';
        const bValue = b[filters.sortBy]?.toString() || '';
        
        const comparison = aValue.localeCompare(bValue, 'es', { numeric: true });
        return filters.sortOrder === 'desc' ? -comparison : comparison;
      });
    }

    return filtered;
  }, [items, filters]);

  const handleSort = (field: string) => {
    onFiltersChange({
      ...filters,
      sortBy: field,
      sortOrder: filters.sortBy === field && filters.sortOrder === 'asc' ? 'desc' : 'asc'
    });
  };

  const handleDelete = (id: string, type: 'IMPLEMENTO' | 'MAQUINA') => {
    if (deleteConfirm === id && onDelete) {
      onDelete(id, type);
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(id);
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  const getSortIcon = (field: string) => {
    if (filters.sortBy !== field) return <ArrowUpDown className="w-4 h-4 opacity-50" />;
    return filters.sortOrder === 'asc' ? 
      <ArrowUp className="w-4 h-4 text-purple-600" /> : 
      <ArrowDown className="w-4 h-4 text-purple-600" />;
  };

  const getTypeIcon = (type: 'IMPLEMENTO' | 'MAQUINA') => {
    return type === 'IMPLEMENTO' ? 
      <Package className="w-4 h-4 text-blue-500" /> : 
      <Settings className="w-4 h-4 text-green-500" />;
  };

  const getTypeColor = (type: 'IMPLEMENTO' | 'MAQUINA') => {
    return type === 'IMPLEMENTO' ? 
      'bg-blue-100 text-blue-800 border-blue-300' : 
      'bg-green-100 text-green-800 border-green-300';
  };

  const getStatusColor = (estado: string) => {
    const statusColors: Record<string, string> = {
      'PEDIDO': 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border-gray-300',
      'FACTURACIÓN': 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border-yellow-300',
      'EMBARQUE LIBRE': 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border-blue-300',
      'TRANSITO': 'bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800 border-orange-300',
      'ADUANA ORIGEN': 'bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 border-purple-300',
      'ADUANA DESTINO': 'bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 border-purple-300',
      'IDA 3': 'bg-gradient-to-r from-indigo-100 to-indigo-200 text-indigo-800 border-indigo-300',
      'DESPACHO': 'bg-gradient-to-r from-cyan-100 to-cyan-200 text-cyan-800 border-cyan-300',
      'CONFERENCIA': 'bg-gradient-to-r from-teal-100 to-teal-200 text-teal-800 border-teal-300',
      'CONFERIDO': 'bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-800 border-emerald-300',
      'STOCK ALGESA': 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border-blue-300',
      'PODER 3RO': 'bg-gradient-to-r from-pink-100 to-pink-200 text-pink-800 border-pink-300',
      'CRÉDITO': 'bg-gradient-to-r from-rose-100 to-rose-200 text-rose-800 border-rose-300',
      'PREPARACIÓN': 'bg-gradient-to-r from-amber-100 to-amber-200 text-amber-800 border-amber-300',
      'ENVIADO P12': 'bg-gradient-to-r from-lime-100 to-lime-200 text-lime-800 border-lime-300',
      'FACTURADO': 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 border-green-300',
      'LOGISTICA ENTREGA': 'bg-gradient-to-r from-violet-100 to-violet-200 text-violet-800 border-violet-300',
      'ENTREGA TÉCNICA': 'bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-800 border-emerald-300'
    };
    
    return statusColors[estado?.toUpperCase()] || 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border-gray-300';
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES');
    } catch {
      return dateString;
    }
  };

  return (
    <div className="bg-black/20 dark:bg-gray-900/40 backdrop-blur-xl rounded-2xl border border-white/10 dark:border-gray-700/20 overflow-hidden">
      <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/10">
        <h3 className="text-base sm:text-lg font-semibold text-white dark:text-gray-200">
          Inventario Unificado ({filteredAndSortedItems.length} items)
        </h3>
      </div>
      
      {/* Mobile Card View */}
      <div className="block lg:hidden">
        {filteredAndSortedItems.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 bg-gray-700/50 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Package className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-gray-300 dark:text-gray-400 font-medium">No se encontraron items</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Ajusta los filtros para ver resultados</p>
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {filteredAndSortedItems.map((item, index) => (
              <div key={item.id} className="p-4 hover:bg-white/5 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full border ${getTypeColor(item.type)}`}>
                        {getTypeIcon(item.type)}
                        <span className="ml-1">{item.type}</span>
                      </span>
                      <h4 className="text-sm font-semibold text-white truncate">{item.codigo}</h4>
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 line-clamp-2">{item.descripcion}</p>
                  </div>
                  {isAuthenticated && (
                    <div className="flex space-x-1 ml-2">
                      <button
                        onClick={() => onEdit?.(item)}
                        className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-slate-700 rounded-md transition-colors"
                        title="Editar"
                      >
                        <Edit className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id!, item.type)}
                        className={`p-1.5 transition-colors rounded-md ${
                          deleteConfirm === item.id 
                            ? 'text-red-300 bg-red-900' 
                            : 'text-red-400 hover:text-red-300 hover:bg-slate-700'
                        }`}
                        title={deleteConfirm === item.id ? 'Confirmar eliminación' : 'Eliminar'}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-400 dark:text-gray-500">Proveedor:</span>
                    <div className="mt-1 text-white truncate">{item.proveedor || '-'}</div>
                  </div>
                  <div>
                    <span className="text-gray-400 dark:text-gray-500">Estado:</span>
                    <div className="mt-1">
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(item.estado)}`}>
                        {item.estado}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-400 dark:text-gray-500">Cliente:</span>
                    <div className="mt-1 text-white truncate">{item.cliente || '-'}</div>
                  </div>
                  <div>
                    <span className="text-gray-400 dark:text-gray-500">CR:</span>
                    <div className="mt-1 text-green-400 dark:text-green-300 font-semibold">{item.cr || 0}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-black/30 dark:bg-gray-900/50 backdrop-blur-sm">
            <tr>
              {allColumns.map((column) => (
                <th 
                  key={column.key}
                  className={`px-3 py-4 text-left text-xs font-medium text-gray-300 dark:text-gray-400 uppercase tracking-wider ${
                    column.sortable ? 'cursor-pointer hover:bg-white/5 dark:hover:bg-gray-800/50' : ''
                  } transition-colors`}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center space-x-1">
                    {column.key === 'proveedor' && <Users className="w-3 h-3" />}
                    {column.key === 'fechaLlegada' && <Calendar className="w-3 h-3" />}
                    {column.key === 'cliente' && <Users className="w-3 h-3" />}
                    {column.key === 'lugar' && <MapPin className="w-3 h-3" />}
                    <span>{column.label}</span>
                    {column.sortable && getSortIcon(column.key)}
                  </div>
                </th>
              ))}
              {isAuthenticated && (
                <th className="px-3 py-4 text-left text-xs font-medium text-gray-300 dark:text-gray-400 uppercase tracking-wider">
                  Acciones
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-black/10 dark:bg-gray-900/20 backdrop-blur-sm divide-y divide-white/10 dark:divide-gray-700/20">
            {filteredAndSortedItems.map((item, index) => {
              const baseRowClass = index % 2 === 0 ? 'bg-black/5 dark:bg-gray-900/10' : 'bg-white/5 dark:bg-gray-800/10';
              
              return (
                <tr 
                  key={item.id} 
                  className={`transition-colors ${baseRowClass} hover:bg-white/10 dark:hover:bg-gray-700/20`}
                >
                  {allColumns.map((column) => (
                    <td key={column.key} className="px-3 py-4 whitespace-nowrap text-sm text-white dark:text-gray-300">
                      {column.key === 'type' ? (
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full border ${getTypeColor(item.type)}`}>
                          {getTypeIcon(item.type)}
                          <span className="ml-1">{item.type}</span>
                        </span>
                      ) : column.key === 'codigo' ? (
                        <span className="font-semibold">{item.codigo}</span>
                      ) : column.key === 'estado' ? (
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(item.estado)}`}>
                          {item.estado}
                        </span>
                      ) : column.key === 'descripcion' ? (
                        <span className="max-w-xs truncate" title={item.descripcion}>
                          {item.descripcion}
                        </span>
                      ) : column.key === 'fechaLlegada' ? (
                        formatDate(item.fechaLlegada)
                      ) : column.key === 'cr' ? (
                        <span className="font-semibold text-green-400 dark:text-green-300">
                          {item.cr || 0}
                        </span>
                      ) : (
                        item[column.key] || '-'
                      )}
                    </td>
                  ))}
                  {isAuthenticated && (
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => onEdit?.(item)}
                          className="p-1.5 text-blue-400 dark:text-blue-300 hover:text-blue-300 dark:hover:text-blue-200 hover:bg-white/10 dark:hover:bg-gray-700/30 rounded-md transition-colors"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id!, item.type)}
                          className={`p-1.5 transition-colors rounded-md ${
                            deleteConfirm === item.id 
                              ? 'text-red-300 dark:text-red-200 bg-red-900 dark:bg-red-800 border border-red-700 dark:border-red-600' 
                              : 'text-red-400 dark:text-red-300 hover:text-red-300 dark:hover:text-red-200 hover:bg-white/10 dark:hover:bg-gray-700/30'
                          }`}
                          title={deleteConfirm === item.id ? 'Confirmar eliminación' : 'Eliminar'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        {item.link && (
                          <button
                            onClick={() => onOpenLink?.(item.link!, item.descripcion)}
                            className="p-1.5 text-green-400 dark:text-green-300 hover:text-green-300 dark:hover:text-green-200 hover:bg-white/10 dark:hover:bg-gray-700/30 rounded-md transition-colors"
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
      
      {filteredAndSortedItems.length === 0 && (
        <div className="text-center py-12 sm:py-16">
          <div className="w-12 h-12 bg-gray-700/50 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Package className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-gray-300 dark:text-gray-400 font-medium">No se encontraron items</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Ajusta los filtros para ver resultados</p>
        </div>
      )}
    </div>
  );
};

export default UnifiedInventoryTable;