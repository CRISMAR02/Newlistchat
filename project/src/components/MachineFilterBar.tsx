import React from 'react';
import { Search, Filter, MapPin, Calendar, Sparkles, Calculator } from 'lucide-react';
import { MachineFilterState } from '../types/machine';

interface MachineFilterBarProps {
  filters: MachineFilterState;
  onFiltersChange: (filters: MachineFilterState) => void;
  availableStates: string[];
  availableLocations: string[];
  numericSummary?: {
    count: number;
    totals: Record<string, number>;
  };
}

const MachineFilterBar: React.FC<MachineFilterBarProps> = ({
  filters,
  onFiltersChange,
  availableStates,
  availableLocations,
  numericSummary
}) => {
  return (
    <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
      <div className="bg-slate-800 p-3 sm:p-4 rounded-lg border border-slate-700 shadow-[2px_2px_6px_rgba(0,0,0,0.3),-2px_-2px_6px_rgba(255,255,255,0.1)]">
      <div className="flex items-center mb-2 sm:mb-4">
        <Filter className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400 mr-2" />
        <h3 className="text-xs sm:text-sm font-medium text-white">Filtros</h3>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        <div className="relative group">
          <Search className="absolute left-3 top-2.5 h-3 w-3 sm:h-4 sm:w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar en todos los campos..."
            value={filters.searchTerm}
            onChange={(e) => onFiltersChange({
              ...filters,
              searchTerm: e.target.value
            })}
            className="w-full pl-8 sm:pl-10 pr-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs sm:text-sm text-white placeholder-slate-400 shadow-[inset_1px_1px_3px_rgba(0,0,0,0.3)]"
          />
        </div>
        
        <div className="relative">
          <select
            value={filters.estado}
            onChange={(e) => onFiltersChange({
              ...filters,
              estado: e.target.value
            })}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs sm:text-sm text-white shadow-[inset_1px_1px_3px_rgba(0,0,0,0.3)]"
          >
            <option value="">Todos los estados</option>
            {availableStates.map(state => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>
        </div>
        
        <div className="relative">
          <select
            value={filters.ubicacion}
            onChange={(e) => onFiltersChange({
              ...filters,
              ubicacion: e.target.value
            })}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs sm:text-sm text-white shadow-[inset_1px_1px_3px_rgba(0,0,0,0.3)]"
          >
            <option value="">Todas las ubicaciones</option>
            {availableLocations.map(location => (
              <option key={location} value={location}>{location}</option>
            ))}
          </select>
        </div>

        <div className="relative">
          <input
            type="month"
            value={filters.dateFilter || ''}
            onChange={(e) => onFiltersChange({
              ...filters,
              dateFilter: e.target.value
            })}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs sm:text-sm text-white shadow-[inset_1px_1px_3px_rgba(0,0,0,0.3)]"
            placeholder="Filtrar por fecha"
          />
        </div>
      </div>
      
      {/* Numeric Summary */}
      {numericSummary && numericSummary.count > 0 && Object.keys(numericSummary.totals).length > 0 && (
        <div className="bg-slate-800 p-3 sm:p-4 rounded-lg border border-slate-700 shadow-[2px_2px_6px_rgba(0,0,0,0.3),-2px_-2px_6px_rgba(255,255,255,0.1)]">
          <div className="flex items-center mb-2 sm:mb-3">
            <Calculator className="w-3 h-3 sm:w-4 sm:h-4 text-green-400 mr-2" />
            <h3 className="text-xs sm:text-sm font-medium text-white">Resumen Numérico ({numericSummary.count} registros)</h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
            {Object.entries(numericSummary.totals).map(([field, total]) => (
              <div key={field} className="bg-slate-700 p-2 sm:p-3 rounded-lg">
                <div className="text-xs text-slate-400 uppercase tracking-wider truncate">{field}</div>
                <div className="text-sm sm:text-lg font-bold text-green-400">
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

export default MachineFilterBar;