export interface InventoryItem {
  id?: string;
  type: 'IMPLEMENTO' | 'MAQUINA';
  
  // Columnas principales requeridas
  proveedor: string;
  codigo: string;
  proforma: string;
  po: string; // P.O
  factura: string;
  estado: string;
  descripcion: string;
  
  // Fechas
  fechaProduccion: string; // FECHA DE PRODUCCION
  fechaEmbarque: string;   // FECHA DE EMBARQUE
  fechaLlegada: string;    // FECHA DE LLEGADA
  fechaEntrega: string;    // FECHA DE ENTREGA
  
  // Información adicional
  cliente: string;
  lugar: string;
  chassis: string;
  cr: number; // CR (VARIABLE EN NUMERO)
  orderNr: string; // ORDER NR
  
  // Campos del sistema
  createdAt?: Date;
  updatedAt?: Date;
  link?: string;
  
  // Dynamic fields para compatibilidad
  [key: string]: any;
}

export interface InventoryFilterState {
  searchTerm: string;
  type: 'ALL' | 'IMPLEMENTO' | 'MAQUINA';
  proveedor: string;
  estado: string;
  lugar: string;
  cliente: string;
  dateFilter?: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface InventoryStats {
  total: number;
  implementos: number;
  maquinas: number;
  totalCR: number;
  byProveedor: Record<string, number>;
  byEstado: Record<string, number>;
  byLugar: Record<string, number>;
  byCliente: Record<string, number>;
  pendingProduction: number;
  pendingShipment: number;
  pendingDelivery: number;
  recentlyUpdated: number;
}

export interface Department {
  id: string;
  name: string;
  color: string;
  bgColor: string;
  textColor: string;
  icon: string;
  description: string;
}

export interface CustomState {
  id: string;
  name: string;
  departmentId: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface StateManagementConfig {
  departments: Department[];
  customStates: CustomState[];
  defaultStates: string[];
}