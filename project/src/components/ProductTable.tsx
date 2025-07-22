import React, { useState, useMemo } from 'react';
import { Edit, Trash2, ArrowUpDown, ArrowUp, ArrowDown, Calendar, MapPin, DollarSign, Package } from 'lucide-react';
import { Product, ProductField, FilterState } from '../types/product';
import { getRowBackgroundClass } from '../utils/dateUtils';

interface ProductTableProps {
  products: Product[];
  onEdit?: (product: Product) => void;
  onDelete?: (id: string) => void;
  isAuthenticated: boolean;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

const ProductTable: React.FC<ProductTableProps> = ({
  products,
  onEdit,
  onDelete,
  isAuthenticated,
  filters,
  onFiltersChange
}) => {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

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
    switch (disponibilidad.toUpperCase()) {
      case 'STOCK': return 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border-blue-300';
      case 'FACTURADO': return 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 border-green-300';
      case 'VENDIDO': return 'bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 border-purple-300';
      case 'ENTREGADO': return 'bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-800 border-emerald-300';
      case 'EN CIABAY': return 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border-yellow-300';
      default: return 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (disponibilidad: string) => {
    switch (disponibilidad.toUpperCase()) {
      case 'STOCK': return <Package className="w-3 h-3 mr-1" />;
      case 'FACTURADO': return <DollarSign className="w-3 h-3 mr-1" />;
      case 'VENDIDO': return <DollarSign className="w-3 h-3 mr-1" />;
      case 'ENTREGADO': return <Package className="w-3 h-3 mr-1" />;
      default: return null;
    }
  };

  const formatArrivalLocation = (llegada: string) => {
    if (!llegada) return '';
    
    // Si contiene fecha (formato como "21-jul.")
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
    
    // Si está en una ubicación física
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
    <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl overflow-hidden border border-gray-100">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
            <tr>
              <th 
                className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-all duration-200 group"
                onClick={() => handleSort('codigo')}
              >
                <div className="flex items-center space-x-2">
                  <span>Código</span>
                  <div className="group-hover:scale-110 transition-transform duration-200">
                    {getSortIcon('codigo')}
                  </div>
                </div>
              </th>
              <th 
                className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-all duration-200 group"
                onClick={() => handleSort('proforma')}
              >
                <div className="flex items-center space-x-2">
                  <span>Proforma</span>
                  <div className="group-hover:scale-110 transition-transform duration-200">
                    {getSortIcon('proforma')}
                  </div>
                </div>
              </th>
              <th 
                className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-all duration-200 group"
                onClick={() => handleSort('factura')}
              >
                <div className="flex items-center space-x-2">
                  <span>Factura</span>
                  <div className="group-hover:scale-110 transition-transform duration-200">
                    {getSortIcon('factura')}
                  </div>
                </div>
              </th>
              <th 
                className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-all duration-200 group"
                onClick={() => handleSort('disponibilidad')}
              >
                <div className="flex items-center space-x-2">
                  <span>Estado</span>
                  <div className="group-hover:scale-110 transition-transform duration-200">
                    {getSortIcon('disponibilidad')}
                  </div>
                </div>
              </th>
              <th 
                className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-all duration-200 group"
                onClick={() => handleSort('descripcion')}
              >
                <div className="flex items-center space-x-2">
                  <span>Descripción</span>
                  <div className="group-hover:scale-110 transition-transform duration-200">
                    {getSortIcon('descripcion')}
                  </div>
                </div>
              </th>
              <th 
                className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-all duration-200 group"
                onClick={() => handleSort('llegada')}
              >
                <div className="flex items-center space-x-2">
                  <span>Ubicación/Llegada</span>
                  <div className="group-hover:scale-110 transition-transform duration-200">
                    {getSortIcon('llegada')}
                  </div>
                </div>
              </th>
              <th 
                className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-all duration-200 group"
                onClick={() => handleSort('sucursal')}
              >
                <div className="flex items-center space-x-2">
                  <span>Sucursal</span>
                  <div className="group-hover:scale-110 transition-transform duration-200">
                    {getSortIcon('sucursal')}
                  </div>
                </div>
              </th>
              <th 
                className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-all duration-200 group"
                onClick={() => handleSort('cliente')}
              >
                <div className="flex items-center space-x-2">
                  <span>Cliente</span>
                  <div className="group-hover:scale-110 transition-transform duration-200">
                    {getSortIcon('cliente')}
                  </div>
                </div>
              </th>
              <th 
                className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-all duration-200 group"
                onClick={() => handleSort('lugar')}
              >
                <div className="flex items-center space-x-2">
                  <MapPin className="w-3 h-3" />
                  <span>Lugar</span>
                  <div className="group-hover:scale-110 transition-transform duration-200">
                    {getSortIcon('lugar')}
                  </div>
                </div>
              </th>
              {isAuthenticated && (
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Acciones
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white/50 backdrop-blur-sm divide-y divide-gray-200">
            {filteredAndSortedProducts.map((product, index) => {
              const rowBgClass = getRowBackgroundClass(product.llegada);
              const baseRowClass = index % 2 === 0 ? 'bg-white/30' : 'bg-gray-50/30';
              const finalRowClass = rowBgClass || `${baseRowClass} hover:bg-blue-50/50`;
              
              return (
                <tr 
                  key={product.id} 
                  className={`transition-all duration-200 ${finalRowClass}`}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    {product.codigo}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {product.proforma}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {product.factura}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(product.disponibilidad)}`}>
                      {getStatusIcon(product.disponibilidad)}
                      {product.disponibilidad}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate" title={product.descripcion}>
                    {product.descripcion}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {formatArrivalLocation(product.llegada)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {product.sucursal}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {product.cliente}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${
                      product.lugar === 'CIABAY' ? 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border-blue-200' : 
                      product.lugar === 'PACTUS' ? 'bg-gradient-to-r from-green-50 to-green-100 text-green-700 border-green-200' : 
                      product.lugar === 'CIABAY/PACTUS' ? 'bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700 border-purple-200' :
                      'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 border-gray-200'
                    }`}>
                      {product.lugar}
                    </span>
                  </td>
                  {isAuthenticated && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => onEdit?.(product)}
                          className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-100 rounded-lg transition-all duration-200"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id!)}
                          className={`p-2 transition-all duration-200 rounded-lg ${
                            deleteConfirm === product.id 
                              ? 'text-red-800 bg-red-100 border border-red-300' 
                              : 'text-red-600 hover:text-red-900 hover:bg-red-100'
                          }`}
                          title={deleteConfirm === product.id ? 'Confirmar eliminación' : 'Eliminar'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 text-lg font-medium">No se encontraron productos</p>
          <p className="text-gray-400 text-sm mt-1">Intenta ajustar los filtros de búsqueda</p>
        </div>
      )}
    </div>
  );
};

export default ProductTable;