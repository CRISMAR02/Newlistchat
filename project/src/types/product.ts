export interface Product {
  id?: string;
  codigo: string;
  proforma: string;
  factura: string;
  disponibilidad: string;
  descripcion: string;
  llegada: string;
  sucursal: string;
  cliente: string;
  lugar: string;
  createdAt?: Date;
  updatedAt?: Date;
  link?: string;
  // Dynamic fields
  [key: string]: any;
}

export type ProductField = keyof Omit<Product, 'id' | 'createdAt' | 'updatedAt'>;

export interface FilterState {
  searchTerm: string;
  disponibilidad: string;
  sucursal: string;
  lugar: string;
  llegada?: string;
  sortBy: ProductField | '';
  sortOrder: 'asc' | 'desc';
}

export interface ProductStats {
  total: number;
  byStatus: Record<string, number>;
  bySucursal: Record<string, number>;
  byLugar: Record<string, number>;
  pendingDeliveries: number;
  recentlyUpdated: number;
  upcomingArrivals: number;
}

export interface DateRange {
  start: string;
  end: string;
}

export interface ColumnConfig {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select';
  required?: boolean;
  options?: string[];
  visible: boolean;
  order: number;
}

export interface TableSettings {
  columns: ColumnConfig[];
  defaultColumns: string[];
}