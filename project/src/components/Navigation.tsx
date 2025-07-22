import React from 'react';
import { Truck, Settings, Layers } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

interface NavigationProps {
  currentPage: 'unified';
  onPageChange: (page: 'unified') => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentPage, onPageChange }) => {
  const { theme } = useTheme();
  
  const navItems = [
    {
      id: 'unified' as const,
      label: 'Inventario Unificado',
      icon: Layers,
      color: 'from-purple-600 to-indigo-600',
      bgColor: 'from-purple-50 to-indigo-50'
    }
  ];

  return (
    <nav className="bg-white/10 dark:bg-gray-900/10 backdrop-blur-lg shadow-lg border-b border-white/20 dark:border-gray-700/20 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center py-2 sm:py-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onPageChange(item.id)}
                className={`flex items-center space-x-2 sm:space-x-3 px-6 sm:px-8 py-2 rounded-lg font-medium transition-colors text-sm
                  ${isActive 
                    ? 'bg-cyan-500/80 dark:bg-cyan-600/80 backdrop-blur-sm text-white shadow-lg border border-cyan-400/30 dark:border-cyan-500/30' 
                    : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/20 dark:hover:bg-gray-700/20 backdrop-blur-sm border border-transparent hover:border-white/30 dark:hover:border-gray-600/30'
                  }
                `}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;