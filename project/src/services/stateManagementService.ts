import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy,
  where 
} from 'firebase/firestore';
import { db } from './firebase';
import { Department, CustomState, StateManagementConfig } from '../types/inventory';

const DEPARTMENTS_COLLECTION = 'departments';
const CUSTOM_STATES_COLLECTION = 'custom_states';

// Default departments
const DEFAULT_DEPARTMENTS: Omit<Department, 'id'>[] = [
  {
    name: 'Pendiente en Fab',
    color: 'from-gray-500 to-gray-600',
    bgColor: 'from-gray-50 to-gray-100',
    textColor: 'text-gray-700',
    icon: 'Factory',
    description: 'Estados relacionados con la fabricación y producción'
  },
  {
    name: 'Por llegar',
    color: 'from-blue-500 to-blue-600',
    bgColor: 'from-blue-50 to-blue-100',
    textColor: 'text-blue-700',
    icon: 'Ship',
    description: 'Estados de tránsito y logística de entrada'
  },
  {
    name: 'En stock',
    color: 'from-green-500 to-green-600',
    bgColor: 'from-green-50 to-green-100',
    textColor: 'text-green-700',
    icon: 'CheckCircle',
    description: 'Estados de inventario disponible'
  },
  {
    name: 'Procesos / Oportunidades',
    color: 'from-yellow-500 to-yellow-600',
    bgColor: 'from-yellow-50 to-yellow-100',
    textColor: 'text-yellow-700',
    icon: 'Wrench',
    description: 'Estados de procesamiento y oportunidades especiales'
  },
  {
    name: 'Para entrega',
    color: 'from-purple-500 to-purple-600',
    bgColor: 'from-purple-50 to-purple-100',
    textColor: 'text-purple-700',
    icon: 'Truck',
    description: 'Estados de entrega y logística de salida'
  }
];

// Default states mapping
const DEFAULT_STATES_MAPPING: Record<string, string[]> = {
  'En Facturación': [
    'PEDIDO', 
    'APROBACION DE FACTURACION'
  ],
  'Logística de Entrada': [
    'FACTURACION', 
    'FACTURACIÓN',
    'EMBARQUE LIBRE', 
    'TRANSITO', 
    'ADUANA ORIGEN', 
    'ADUANA DESTINO', 
    'IDA 3',
    'IDA3', 
    'DESPACHO'
  ],
  'Stock': [
    'CONFERENCIA', 
    'CONFERIDO', 
    'STOCK ALGESA', 
    'STOCK', 
    'PODER 3RO',
    'PODER DE 3RO',
    'PROCESAMIENTO ESPECIAL',
    'CARNEADO'
  ],
  'Administrativo': [
    'TRAMITE WEB', 
    'SIN CREDITO SIN STOCK M',
    'SIN CREDITO / SIN STOCK M',
    'SIN CREDITO SIN SOLICITUD DE PREPARO M',
    'SIN CREDITO / SIN SOLICITUD DE PREPARO M',
    'SIN CREDITO EN PREPARACION',
    'SIN CREDITO / EN PREPARACION',
    'SIN STOCK M', 
    'SIN SOLICITUD DE PREPARO M', 
    'EN PREPARACION',
    'PREPARACION',
    'PREPARACIÓN',
    'FACTURADO'
  ],
  'Logística de Entrega': [
    'PROGRAMACION DE ENTREGA', 
    'ENTREGA TECNICA',
    'ENTREGA TÉCNICA',
    'CREDITO',
    'CRÉDITO',
    'ENVIADO P12',
    'LOGISTICA ENTREGA'
  ]
};

export const stateManagementService = {
  // Initialize default departments if they don't exist
  async initializeDefaultDepartments(): Promise<void> {
    try {
      const existingDepartments = await this.getAllDepartments();
      
      if (existingDepartments.length === 0) {
        console.log('Initializing default departments...');
        
        for (const dept of DEFAULT_DEPARTMENTS) {
          await addDoc(collection(db, DEPARTMENTS_COLLECTION), {
            ...dept,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
        
        console.log('Default departments initialized');
      }
    } catch (error) {
      console.error('Error initializing default departments:', error);
    }
  },

  // Get all departments
  async getAllDepartments(): Promise<Department[]> {
    try {
      const q = query(collection(db, DEPARTMENTS_COLLECTION), orderBy('name'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Department[];
    } catch (error) {
      console.error('Error fetching departments:', error);
      throw error;
    }
  },

  // Add new department
  async addDepartment(department: Omit<Department, 'id'>): Promise<string> {
    try {
      const departmentWithTimestamp = {
        ...department,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const docRef = await addDoc(collection(db, DEPARTMENTS_COLLECTION), departmentWithTimestamp);
      return docRef.id;
    } catch (error) {
      console.error('Error adding department:', error);
      throw error;
    }
  },

  // Update department
  async updateDepartment(id: string, updates: Partial<Department>): Promise<void> {
    try {
      const departmentRef = doc(db, DEPARTMENTS_COLLECTION, id);
      await updateDoc(departmentRef, {
        ...updates,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating department:', error);
      throw error;
    }
  },

  // Delete department
  async deleteDepartment(id: string): Promise<void> {
    try {
      // First, check if there are custom states associated with this department
      const associatedStates = await this.getStatesByDepartment(id);
      if (associatedStates.length > 0) {
        throw new Error('No se puede eliminar el departamento porque tiene estados asociados');
      }
      
      await deleteDoc(doc(db, DEPARTMENTS_COLLECTION, id));
    } catch (error) {
      console.error('Error deleting department:', error);
      throw error;
    }
  },

  // Get all custom states
  async getAllCustomStates(): Promise<CustomState[]> {
    try {
      const q = query(collection(db, CUSTOM_STATES_COLLECTION), orderBy('order'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        };
      }) as CustomState[];
    } catch (error) {
      console.error('Error fetching custom states:', error);
      throw error;
    }
  },

  // Get states by department
  async getStatesByDepartment(departmentId: string): Promise<CustomState[]> {
    try {
      const q = query(
        collection(db, CUSTOM_STATES_COLLECTION),
        where('departmentId', '==', departmentId),
        orderBy('order')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        };
      }) as CustomState[];
    } catch (error) {
      console.error('Error fetching states by department:', error);
      throw error;
    }
  },

  // Add new custom state
  async addCustomState(state: Omit<CustomState, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      // Check if state name already exists
      const existingStates = await this.getAllCustomStates();
      const nameExists = existingStates.some(s => s.name.toUpperCase() === state.name.toUpperCase());
      
      if (nameExists) {
        throw new Error(`Ya existe un estado con el nombre "${state.name}"`);
      }

      const stateWithTimestamp = {
        ...state,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const docRef = await addDoc(collection(db, CUSTOM_STATES_COLLECTION), stateWithTimestamp);
      return docRef.id;
    } catch (error) {
      console.error('Error adding custom state:', error);
      throw error;
    }
  },

  // Update custom state
  async updateCustomState(id: string, updates: Partial<CustomState>): Promise<void> {
    try {
      const stateRef = doc(db, CUSTOM_STATES_COLLECTION, id);
      await updateDoc(stateRef, {
        ...updates,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating custom state:', error);
      throw error;
    }
  },

  // Delete custom state
  async deleteCustomState(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, CUSTOM_STATES_COLLECTION, id));
    } catch (error) {
      console.error('Error deleting custom state:', error);
      throw error;
    }
  },

  // Get complete state management configuration
  async getStateManagementConfig(): Promise<StateManagementConfig> {
    try {
      const [departments, customStates] = await Promise.all([
        this.getAllDepartments(),
        this.getAllCustomStates()
      ]);

      // Get all default states
      const defaultStates = Object.values(DEFAULT_STATES_MAPPING).flat();

      return {
        departments,
        customStates,
        defaultStates
      };
    } catch (error) {
      console.error('Error getting state management config:', error);
      throw error;
    }
  },

  // Get all available states (default + custom)
  async getAllAvailableStates(): Promise<string[]> {
    try {
      const customStates = await this.getAllCustomStates();
      const defaultStates = Object.values(DEFAULT_STATES_MAPPING).flat();
      const customStateNames = customStates.filter(s => s.isActive).map(s => s.name);
      
      return [...defaultStates, ...customStateNames].sort();
    } catch (error) {
      console.error('Error getting all available states:', error);
      return Object.values(DEFAULT_STATES_MAPPING).flat();
    }
  },

  // Get states grouped by department (including custom states)
  async getStatesGroupedByDepartment(): Promise<Record<string, { department: Department; states: string[] }>> {
    try {
      const [departments, customStates] = await Promise.all([
        this.getAllDepartments(),
        this.getAllCustomStates()
      ]);

      const grouped: Record<string, { department: Department; states: string[] }> = {};

      // Add default states
      departments.forEach(dept => {
        const defaultStatesForDept = DEFAULT_STATES_MAPPING[dept.name] || [];
        const customStatesForDept = customStates
          .filter(s => s.departmentId === dept.id && s.isActive)
          .map(s => s.name);
        
        grouped[dept.id] = {
          department: dept,
          states: [...defaultStatesForDept, ...customStatesForDept]
        };
      });

      return grouped;
    } catch (error) {
      console.error('Error getting states grouped by department:', error);
      throw error;
    }
  }
};