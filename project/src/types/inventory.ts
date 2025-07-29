export interface InventoryItem {
  id?: string;
  type: 'IMPLEMENTO' | 'MAQUINA';
  
  // Campos básicos del sistema
  proveedor: string;
  codigo: string;
  proforma: string;
  po: string; // P.O
  factura: string;
  estado: string;
  descripcion: string;
  
  cliente: string;
  lugar: string;
  chassis: string;
  cr: number; // CR (VARIABLE EN NUMERO)
  orderNr: string; // ORDER NR
  
  // Facturación
  id_negociacion: string; // Clave primaria única
  es_emergencia: boolean;
  fecha_produccion: string;
  fecha_facturacion: string;
  destino_llegada: string;
  
  // Logística de entrada
  fecha_embarque: string;
  fecha_llegada: string;
  
  // Post venta
  fecha_carneo: string;
  fecha_reposicion: string;
  pieza_carneada: string; // Texto largo
  cliente_destino: string;
  chasis_destino: string;
  motivo: string; // Texto largo
  fecha_inicio_preparacion: string;
  fecha_fin_preparacion: string;
  entrega_tecnica_programada: string;
  entrega_tecnica_concluida: string;
  
  // Logística de entrega
  fecha_entrega_prevista: string;
  fecha_entrega_concluida: string;
  
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