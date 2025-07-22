import React from 'react';
import { Package, TrendingUp, Clock, MapPin, AlertTriangle, CheckCircle, DollarSign, Truck } from 'lucide-react';
import { MachineStats } from '../types/machine';

interface MachineStatsCardsProps {
  stats: MachineStats;
}

const MachineStatsCards: React.FC<MachineStatsCardsProps> = ({ stats }) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-PY', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const cards = [
    {
      title: 'Total Máquinas',
      value: stats.total.toString(),
      icon: Package,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'from-blue-50 to-blue-100',
      textColor: 'text-blue-700'
    },
    {
      title: 'Valor Total USD',
      value: formatCurrency(stats.totalValue),
      icon: DollarSign,
      color: 'from-green-500 to-green-600',
      bgColor: 'from-green-50 to-green-100',
      textColor: 'text-green-700'
    },
    {
      title: 'En Stock',
      value: stats.byStatus['En Stock - Libre']?.toString() || '0',
      icon: Package,
      color: 'from-indigo-500 to-indigo-600',
      bgColor: 'from-indigo-50 to-indigo-100',
      textColor: 'text-indigo-700'
    },
    {
      title: 'Facturadas',
      value: stats.byStatus['Facturado']?.toString() || '0',
      icon: TrendingUp,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'from-purple-50 to-purple-100',
      textColor: 'text-purple-700'
    },
    {
      title: 'Entregadas',
      value: stats.byStatus['Entregado']?.toString() || '0',
      icon: CheckCircle,
      color: 'from-emerald-500 to-emerald-600',
      bgColor: 'from-emerald-50 to-emerald-100',
      textColor: 'text-emerald-700'
    },
    {
      title: 'En Conferencia',
      value: stats.byStatus['IDA3 - En Conferencia - Libre']?.toString() || '0',
      icon: Clock,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'from-orange-50 to-orange-100',
      textColor: 'text-orange-700'
    },
    {
      title: 'En Matriz',
      value: stats.byLocation['MATRIZ']?.toString() || '0',
      icon: MapPin,
      color: 'from-cyan-500 to-cyan-600',
      bgColor: 'from-cyan-50 to-cyan-100',
      textColor: 'text-cyan-700'
    },
    {
      title: 'Disponible Embarque',
      value: stats.byStatus['Disponible Embarque - Libre']?.toString() || '0',
      icon: Truck,
      color: 'from-teal-500 to-teal-600',
      bgColor: 'from-teal-50 to-teal-100',
      textColor: 'text-teal-700'
    }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2 sm:gap-4 mb-4 sm:mb-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div 
            key={index}
            className="group relative bg-white/20 backdrop-blur-lg rounded-lg p-2 sm:p-4 transition-all duration-300 shadow-lg hover:shadow-xl border border-white/30"
          >
            <div className="flex items-center justify-between">
              <div className="p-1.5 sm:p-2 bg-white/30 backdrop-blur-sm rounded-lg shadow-lg border border-white/40">
                <Icon className="w-3 h-3 sm:w-5 sm:h-5 text-cyan-600" />
              </div>
              <div className="text-right">
                <p className="text-lg sm:text-2xl font-bold text-gray-800">
                  {card.value}
                </p>
                <p className="text-xs sm:text-sm text-gray-600 font-medium">
                  {card.title}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MachineStatsCards;