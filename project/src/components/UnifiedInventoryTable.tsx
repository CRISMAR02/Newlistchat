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
      'CREDITO': 'bg-gradient-to-r from-rose-100 to-rose-200 text-rose-800 border-rose-300',
      'PREPARACION': 'bg-gradient-to-r from-amber-100 to-amber-200 text-amber-800 border-amber-300',
      'ENVIADO P12': 'bg-gradient-to-r from-lime-100 to-lime-200 text-lime-800 border-lime-300',
      'FACTURADO': 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 border-green-300',
      'LOGISTICA ENTREGA': 'bg-gradient-to-r from-violet-100 to-violet-200 text-violet-800 border-violet-300',
      'ENTREGA TECNICA': 'bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-800 border-emerald-300',
      'SIN SOLICITUD DE PREPARACION': 'bg-gradient-to-r from-red-100 to-red-200 text-red-800 border-red-300',
      'PREPARACION SOLICITADO': 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border-yellow-300',
      'SOLICITUD DE PREPARACION RECIBIDA': 'bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800 border-orange-300',
      'PREPARACION CONCLUIDA': 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 border-green-300'
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
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/10">
        <h3 className="text-lg sm:text-xl font-bold text-gray-900">
          Inventario Unificado ({filteredAndSortedItems.length} items)
        </h3>
      </div>
      
      {/* Mobile Card View */}
      <div className="block lg:hidden">
        {filteredAndSortedItems.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4 border border-gray-200">
              <Package className="w-8 h-8 text-gray-500" />
            </div>
            <p className="text-gray-700 font-semibold text-lg">No se encontraron items</p>
            <p className="text-gray-500 text-base mt-2">Ajusta los filtros para ver resultados</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredAndSortedItems.map((item, index) => (
              <div key={item.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className={`inline-flex items-center px-3 py-2 text-sm font-bold rounded-lg border ${getTypeColor(item.type)}`}>
                        {getTypeIcon(item.type)}
                        <span className="ml-2">{item.type}</span>
                      </span>
                      <h4 className="text-lg font-bold text-gray-900 truncate">{item.codigo}</h4>
                    </div>
                    <p className="text-base text-gray-700 mt-2 line-clamp-2">{item.descripcion}</p>
                  </div>
                  {isAuthenticated && (
                    <div className="flex space-x-1 ml-2">
                      <button
                        onClick={() => onEdit?.(item)}
                        className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors border border-gray-300"
                        title="Editar"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id!, item.type)}
                        className={`p-1.5 transition-colors rounded-md ${
                          deleteConfirm === item.id 
                            ? 'text-red-700 bg-red-100 border border-red-300' 
                            : 'text-red-600 hover:text-red-800 hover:bg-red-50 border border-gray-300'
                        }`}
                        title={deleteConfirm === item.id ? 'Confirmar eliminación' : 'Eliminar'}
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 font-medium">Proveedor:</span>
                    <div className="mt-1 text-gray-900 font-semibold truncate">{item.proveedor || '-'}</div>
                  </div>
                  <div>
                    <span className="text-gray-600 font-medium">Estado:</span>
                    <div className="mt-1">
                      <span className="inline-flex items-center px-3 py-1 text-sm font-bold rounded-lg border bg-gray-100 text-gray-800 border-gray-300">
                        {item.estado}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600 font-medium">Cliente:</span>
                    <div className="mt-1 text-gray-900 font-semibold truncate">{item.cliente || '-'}</div>
                  </div>
                  <div>
                    <span className="text-gray-600 font-medium">CR:</span>
                    <div className="mt-1 text-gray-900 font-bold">{item.cr || 0}</div>
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
          <thead className="bg-gray-50">
            <tr>
              {allColumns.map((column) => (
                <th 
                  key={column.key}
                  className={`px-4 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider ${
                    column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                  } transition-colors`}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center space-x-2">
                    {column.key === 'proveedor' && <Users className="w-4 h-4" />}
                    {column.key === 'cliente' && <Users className="w-4 h-4" />}
                    <span>{column.label}</span>
                    {column.sortable && getSortIcon(column.key)}
                  </div>
                </th>
              ))}
              {isAuthenticated && (
                <th className="px-4 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                  Acciones
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAndSortedItems.map((item, index) => {
              const baseRowClass = index % 2 === 0 ? 'bg-white' : 'bg-gray-50';
              
              return (
                <tr 
                  key={item.id} 
                  className={`transition-colors ${baseRowClass} hover:bg-gray-100`}
                >
                  {allColumns.map((column) => (
                    <td key={column.key} className="px-4 py-4 whitespace-nowrap text-base text-gray-900">
                      {column.key === 'type' ? (
                        <span className={`inline-flex items-center px-3 py-2 text-sm font-bold rounded-lg border ${getTypeColor(item.type)}`}>
                          {getTypeIcon(item.type)}
                          <span className="ml-2">{item.type}</span>
                        </span>
                      ) : column.key === 'codigo' ? (
                        <span className="font-bold text-lg">{item.codigo}</span>
                      ) : column.key === 'estado' ? (
                        <span className="inline-flex items-center px-3 py-2 text-sm font-bold rounded-lg border bg-gray-100 text-gray-800 border-gray-300">
                          {item.estado}
                        </span>
                      ) : column.key === 'descripcion' ? (
                        <span className="max-w-xs truncate font-medium" title={item.descripcion}>
                          {item.descripcion}
                        </span>
                      ) : column.key === 'cr' ? (
                        <span className="font-bold text-gray-900">
                          {item.cr || 0}
                        </span>
                      ) : (
                        <span className="font-medium">{item[column.key] || '-'}</span>
                      )}
                    </td>
                  ))}
                  {isAuthenticated && (
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => onEdit?.(item)}
                          className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors border border-gray-300"
                          title="Editar"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id!, item.type)}
                          className={`p-1.5 transition-colors rounded-md ${
                            deleteConfirm === item.id 
                              ? 'text-red-700 bg-red-100 border border-red-300' 
                              : 'text-red-600 hover:text-red-800 hover:bg-red-50 border border-gray-300'
                          }`}
                          title={deleteConfirm === item.id ? 'Confirmar eliminación' : 'Eliminar'}
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                        {item.link && (
                          <button
                            onClick={() => onOpenLink?.(item.link!, item.descripcion)}
                            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors border border-gray-300"
                            title="Ver enlace"
                          >
                            <ExternalLink className="w-5 h-5" />
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
          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4 border border-gray-200">
            <Package className="w-8 h-8 text-gray-500" />
          </div>
          <p className="text-gray-700 font-semibold text-lg">No se encontraron items</p>
          <p className="text-gray-500 text-base mt-2">Ajusta los filtros para ver resultados</p>
        </div>
      )}
    </div>
  );
};

export default UnifiedInventoryTable;