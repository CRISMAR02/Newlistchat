import React, { useState } from 'react';
import { Package, Truck, CheckCircle, Clock, AlertTriangle, Factory, Ship, Wrench, Filter, Search, X } from 'lucide-react';

interface ProcessNode {
  id: string;
  title: string;
  count: number;
  status: 'pending' | 'active' | 'completed' | 'warning';
  icon: React.ComponentType<any>;
}

interface ProcessFlowDiagramProps {
  nodes: ProcessNode[];
  onNodeClick?: (node: ProcessNode) => void;
  onFilterChange?: (filter: string) => void;
}

const ProcessFlowDiagram: React.FC<ProcessFlowDiagramProps> = ({ nodes, onNodeClick, onFilterChange }) => {
  const [showMiniFilter, setShowMiniFilter] = useState(false);
  const [filterValue, setFilterValue] = useState('');

  const handleFilterChange = (value: string) => {
    setFilterValue(value);
    onFilterChange?.(value);
  };

  const clearFilter = () => {
    setFilterValue('');
    onFilterChange?.('');
  };

  const getNodeColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500 dark:bg-green-600';
      case 'active':
        return 'bg-blue-500 dark:bg-blue-600';
      case 'warning':
        return 'bg-yellow-500 dark:bg-yellow-600';
      default:
        return 'bg-gray-400 dark:bg-gray-600';
    }
  };

  const getNodeBorder = (status: string) => {
    switch (status) {
      case 'completed':
        return 'border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/20';
      case 'active':
        return 'border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20';
      case 'warning':
        return 'border-yellow-200 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20';
      default:
        return 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Flujo del Proceso</h3>
        
        {/* Mini Filter */}
        <div className="flex items-center space-x-2">
          {showMiniFilter ? (
            <div className="flex items-center space-x-2 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm rounded-lg border border-gray-200/50 dark:border-gray-600/50 px-3 py-2">
              <Search className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <input
                type="text"
                value={filterValue}
                onChange={(e) => handleFilterChange(e.target.value)}
                placeholder="Filtrar procesos..."
                className="bg-transparent border-none outline-none text-sm text-gray-700 dark:text-gray-300 placeholder-gray-500 dark:placeholder-gray-400 w-32"
                autoFocus
              />
              {filterValue && (
                <button
                  onClick={clearFilter}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
              <button
                onClick={() => setShowMiniFilter(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors ml-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowMiniFilter(true)}
              className="flex items-center space-x-1 px-3 py-2 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm rounded-lg border border-gray-200/50 dark:border-gray-600/50 hover:bg-white/70 dark:hover:bg-gray-600/50 transition-all duration-200 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              title="Filtrar procesos"
            >
              <Filter className="w-4 h-4" />
              <span className="text-sm font-medium">Filtrar</span>
            </button>
          )}
        </div>
      </div>
      
      <div className="flex flex-wrap items-center justify-center gap-4">
        {nodes.map((node, index) => {
          const Icon = node.icon;
          
          return (
            <React.Fragment key={node.id}>
              <div
                className={`relative group cursor-pointer transition-all duration-300 hover:scale-105`}
                onClick={() => onNodeClick?.(node)}
              >
                {/* Node Circle */}
                <div className={`w-20 h-20 rounded-full ${getNodeColor(node.status)} flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>
                
                {/* Count Badge */}
                {node.count > 0 && (
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 dark:bg-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg">
                    {node.count > 99 ? '99+' : node.count}
                  </div>
                )}
                
                {/* Node Info */}
                <div className={`absolute top-24 left-1/2 transform -translate-x-1/2 p-3 rounded-lg border-2 ${getNodeBorder(node.status)} min-w-max opacity-0 group-hover:opacity-100 transition-all duration-300 z-10`}>
                  <div className="text-center">
                    <div className="font-semibold text-sm text-gray-900 dark:text-white">{node.title}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">{node.count} items</div>
                  </div>
                </div>
              </div>
              
              {/* Arrow between nodes */}
              {index < nodes.length - 1 && (
                <div className="flex items-center">
                  <div className="w-8 h-0.5 bg-gray-300 dark:bg-gray-600"></div>
                  <div className="w-0 h-0 border-l-4 border-l-gray-300 dark:border-l-gray-600 border-y-2 border-y-transparent"></div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default ProcessFlowDiagram;