import React, { useState, useMemo } from 'react';
import { Edit, Trash2, ArrowUpDown, ArrowUp, ArrowDown, Calendar, MapPin, DollarSign, Package, ExternalLink } from 'lucide-react';
import { Machine, MachineField, MachineFilterState } from '../types/machine';

interface MachineTableProps {
  machines: Machine[];
  onEdit?: (machine: Machine) => void;
  onDelete?: (id: string) => void;
  onOpenLink?: (url: string, title: string) => void;
  isAuthenticated: boolean;
  filters: MachineFilterState;
  onFiltersChange: (filters: MachineFilterState) => void;
}

const MachineTable: React.FC<MachineTableProps> = ({
  machines,
  onEdit,
  onDelete,
  onOpenLink,
  isAuthenticated,
  filters,
  onFiltersChange
}) => {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

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

  return (
    <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl overflow-hidden border border-gray-100">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
            <tr>
              <th 
                className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-all duration-200 group"
                onClick={() => handleSort('orderNr')}
              >
                <div className="flex items-center space-x-2">
                  <span>Order Nr.</span>
                  <div className="group-hover:scale-110 transition-transform duration-200">
                    {getSortIcon('orderNr')}
                  </div>
                </div>
              </th>
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
                onClick={() => handleSort('totalAmountUSD')}
              >
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-3 h-3" />
                  <span>Total USD</span>
                  <div className="group-hover:scale-110 transition-transform duration-200">
                    {getSortIcon('totalAmountUSD')}
                  </div>
                </div>
              </th>
              <th 
                className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-all duration-200 group"
                onClick={() => handleSort('cuadroTfDe')}
              >
                <div className="flex items-center space-x-2">
                  <Calendar className="w-3 h-3" />
                  <span>Cuadro TF DE</span>
                  <div className="group-hover:scale-110 transition-transform duration-200">
                    {getSortIcon('cuadroTfDe')}
                  </div>
                </div>
              </th>
              <th 
                className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-all duration-200 group"
                onClick={() => handleSort('estado')}
              >
                <div className="flex items-center space-x-2">
                  <span>Estado</span>
                  <div className="group-hover:scale-110 transition-transform duration-200">
                    {getSortIcon('estado')}
                  </div>
                </div>
              </th>
              <th 
                className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-all duration-200 group"
                onClick={() => handleSort('ubicacion')}
              >
                <div className="flex items-center space-x-2">
                  <MapPin className="w-3 h-3" />
                  <span>Ubicación</span>
                  <div className="group-hover:scale-110 transition-transform duration-200">
                    {getSortIcon('ubicacion')}
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
            {filteredAndSortedMachines.map((machine, index) => {
              const baseRowClass = index % 2 === 0 ? 'bg-white/30' : 'bg-gray-50/30';
              
              return (
                <tr 
                  key={machine.id} 
                  className={`transition-all duration-200 ${baseRowClass} hover:bg-blue-50/50`}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    {machine.orderNr}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    {machine.codigo}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate" title={machine.descripcion}>
                    {machine.descripcion}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-700">
                    {formatCurrency(machine.totalAmountUSD)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                      <Calendar className="w-3 h-3 mr-1" />
                      {machine.cuadroTfDe}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(machine.estado)}`}>
                      {machine.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className="inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full border bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border-blue-200">
                      <MapPin className="w-3 h-3 mr-1" />
                      {machine.ubicacion}
                    </span>
                  </td>
                  {isAuthenticated && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => onEdit?.(machine)}
                          className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-100 rounded-lg transition-all duration-200"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(machine.id!)}
                          className={`p-2 transition-all duration-200 rounded-lg ${
                            deleteConfirm === machine.id 
                              ? 'text-red-800 bg-red-100 border border-red-300' 
                              : 'text-red-600 hover:text-red-900 hover:bg-red-100'
                          }`}
                          title={deleteConfirm === machine.id ? 'Confirmar eliminación' : 'Eliminar'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        {machine.link && (
                          <button
                            onClick={() => onOpenLink?.(machine.link!, machine.descripcion)}
                            className="p-2 text-green-600 hover:text-green-900 hover:bg-green-100 rounded-lg transition-all duration-200"
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
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 text-lg font-medium">No se encontraron máquinas</p>
          <p className="text-gray-400 text-sm mt-1">Intenta ajustar los filtros de búsqueda</p>
        </div>
      )}
    </div>
  );
};

export default MachineTable;