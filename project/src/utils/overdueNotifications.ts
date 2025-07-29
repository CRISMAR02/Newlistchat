import { Product } from '../types/product';
import { Machine } from '../types/machine';
import { parseArrivalDate, getArrivalStatus } from './dateUtils';
import Swal from 'sweetalert2';

export interface OverdueItem {
  type: 'implemento' | 'maquina';
  codigo: string;
  descripcion: string;
  fecha: string;
  ubicacion?: string;
  estado?: string;
}

export const getOverdueImplements = (products: Product[]): OverdueItem[] => {
  return products
    .filter(product => {
      const status = getArrivalStatus(product.llegada);
      return status === 'overdue';
    })
    .map(product => ({
      type: 'implemento' as const,
      codigo: product.codigo,
      descripcion: product.descripcion || 'Sin descripción',
      fecha: product.llegada,
      ubicacion: product.lugar,
      estado: product.disponibilidad
    }));
};

export const getOverdueMachines = (machines: Machine[]): OverdueItem[] => {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  
  return machines
    .filter(machine => {
      if (!machine.cuadroTfDe) return false;
      
      // Parse cuadroTfDe format (e.g., "feb-25", "mar-25")
      const dateMatch = machine.cuadroTfDe.match(/([a-z]{3})-(\d{2})/i);
      if (!dateMatch) return false;
      
      const [, monthAbbr, yearShort] = dateMatch;
      
      // Map Spanish month abbreviations to numbers
      const monthMap: Record<string, number> = {
        'ene': 0, 'feb': 1, 'mar': 2, 'abr': 3, 'may': 4, 'jun': 5,
        'jul': 6, 'ago': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dic': 11
      };
      
      const monthIndex = monthMap[monthAbbr.toLowerCase()];
      if (monthIndex === undefined) return false;
      
      const year = 2000 + parseInt(yearShort);
      const machineDate = new Date(year, monthIndex, 1); // First day of the month
      
      // Check if the machine date is overdue (past month)
      return machineDate < new Date(currentYear, currentMonth, 1);
    })
    .map(machine => ({
      type: 'maquina' as const,
      codigo: machine.codigo,
      descripcion: machine.descripcion || 'Sin descripción',
      fecha: machine.cuadroTfDe,
      ubicacion: machine.ubicacion,
      estado: machine.estado
    }));
};

export const showOverdueNotification = async (
  overdueImplements: OverdueItem[],
  overdueMachines: OverdueItem[]
) => {
  const totalOverdue = overdueImplements.length + overdueMachines.length;
  
  if (totalOverdue === 0) return;
  
  let message = '<div class="text-left max-h-96 overflow-y-auto">';
  message += `<p class="mb-4 text-gray-700 font-medium">Se encontraron <strong>${totalOverdue}</strong> elementos con fechas vencidas:</p>`;
  
  // Implementos vencidos
  if (overdueImplements.length > 0) {
    message += '<div class="mb-6">';
    message += '<h4 class="text-lg font-semibold text-red-800 mb-3 flex items-center">';
    message += '<span class="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center mr-2 text-sm">🚛</span>';
    message += `Implementos Vencidos (${overdueImplements.length})`;
    message += '</h4>';
    
    // Group by date
    const implementsByDate = overdueImplements.reduce((acc, item) => {
      if (!acc[item.fecha]) acc[item.fecha] = [];
      acc[item.fecha].push(item);
      return acc;
    }, {} as Record<string, OverdueItem[]>);
    
    Object.entries(implementsByDate)
      .sort(([a], [b]) => {
        const dateA = parseArrivalDate(a);
        const dateB = parseArrivalDate(b);
        if (!dateA || !dateB) return 0;
        return dateA.getTime() - dateB.getTime();
      })
      .forEach(([date, items]) => {
        message += `<div class="bg-red-50 p-3 rounded-lg border border-red-200 mb-3">`;
        message += `<div class="flex items-center mb-2">`;
        message += `<span class="inline-flex items-center px-2 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded-full">`;
        message += `📅 ${date}`;
        message += `</span>`;
        message += `<span class="ml-2 text-sm text-gray-600">(${items.length} implemento${items.length > 1 ? 's' : ''})</span>`;
        message += `</div>`;
        
        items.slice(0, 3).forEach(item => {
          message += `<div class="text-sm text-gray-700 mb-1">`;
          message += `<strong>${item.codigo}</strong> - ${item.descripcion.substring(0, 50)}${item.descripcion.length > 50 ? '...' : ''}`;
          if (item.estado) {
            message += ` <span class="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full ml-2">${item.estado}</span>`;
          }
          message += `</div>`;
        });
        
        if (items.length > 3) {
          message += `<div class="text-xs text-gray-500 mt-1">... y ${items.length - 3} más</div>`;
        }
        
        message += `</div>`;
      });
    
    message += '</div>';
  }
  
  // Máquinas vencidas
  if (overdueMachines.length > 0) {
    message += '<div class="mb-4">';
    message += '<h4 class="text-lg font-semibold text-orange-800 mb-3 flex items-center">';
    message += '<span class="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center mr-2 text-sm">⚙️</span>';
    message += `Máquinas Vencidas (${overdueMachines.length})`;
    message += '</h4>';
    
    // Group by date
    const machinesByDate = overdueMachines.reduce((acc, item) => {
      if (!acc[item.fecha]) acc[item.fecha] = [];
      acc[item.fecha].push(item);
      return acc;
    }, {} as Record<string, OverdueItem[]>);
    
    Object.entries(machinesByDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([date, items]) => {
        message += `<div class="bg-orange-50 p-3 rounded-lg border border-orange-200 mb-3">`;
        message += `<div class="flex items-center mb-2">`;
        message += `<span class="inline-flex items-center px-2 py-1 text-xs font-semibold bg-orange-100 text-orange-800 rounded-full">`;
        message += `📅 ${date}`;
        message += `</span>`;
        message += `<span class="ml-2 text-sm text-gray-600">(${items.length} máquina${items.length > 1 ? 's' : ''})</span>`;
        message += `</div>`;
        
        items.slice(0, 3).forEach(item => {
          message += `<div class="text-sm text-gray-700 mb-1">`;
          message += `<strong>${item.codigo}</strong> - ${item.descripcion.substring(0, 50)}${item.descripcion.length > 50 ? '...' : ''}`;
          if (item.estado) {
            message += ` <span class="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full ml-2">${item.estado}</span>`;
          }
          message += `</div>`;
        });
        
        if (items.length > 3) {
          message += `<div class="text-xs text-gray-500 mt-1">... y ${items.length - 3} más</div>`;
        }
        
        message += `</div>`;
      });
    
    message += '</div>';
  }
  
  message += '</div>';
  
  await Swal.fire({
    icon: 'warning',
    title: '⚠️ Fechas Vencidas Detectadas',
    html: message,
    confirmButtonText: 'Entendido',
    confirmButtonColor: '#dc2626',
    width: '700px',
    customClass: {
      popup: 'text-left'
    },
    showClass: {
      popup: 'animate__animated animate__fadeInDown animate__faster'
    },
    hideClass: {
      popup: 'animate__animated animate__fadeOutUp animate__faster'
    }
  });
};

export const checkAllOverdueItems = async (products: Product[], machines: Machine[]) => {
  const overdueImplements = getOverdueImplements(products);
  const overdueMachines = getOverdueMachines(machines);
  
  await showOverdueNotification(overdueImplements, overdueMachines);
  
  return {
    implementsCount: overdueImplements.length,
    machinesCount: overdueMachines.length,
    totalCount: overdueImplements.length + overdueMachines.length
  };
};