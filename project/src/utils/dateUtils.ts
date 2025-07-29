export const parseArrivalDate = (llegada: string): Date | null => {
  if (!llegada || !llegada.includes('-') || !llegada.includes('.')) {
    return null;
  }

  // Extract date part (e.g., "15-jul." from "15-jul.")
  const dateMatch = llegada.match(/(\d{1,2})-([a-z]{3})\./i);
  if (!dateMatch) return null;

  const [, day, monthAbbr] = dateMatch;
  
  // Map Spanish month abbreviations to numbers
  const monthMap: Record<string, number> = {
    'ene': 0, 'feb': 1, 'mar': 2, 'abr': 3, 'may': 4, 'jun': 5,
    'jul': 6, 'ago': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dic': 11
  };

  const monthIndex = monthMap[monthAbbr.toLowerCase()];
  if (monthIndex === undefined) return null;

  const currentYear = new Date().getFullYear();
  const arrivalDate = new Date(currentYear, monthIndex, parseInt(day));
  
  // If the date is in the past, assume it's next year
  const today = new Date();
  if (arrivalDate < today && (today.getTime() - arrivalDate.getTime()) > 30 * 24 * 60 * 60 * 1000) {
    arrivalDate.setFullYear(currentYear + 1);
  }

  return arrivalDate;
};

export const getArrivalStatus = (llegada: string): 'today' | 'this-week' | 'future' | 'overdue' | 'none' => {
  const arrivalDate = parseArrivalDate(llegada);
  if (!arrivalDate) return 'none';

  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
  
  // Check if it's overdue (past date)
  if (arrivalDate < todayStart) {
    return 'overdue';
  }
  
  // Check if it's today
  if (arrivalDate >= todayStart && arrivalDate < todayEnd) {
    return 'today';
  }

  // Check if it's this week (next 7 days from today)
  const weekEnd = new Date(todayStart.getTime() + 7 * 24 * 60 * 60 * 1000);
  if (arrivalDate >= todayStart && arrivalDate < weekEnd) {
    return 'this-week';
  }

  return 'future';
};

export const getRowBackgroundClass = (llegada: string): string => {
  const status = getArrivalStatus(llegada);
  
  switch (status) {
    case 'overdue':
      return 'bg-red-100/50 hover:bg-red-100/70 border-l-4 border-red-400';
    case 'today':
      return 'bg-red-50/40 hover:bg-red-50/60 border-l-4 border-red-300';
    case 'this-week':
      return 'bg-orange-50/40 hover:bg-orange-50/60 border-l-4 border-orange-300';
    default:
      return '';
  }
};

export const getOverdueProducts = (products: any[]): any[] => {
  return products.filter(product => {
    const status = getArrivalStatus(product.llegada);
    return status === 'overdue';
  });
};

export const formatOverdueMessage = (overdueProducts: any[]): string => {
  if (overdueProducts.length === 0) return '';
  
  const groupedByDate = overdueProducts.reduce((acc, product) => {
    const date = product.llegada;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(product);
    return acc;
  }, {} as Record<string, any[]>);

  let message = '<div class="text-left">';
  message += '<p class="mb-4 text-gray-700 font-medium">Se encontraron productos con fechas de llegada vencidas:</p>';
  message += '<div class="space-y-3 max-h-60 overflow-y-auto">';
  
  Object.entries(groupedByDate)
    .sort(([a], [b]) => {
      const dateA = parseArrivalDate(a);
      const dateB = parseArrivalDate(b);
      if (!dateA || !dateB) return 0;
      return dateA.getTime() - dateB.getTime();
    })
    .forEach(([date, products]) => {
      message += `<div class="bg-red-50 p-3 rounded-lg border border-red-200">`;
      message += `<div class="flex items-center mb-2">`;
      message += `<span class="inline-flex items-center px-2 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded-full">`;
      message += `📅 ${date}`;
      message += `</span>`;
      message += `<span class="ml-2 text-sm text-gray-600">(${products.length} producto${products.length > 1 ? 's' : ''})</span>`;
      message += `</div>`;
      
      products.slice(0, 3).forEach(product => {
        message += `<div class="text-sm text-gray-700 truncate">• ${product.codigo} - ${product.descripcion?.substring(0, 40)}${product.descripcion?.length > 40 ? '...' : ''}</div>`;
      });
      
      if (products.length > 3) {
        message += `<div class="text-xs text-gray-500 mt-1">... y ${products.length - 3} más</div>`;
      }
      
      message += `</div>`;
    });
  
  message += '</div>';
  message += '</div>';
  
  return message;
};