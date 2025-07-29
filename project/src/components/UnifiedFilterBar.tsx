import React from 'react';
import { Search, Filter, Layers, Package, Settings, Users, MapPin } from 'lucide-react';
import { InventoryFilterState } from '../types/inventory';

interface UnifiedFilterBarProps {
  filters: InventoryFilterState;
  onFiltersChange: (filters: InventoryFilterState) => void;
  availableProveedores: string[];
  availableEstados: string[];
  availableLugares: string[];
  availableClientes: string[];
}

const UnifiedFilterBar: React.FC<UnifiedFilterBarProps> = ({
  filters,
  onFiltersChange,
  availableProveedores,
  availableEstados,
  availableLugares,
  availableClientes
}) => {
  return (
    <div className="bg-white p-6 sm:p-8 rounded-lg border border-gray-200 shadow-sm mb-6 sm:mb-8">
      <div className="flex items-center mb-4 sm:mb-6">
        <Filter className="w-6 h-6 text-gray-600 mr-4" />
        <h3 className="text-lg sm:text-xl font-bold text-gray-900">Filtros del Inventario</h3>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="relative group">
          <Search className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar en inventario..."
            value={filters.searchTerm}
            onChange={(e) => onFiltersChange({
              ...filters,
              searchTerm: e.target.value
            })}
            className="w-full pl-12 pr-4 py-4 bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 text-base text-gray-900 placeholder-gray-500"
          />
        </div>
        
        <div className="relative">
          <select
            value={filters.type}
            onChange={(e) => onFiltersChange({
              ...filters,
              type: e.target.value as 'ALL' | 'IMPLEMENTO' | 'MAQUINA'
            })}
            className="w-full px-4 py-4 bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 text-base text-gray-900"
          >
            <option value="ALL">Todos los tipos</option>
            <option value="IMPLEMENTO">Solo Implementos</option>
            <option value="MAQUINA">Solo Máquinas</option>
          </select>
        </div>
        
        <div className="relative">
          <select
            value={filters.proveedor}
            onChange={(e) => onFiltersChange({
              ...filters,
              proveedor: e.target.value
            })}
            className="w-full px-4 py-4 bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 text-base text-gray-900"
          >
            <option value="">Todos los proveedores</option>
            {availableProveedores.map(proveedor => (
              <option key={proveedor} value={proveedor}>{proveedor}</option>
            ))}
          </select>
        </div>
        
        <div className="relative">
          <select
            value={filters.estado}
            onChange={(e) => onFiltersChange({
              ...filters,
              estado: e.target.value
            })}
            className="w-full px-4 py-4 bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 text-base text-gray-900"
          >
            <option value="">Todos los estados</option>
            {availableEstados.map(estado => (
              <option key={estado} value={estado}>{estado}</option>
            ))}
          </select>
        </div>
        
        <div className="relative">
          <select
            value={filters.lugar}
            onChange={(e) => onFiltersChange({
              ...filters,
              lugar: e.target.value
            })}
            className="w-full px-4 py-4 bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 text-base text-gray-900"
          >
            <option value="">Todos los lugares</option>
            {availableLugares.map(lugar => (
              <option key={lugar} value={lugar}>{lugar}</option>
            ))}
          </select>
        </div>

        <div className="relative">
          <select
            value={filters.cliente}
            onChange={(e) => onFiltersChange({
              ...filters,
              cliente: e.target.value
            })}
            className="w-full px-4 py-4 bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 text-base text-gray-900"
          >
            <option value="">Todos los clientes</option>
            {availableClientes.map(cliente => (
              <option key={cliente} value={cliente}>{cliente}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default UnifiedFilterBar;