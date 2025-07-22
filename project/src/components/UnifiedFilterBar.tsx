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
    <div className="bg-black/20 dark:bg-gray-900/40 backdrop-blur-xl p-4 sm:p-6 rounded-2xl border border-white/10 dark:border-gray-700/20 mb-6 sm:mb-8">
      <div className="flex items-center mb-4 sm:mb-6">
        <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 dark:text-blue-300 mr-3" />
        <h3 className="text-sm sm:text-base font-semibold text-white dark:text-gray-200">Filtros del Inventario</h3>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="relative group">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar en inventario..."
            value={filters.searchTerm}
            onChange={(e) => onFiltersChange({
              ...filters,
              searchTerm: e.target.value
            })}
            className="w-full pl-10 pr-3 py-3 bg-black/30 dark:bg-gray-800/50 backdrop-blur-sm border border-white/20 dark:border-gray-600/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-white dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500"
          />
        </div>
        
        <div className="relative">
          <select
            value={filters.type}
            onChange={(e) => onFiltersChange({
              ...filters,
              type: e.target.value as 'ALL' | 'IMPLEMENTO' | 'MAQUINA'
            })}
            className="w-full px-3 py-3 bg-black/30 dark:bg-gray-800/50 backdrop-blur-sm border border-white/20 dark:border-gray-600/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-white dark:text-gray-200"
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
            className="w-full px-3 py-3 bg-black/30 dark:bg-gray-800/50 backdrop-blur-sm border border-white/20 dark:border-gray-600/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-white dark:text-gray-200"
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
            className="w-full px-3 py-3 bg-black/30 dark:bg-gray-800/50 backdrop-blur-sm border border-white/20 dark:border-gray-600/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-white dark:text-gray-200"
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
            className="w-full px-3 py-3 bg-black/30 dark:bg-gray-800/50 backdrop-blur-sm border border-white/20 dark:border-gray-600/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-white dark:text-gray-200"
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
            className="w-full px-3 py-3 bg-black/30 dark:bg-gray-800/50 backdrop-blur-sm border border-white/20 dark:border-gray-600/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-white dark:text-gray-200"
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