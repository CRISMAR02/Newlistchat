export interface Machine {
  id?: string;
  orderNr: string;
  codigo: string;
  descripcion: string;
  chasis: string;
  po: string;
  model: string;
  plant: string;
  orderPrice: number;
  totalPerUnit: number;
  totalAmountUSD: number;
  nc: number;
  cuadroTfDe: string;
  estado: string;
  llegada: string;
  ubicacion: string;
  link?: string;
  createdAt?: Date;
  updatedAt?: Date;
  // Dynamic fields
  [key: string]: any;
}

export type MachineField = keyof Omit<Machine, 'id' | 'createdAt' | 'updatedAt'>;

export interface MachineFilterState {
  searchTerm: string;
  estado: string;
  ubicacion: string;
  dateFilter?: string;
  sortBy: MachineField | '';
  sortOrder: 'asc' | 'desc';
}

export interface MachineStats {
  total: number;
  totalValue: number;
  byStatus: Record<string, number>;
  byLocation: Record<string, number>;
  recentlyUpdated: number;
}

export interface DateRangeSummary {
  dateRange: string;
  count: number;
  totalValue: number;
  totalNC: number;
}

export interface MachineColumnConfig {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'url';
  required?: boolean;
  options?: string[];
  visible: boolean;
  order: number;
}

export interface MachineTableSettings {
  columns: MachineColumnConfig[];
  defaultColumns: string[];
}