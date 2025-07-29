import React from 'react';
import { Package } from 'lucide-react';
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
      icon: Package,
      color: 'from-gray-600 to-gray-700',
      bgColor: 'from-gray-50 to-gray-100'
    }
  ];

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center py-4 sm:py-6">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onPageChange(item.id)}
                className={`flex items-center space-x-3 sm:space-x-4 px-8 sm:px-12 py-3 sm:py-4 rounded-lg font-semibold transition-colors text-base sm:text-lg
                  ${isActive 
                    ? 'bg-gray-800 text-white shadow-md border border-gray-700' 
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100 border border-transparent hover:border-gray-300'
                  }
                `}
              >
                <Icon className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
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