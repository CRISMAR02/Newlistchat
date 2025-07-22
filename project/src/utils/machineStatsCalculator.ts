import { Machine, MachineStats, DateRangeSummary } from '../types/machine';

export const calculateMachineStats = (machines: Machine[]): MachineStats => {
  const stats: MachineStats = {
    total: machines.length,
    totalValue: 0,
    byStatus: {},
    byLocation: {},
    recentlyUpdated: 0
  };

  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  machines.forEach(machine => {
    // Count by status
    if (machine.estado) {
      stats.byStatus[machine.estado] = (stats.byStatus[machine.estado] || 0) + 1;
    }

    // Count by location
    if (machine.ubicacion) {
      stats.byLocation[machine.ubicacion] = (stats.byLocation[machine.ubicacion] || 0) + 1;
    }

    // Sum total value
    if (machine.totalAmountUSD) {
      stats.totalValue += machine.totalAmountUSD;
    }

    // Count recently updated machines
    if (machine.updatedAt && new Date(machine.updatedAt) > oneWeekAgo) {
      stats.recentlyUpdated++;
    }
  });

  return stats;
};

export const calculateDateRangeSummary = (machines: Machine[], dateFilter?: string): DateRangeSummary | null => {
  if (!dateFilter) {
    return null;
  }

  // Convert date filter (YYYY-MM) to match cuadroTfDe format (mmm-yy)
  const [year, month] = dateFilter.split('-');
  const monthNames = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 
                     'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const monthAbbr = monthNames[parseInt(month) - 1];
  const yearShort = year.slice(-2);
  const expectedFormat = `${monthAbbr}-${yearShort}`;

  // Filter machines that match the date filter
  const filteredMachines = machines.filter(machine => {
    if (!machine.cuadroTfDe) return false;
    return machine.cuadroTfDe.toLowerCase().includes(expectedFormat);
  });

  if (filteredMachines.length === 0) {
    return null;
  }

  // Aggregate all filtered machines into a single summary
  const summary: DateRangeSummary = {
    dateRange: `${monthAbbr}-${yearShort}`,
    count: filteredMachines.length,
    totalValue: 0,
    totalNC: 0
  };

  filteredMachines.forEach(machine => {
    summary.totalValue += machine.totalAmountUSD || 0;
    summary.totalNC += machine.nc || 0;
  });

  return summary;
};