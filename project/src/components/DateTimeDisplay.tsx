import React, { useState, useEffect } from 'react';
import { Clock, Calendar } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

const DateTimeDisplay: React.FC = () => {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const { theme } = useTheme();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <>
    <div className="bg-white/10 dark:bg-gray-900/10 backdrop-blur-lg border-b border-white/20 dark:border-gray-700/20 shadow-lg sm:block hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center py-1.5">
          <div className="flex items-center space-x-4 text-xs sm:text-sm">
            <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-300">
              <div className="w-5 h-5 bg-white/20 dark:bg-gray-800/20 backdrop-blur-sm rounded-md flex items-center justify-center shadow-lg border border-white/30 dark:border-gray-700/30">
                <Calendar className="w-2.5 h-2.5 text-cyan-600" />
              </div>
              <span className="font-medium capitalize hidden sm:inline">
                {formatDate(currentDateTime)}
              </span>
              <span className="font-medium capitalize sm:hidden">
                {currentDateTime.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
              </span>
            </div>
            
            <div className="w-px h-3 bg-gray-300"></div>
            
            <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-300">
              <div className="w-5 h-5 bg-white/20 dark:bg-gray-800/20 backdrop-blur-sm rounded-md flex items-center justify-center shadow-lg border border-white/30 dark:border-gray-700/30">
                <Clock className="w-2.5 h-2.5 text-cyan-600" />
              </div>
              <span className="font-mono font-medium">
                {formatTime(currentDateTime)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    {/* Mobile compact date/time */}
    <div className="bg-white/10 dark:bg-gray-900/10 backdrop-blur-lg border-b border-white/20 dark:border-gray-700/20 sm:hidden">
      <div className="px-4 py-1">
        <div className="flex items-center justify-between text-xs text-gray-700 dark:text-gray-300">
          <div className="flex items-center space-x-1">
            <Calendar className="w-3 h-3 text-cyan-600" />
            <span>{currentDateTime.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="w-3 h-3 text-cyan-600" />
            <span className="font-mono">{formatTime(currentDateTime)}</span>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default DateTimeDisplay;