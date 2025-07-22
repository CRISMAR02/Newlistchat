import React from 'react';
import { Search, Filter, MapPin, Calendar, Sparkles, Calculator } from 'lucide-react';
import { FilterState } from '../types/product';

interface FilterBarProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  availableStates: string[];
  availableBranches: string[];
  availablePlaces: string[];
  numericSummary?: {
    count: number;
    totals: Record<string, number>;
  };
}

const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFiltersChange,
  availableStates,
  availableBranches,
  availablePlaces,
  numericSummary
}) => {
  return (
    <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
      <div className="bg-white/20 backdrop-blur-lg p-3 sm:p-4 rounded-lg border border-white/30 shadow-lg">
      <div className="flex items-center mb-2 sm:mb-3">
        <Filter className="w-3 h-3 sm:w-4 sm:h-4 text-cyan-600 mr-2" />
        <h3 className="text-xs sm:text-sm font-medium text-gray-800">Filtros</h3>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-4">
        <div className="relative group">
          <Search className="absolute left-3 top-2.5 h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar en todos los campos..."
            value={filters.searchTerm}
            onChange={(e) => onFiltersChange({
              ...filters,
              searchTerm: e.target.value
            })}
            className="w-full pl-8 sm:pl-10 pr-3 py-2 bg-white/30 backdrop-blur-sm border border-white/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-xs sm:text-sm text-gray-800 placeholder-gray-500"
          />
        </div>
        
        <div className="relative group">
          <select
            value={filters.disponibilidad}
            onChange={(e) => onFiltersChange({
              ...filters,
              disponibilidad: e.target.value
            })}
            className="w-full px-3 py-2 bg-white/30 backdrop-blur-sm border border-white/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-xs sm:text-sm text-gray-800"
          >
            <option value="">Todos los estados</option>
            {availableStates.map(state => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>
        </div>
        
        <div className="relative group">
          <select
            value={filters.sucursal}
            onChange={(e) => onFiltersChange({
              ...filters,
              sucursal: e.target.value
            })}
            className="w-full px-3 py-2 bg-white/30 backdrop-blur-sm border border-white/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-xs sm:text-sm text-gray-800"
          >
            <option value="">Todas las sucursales</option>
            {availableBranches.map(branch => (
              <option key={branch} value={branch}>{branch}</option>
            ))}
          </select>
        </div>
        
        <div className="relative group">
          <select
            value={filters.lugar}
            onChange={(e) => onFiltersChange({
              ...filters,
              lugar: e.target.value
            })}
            className="w-full px-3 py-2 bg-white/30 backdrop-blur-sm border border-white/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-xs sm:text-sm text-gray-800"
          >
            <option value="">Todos los lugares</option>
            {availablePlaces.map(place => (
              <option key={place} value={place}>{place}</option>
            ))}
          </select>
        </div>

        <div className="relative group">
          <select
            value={filters.llegada || ''}
            onChange={(e) => onFiltersChange({
              ...filters,
              llegada: e.target.value
            })}
            className="w-full px-3 py-2 bg-white/30 backdrop-blur-sm border border-white/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-xs sm:text-sm text-gray-800"
          >
            <option value="">Todas las ubicaciones</option>
            <option value="EN CIABAY">En CIABAY</option>
            <option value="EN PACTUS">En PACTUS</option>
            <option value="ENTREGADO">Entregados</option>
            <optgroup label="Con fechas de llegada">
              <option value="fecha">Con fecha programada</option>
            </optgroup>
          </select>
        </div>
      </div>
      
      {/* Numeric Summary */}
      {numericSummary && numericSummary.count > 0 && Object.keys(numericSummary.totals).length > 0 && (
        <div className="bg-white/20 backdrop-blur-lg p-3 sm:p-4 rounded-lg border border-white/30 shadow-lg">
          <div className="flex items-center mb-2 sm:mb-3">
            <Calculator className="w-3 h-3 sm:w-4 sm:h-4 text-cyan-600 mr-2" />
            <h3 className="text-xs sm:text-sm font-medium text-gray-800">Resumen Numérico ({numericSummary.count} registros)</h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
            {Object.entries(numericSummary.totals).map(([field, total]) => (
              <div key={field} className="bg-white/30 backdrop-blur-sm p-2 sm:p-3 rounded-lg border border-white/40">
                <div className="text-xs text-gray-600 uppercase tracking-wider truncate">{field}</div>
                <div className="text-sm sm:text-lg font-bold text-cyan-700">
                  {field.toLowerCase().includes('price') || field.toLowerCase().includes('amount') || field === 'nc' ? 
                    `$${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}` :
                    total.toLocaleString()
                  }
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
    </div>
  );
};

export default FilterBar;