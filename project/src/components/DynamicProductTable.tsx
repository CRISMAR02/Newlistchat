import React, { useState, useMemo } from 'react';
import { Edit, Trash2, ArrowUpDown, ArrowUp, ArrowDown, Calendar, MapPin, DollarSign, Package, Settings, ExternalLink } from 'lucide-react';
import { Product, ProductField, FilterState } from '../types/product';
import { getRowBackgroundClass } from '../utils/dateUtils';
import { useProductTableSettings } from '../hooks/useTableSettings';
import ColumnManager from './ColumnManager';

interface DynamicProductTableProps {
  products: Product[];
  onEdit?: (product: Product) => void;
  onDelete?: (id: string) => void;
  onOpenLink?: (url: string, title: string) => void;
  isAuthenticated: boolean;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

const DynamicProductTable: React.FC<DynamicProductTableProps> = ({
  products,
  onEdit,
  onDelete,
  onOpenLink,
  isAuthenticated,
  filters,
  onFiltersChange
}) => {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showColumnManager, setShowColumnManager] = useState(false);
  const { settings, addColumn, removeColumn, updateColumn, resetToDefault } = useProductTableSettings();

  const visibleColumns = useMemo(() => {
    return settings.columns
      .filter(col => col.visible)
      .sort((a, b) => a.order - b.order);
  }, [settings.columns]);

  const filteredAndSortedProducts = useMemo(() => {
    let filtered = products.filter(product => {
      const matchesSearch = !filters.searchTerm || 
        Object.values(product).some(value => 
          value?.toString().toLowerCase().includes(filters.searchTerm.toLowerCase())
        );
      
      const matchesDisponibilidad = !filters.disponibilidad || 
        product.disponibilidad === filters.disponibilidad;
      
      const matchesSucursal = !filters.sucursal || 
        product.sucursal === filters.sucursal;

      const matchesLugar = !filters.lugar || 
        product.lugar === filters.lugar;

      return matchesSearch && matchesDisponibilidad && matchesSucursal && matchesLugar;
    });

    if (filters.sortBy) {
      filtered = [...filtered].sort((a, b) => {
        const aValue = a[filters.sortBy as ProductField]?.toString() || '';
        const bValue = b[filters.sortBy as ProductField]?.toString() || '';
        
        const comparison = aValue.localeCompare(bValue, 'es', { numeric: true });
        return filters.sortOrder === 'desc' ? -comparison : comparison;
      });
    }

    return filtered;
  }, [products, filters]);

  const handleSort = (field: ProductField) => {
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

  const getSortIcon = (field: ProductField) => {
    if (filters.sortBy !== field) return <ArrowUpDown className="w-4 h-4 opacity-50" />;
    return filters.sortOrder === 'asc' ? 
      <ArrowUp className="w-4 h-4 text-blue-600" /> : 
      <ArrowDown className="w-4 h-4 text-blue-600" />;
  };

  const getStatusColor = (disponibilidad: string) => {
    switch (disponibilidad?.toUpperCase()) {
      case 'STOCK': return 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border-blue-300';
      case 'FACTURADO': return 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 border-green-300';
      case 'VENDIDO': return 'bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 border-purple-300';
      case 'ENTREGADO': return 'bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-800 border-emerald-300';
      case 'EN CIABAY': return 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border-yellow-300';
      default: return 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border-gray-300';
    }
  };

  const formatCellValue = (value: any, column: any) => {
    if (!value) return '';
    
    switch (column.type) {
      case 'number':
        return typeof value === 'number' ? value.toLocaleString() : value;
      case 'date':
        return value instanceof Date ? value.toLocaleDateString() : value;
      case 'select':
        if (column.key === 'disponibilidad') {
          return (
            <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(value)}`}>
              {value}
            </span>
          );
        }
        return value;
      case 'url':
        return value ? (
          <button
            onClick={() => onOpenLink?.(value, 'Enlace del producto')}
            className="text-blue-400 hover:text-blue-300 underline text-xs"
            title="Abrir enlace"
          >
            Ver enlace
          </button>
        ) : '';
      default:
        return value;
    }
  };

  const formatArrivalLocation = (llegada: string) => {
    if (!llegada) return '';
    
    if (llegada.includes('-') && llegada.includes('.')) {
      return (
        <div className="flex items-center space-x-1">
          <Calendar className="w-3 h-3 text-orange-500" />
          <span className="text-orange-700 font-medium bg-orange-50 px-2 py-1 rounded-lg text-xs border border-orange-200">
            {llegada}
          </span>
        </div>
      );
    }
    
    if (llegada.includes('EN CIABAY')) {
      return (
        <div className="flex items-center space-x-1">
          <MapPin className="w-3 h-3 text-blue-500" />
          <span className="text-blue-700 font-medium bg-blue-50 px-2 py-1 rounded-lg text-xs border border-blue-200">
            EN CIABAY
          </span>
        </div>
      );
    }
    
    if (llegada.includes('EN PACTUS')) {
      return (
        <div className="flex items-center space-x-1">
          <MapPin className="w-3 h-3 text-green-500" />
          <span className="text-green-700 font-medium bg-green-50 px-2 py-1 rounded-lg text-xs border border-green-200">
            EN PACTUS
          </span>
        </div>
      );
    }
    
    if (llegada.includes('ENTREGADO')) {
      return (
        <div className="flex items-center space-x-1">
          <Package className="w-3 h-3 text-emerald-500" />
          <span className="text-emerald-700 font-medium bg-emerald-50 px-2 py-1 rounded-lg text-xs border border-emerald-200">
            ENTREGADO
          </span>
        </div>
      );
    }
    
    return llegada;
  };

  return (
    <>
      <div className="bg-white/20 backdrop-blur-lg rounded-lg border border-white/30 overflow-hidden shadow-lg">
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-white/30">
          <h3 className="text-sm sm:text-base font-medium text-gray-800">Implementos</h3>
          {isAuthenticated && (
            <button
              onClick={() => setShowColumnManager(true)}
              className="inline-flex items-center px-2 sm:px-3 py-1.5 bg-cyan-500/80 backdrop-blur-sm text-white rounded-md hover:bg-cyan-600/80 transition-colors space-x-1 sm:space-x-2 text-xs sm:text-sm border border-cyan-400/30"
            >
              <Settings className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>Gestionar Columnas</span>
            </button>
          )}
        </div>
        
        {/* Mobile Card View */}
        <div className="block sm:hidden">
          {filteredAndSortedProducts.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 bg-white/30 backdrop-blur-sm rounded-lg flex items-center justify-center mx-auto mb-4 border border-white/40">
                <Package className="w-6 h-6 text-gray-500" />
              </div>
              <p className="text-gray-700 font-medium">No se encontraron implementos</p>
              <p className="text-gray-600 text-sm mt-1">Ajusta los filtros para ver resultados</p>
            </div>
          ) : (
            <div className="divide-y divide-white/20">
              {filteredAndSortedProducts.map((product, index) => {
                const rowBgClass = getRowBackgroundClass(product.llegada);
                
                return (
                  <div 
                    key={product.id} 
                    className={`p-4 ${rowBgClass || 'hover:bg-white/10'} transition-colors`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-gray-800 truncate">{product.codigo}</h4>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">{product.descripcion}</p>
                      </div>
                      {isAuthenticated && (
                        <div className="flex space-x-1 ml-2">
                          <button
                            onClick={() => onEdit?.(product)}
                            className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-white/20 backdrop-blur-sm rounded-md transition-colors"
                            title="Editar"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id!)}
                            className={`p-1.5 transition-colors rounded-md ${
                              deleteConfirm === product.id 
                                ? 'text-red-700 bg-red-100/50 backdrop-blur-sm' 
                                : 'text-red-600 hover:text-red-700 hover:bg-white/20 backdrop-blur-sm'
                            }`}
                            title={deleteConfirm === product.id ? 'Confirmar eliminación' : 'Eliminar'}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                          {product.link && (
                            <button
                              onClick={() => onOpenLink?.(product.link!, product.descripcion)}
                              className="p-1.5 text-green-600 hover:text-green-700 hover:bg-white/20 backdrop-blur-sm rounded-md transition-colors"
                              title="Ver enlace"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {product.disponibilidad && (
                        <div>
                          <span className="text-gray-600">Estado:</span>
                          <div className="mt-1">
                            <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(product.disponibilidad)}`}>
                              {product.disponibilidad}
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {product.llegada && (
                        <div>
                          <span className="text-gray-600">Llegada:</span>
                          <div className="mt-1">
                            {formatArrivalLocation(product.llegada)}
                          </div>
                        </div>
                      )}
                      
                      {product.sucursal && (
                        <div>
                          <span className="text-gray-600">Sucursal:</span>
                          <div className="mt-1 text-gray-800">{product.sucursal}</div>
                        </div>
                      )}
                      
                      {product.cliente && (
                        <div>
                          <span className="text-gray-600">Cliente:</span>
                          <div className="mt-1 text-gray-800 truncate">{product.cliente}</div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-white/30 backdrop-blur-sm">
              <tr>
                {visibleColumns.map((column) => (
                  <th 
                    key={column.key}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-white/20 transition-colors"
                    onClick={() => handleSort(column.key as ProductField)}
                  >
                    <div className="flex items-center space-x-2">
                      <span>{column.label}</span>
                      {getSortIcon(column.key as ProductField)}
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
            <tbody className="bg-white/10 backdrop-blur-sm divide-y divide-white/20">
              {filteredAndSortedProducts.map((product, index) => {
                const rowBgClass = getRowBackgroundClass(product.llegada);
                const baseRowClass = index % 2 === 0 ? 'bg-white/5' : 'bg-white/10';
                const finalRowClass = rowBgClass || `${baseRowClass} hover:bg-white/20`;
                
                return (
                  <tr 
                    key={product.id} 
                    className={`transition-colors ${finalRowClass}`}
                  >
                    {visibleColumns.map((column) => (
                      <td key={column.key} className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">
                        {column.key === 'llegada' ? 
                          formatArrivalLocation(product[column.key]) : 
                          formatCellValue(product[column.key], column)
                        }
                      </td>
                    ))}
                    {isAuthenticated && (
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => onEdit?.(product)}
                            className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-white/20 backdrop-blur-sm rounded-md transition-colors"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id!)}
                            className={`p-2 transition-all duration-200 rounded-lg ${
                              deleteConfirm === product.id 
                                ? 'text-red-700 bg-red-100/50 backdrop-blur-sm border border-red-300' 
                                : 'text-red-600 hover:text-red-700 hover:bg-white/20 backdrop-blur-sm'
                            }`}
                            title={deleteConfirm === product.id ? 'Confirmar eliminación' : 'Eliminar'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          {product.link && (
                            <button
                              onClick={() => onOpenLink?.(product.link!, product.descripcion)}
                              className="p-1.5 text-green-600 hover:text-green-700 hover:bg-white/20 backdrop-blur-sm rounded-md transition-colors"
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
        
        {filteredAndSortedProducts.length === 0 && (
          <div className="text-center py-12 sm:py-16 hidden sm:block">
            <div className="w-12 h-12 bg-white/30 backdrop-blur-sm rounded-lg flex items-center justify-center mx-auto mb-4 border border-white/40">
              <Package className="w-6 h-6 text-gray-500" />
            </div>
            <p className="text-gray-700 font-medium">No se encontraron implementos</p>
            <p className="text-gray-600 text-sm mt-1">Ajusta los filtros para ver resultados</p>
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
        title="Gestión de Columnas - Implementos"
      />
    </>
  );
};

export default DynamicProductTable;