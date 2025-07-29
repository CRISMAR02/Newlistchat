import React, { useState, useEffect } from 'react';
import { Clock, Calendar } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

const DateTimeDisplay: React.FC = () => {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

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
    <div className="bg-white border-b border-gray-200 shadow-sm sm:block hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center py-3">
          <div className="flex items-center space-x-6 text-sm sm:text-base">
            <div className="flex items-center space-x-3 text-gray-800">
              <div className="w-8 h-8 bg-gray-100 rounded-md flex items-center justify-center shadow-sm border border-gray-200">
                <Calendar className="w-4 h-4 text-gray-600" />
              </div>
              <span className="font-semibold capitalize hidden sm:inline">
                {formatDate(currentDateTime)}
              </span>
              <span className="font-semibold capitalize sm:hidden">
                {currentDateTime.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
              </span>
            </div>
            
            <div className="w-px h-4 bg-gray-300"></div>
            
            <div className="flex items-center space-x-3 text-gray-800">
              <div className="w-8 h-8 bg-gray-100 rounded-md flex items-center justify-center shadow-sm border border-gray-200">
                <Clock className="w-4 h-4 text-gray-600" />
              </div>
              <span className="font-mono font-semibold text-lg">
                {formatTime(currentDateTime)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    {/* Mobile compact date/time */}
    <div className="bg-white border-b border-gray-200 sm:hidden">
      <div className="px-4 py-1">
        <div className="flex items-center justify-between text-sm text-gray-800">
          <div className="flex items-center space-x-1">
            <Calendar className="w-4 h-4 text-gray-600" />
            <span>{currentDateTime.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="w-4 h-4 text-gray-600" />
            <span className="font-mono font-semibold">{formatTime(currentDateTime)}</span>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default DateTimeDisplay;