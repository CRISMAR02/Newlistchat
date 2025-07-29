import React, { useState, useMemo, useEffect } from 'react';
import { Package, Download, Plus, Upload, RefreshCw, BarChart3, Settings, History, Layers, FileSpreadsheet, Zap, Factory, Ship, Truck, CheckCircle, Clock, AlertTriangle, Wrench, Users, MapPin, DollarSign, FileText } from 'lucide-react';
import { useUnifiedInventory } from '../hooks/useUnifiedInventory';
import { InventoryFilterState, InventoryItem } from '../types/inventory';
import { useAuditLog } from '../hooks/useAuditLog';
import { useTheme } from '../hooks/useTheme';
import UnifiedInventoryTable from './UnifiedInventoryTable';
import UnifiedInventoryModal from './UnifiedInventoryModal';
import UnifiedBulkImportModal from './UnifiedBulkImportModal';
import UnifiedFilterBar from './UnifiedFilterBar';
import UnifiedStatsCards from './UnifiedStatsCards';
import WorkflowCard from './WorkflowCard';
import ProcessFlowDiagram from './ProcessFlowDiagram';
import ThemeToggle from './ThemeToggle';
import AuditLogModal from './AuditLogModal';
import LinkModal from './LinkModal';
import StatusDetailModal from './StatusDetailModal';
import ExportOptionsModal from './ExportOptionsModal';
import CategoryAuthModal from './CategoryAuthModal';
import StateManagementModal from './StateManagementModal';
import ChatToggle from './ChatToggle';
import Swal from 'sweetalert2';

// Contraseña para acciones protegidas
const PROTECTED_PASSWORD = 'Crismar002';

interface UnifiedInventoryPageProps {
  isAuthenticated: boolean;
}

const UnifiedInventoryPage: React.FC<UnifiedInventoryPageProps> = ({ isAuthenticated }) => {
  const { theme } = useTheme();
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [selectedLink, setSelectedLink] = useState({ url: '', title: '' });
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [showExportOptionsModal, setShowExportOptionsModal] = useState(false);
  const [importing, setImporting] = useState(false);
  const [showStatusDetailModal, setShowStatusDetailModal] = useState(false);
  const [selectedStatusGroup, setSelectedStatusGroup] = useState<any>(null);
  const [showCategoryAuthModal, setShowCategoryAuthModal] = useState(false);
  const [pendingStatusGroup, setPendingStatusGroup] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'dashboard' | 'table'>('dashboard');
  const [processFilter, setProcessFilter] = useState('');
  const [showStateManagementModal, setShowStateManagementModal] = useState(false);
  const [isProtectedAuthenticated, setIsProtectedAuthenticated] = useState(false);
  
  const { items, loading, error, stats, addItem, updateItem, deleteItem, importItems, clearAllItems } = useUnifiedInventory();
  const { logProductAction, logMachineAction, logBulkAction, detectChanges } = useAuditLog();
  
  const [filters, setFilters] = useState<InventoryFilterState>({
    searchTerm: '',
    type: 'ALL',
    proveedor: '',
    estado: '',
    lugar: '',
    cliente: '',
    dateFilter: '',
    sortBy: '',
    sortOrder: 'asc'
  });

  const availableProveedores = useMemo(() => {
    const proveedores = [...new Set(items.map(item => item.proveedor).filter(Boolean))];
    return proveedores.sort();
  }, [items]);

  const availableEstados = useMemo(() => {
    const estados = [...new Set(items.map(item => item.estado).filter(Boolean))];
    return estados.sort();
  }, [items]);

  const availableLugares = useMemo(() => {
    const lugares = [...new Set(items.map(item => item.lugar).filter(Boolean))];
    return lugares.sort();
  }, [items]);

  const availableClientes = useMemo(() => {
    const clientes = [...new Set(items.map(item => item.cliente).filter(Boolean))];
    return clientes.sort();
  }, [items]);
  
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = !filters.searchTerm || 
        Object.values(item).some(value => 
          value?.toString().toLowerCase().includes(filters.searchTerm.toLowerCase())
        );
      
      const matchesType = filters.type === 'ALL' || item.type === filters.type;
      const matchesProveedor = !filters.proveedor || item.proveedor === filters.proveedor;
      const matchesEstado = !filters.estado || item.estado === filters.estado;
      const matchesLugar = !filters.lugar || item.lugar === filters.lugar;
      const matchesCliente = !filters.cliente || item.cliente === filters.cliente;

      return matchesSearch && matchesType && matchesProveedor && matchesEstado && matchesLugar && matchesCliente;
    });
  }, [items, filters]);

  // Generate workflow data based on inventory stats
  const workflowData = useMemo(() => {
    // Códigos de acceso para cada departamento
    const departmentCodes = {
      'facturacion': 'FAC20',
      'logistica-entrada': 'Logx25', 
      'stock': 'ST0CK25',
      'administrativo': 'Admi.25',
      'logistica-entrega': 'Logx25'
    };

    const workflows = [
      {
        title: 'En Facturación',
        description: 'Proceso de Facturación',
        icon: DollarSign,
        color: 'bg-gradient-to-br from-green-500 to-green-600',
        departmentCode: departmentCodes['facturacion'],
        steps: [
          {
            id: 'facturacion',
            title: 'Proceso de Facturación',
            description: 'Items en facturación',
            status: (stats.byEstado['PEDIDO'] || 0) > 0 ? 'active' : 'pending',
            assignee: { name: 'Facturación', icon: DollarSign },
            detailedStates: [
              { name: 'Pedidos', count: stats.byEstado['PEDIDO'] || 0, color: 'bg-gray-100 text-gray-800 border-gray-300' },
              { name: 'Aprobación de Facturación', count: stats.byEstado['FACTURACIÓN'] || 0, color: 'bg-yellow-100 text-yellow-800 border-yellow-300' }
            ]
          }
        ]
      },
      {
        title: 'Logística de Entrada',
        description: 'Recepción y Tránsito',
        icon: Truck,
        color: 'bg-gradient-to-br from-orange-500 to-orange-600',
        departmentCode: departmentCodes['logistica-entrada'],
        steps: [
          {
            id: 'recepcion',
            title: 'Recepción y Tránsito',
            description: 'Gestión de entrada',
            status: (stats.byEstado['EMBARQUE LIBRE'] || 0) > 0 ? 'active' : 'pending',
            assignee: { name: 'Logística', icon: Truck },
            detailedStates: [
              { name: 'Facturación', count: stats.byEstado['FACTURACIÓN'] || 0, color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
              { name: 'Embarque Libre', count: stats.byEstado['EMBARQUE LIBRE'] || 0, color: 'bg-blue-100 text-blue-800 border-blue-300' },
              { name: 'Tránsito', count: stats.byEstado['TRANSITO'] || 0, color: 'bg-orange-100 text-orange-800 border-orange-300' }
            ]
          },
          {
            id: 'aduanero',
            title: 'Proceso Aduanero',
            description: 'Trámites aduaneros',
            status: ((stats.byEstado['ADUANA ORIGEN'] || 0) + (stats.byEstado['ADUANA DESTINO'] || 0)) > 0 ? 'active' : 'pending',
            assignee: { name: 'Aduanas', icon: FileText },
            detailedStates: [
              { name: 'Aduana Origen', count: stats.byEstado['ADUANA ORIGEN'] || 0, color: 'bg-purple-100 text-purple-800 border-purple-300' },
              { name: 'Aduana Destino', count: stats.byEstado['ADUANA DESTINO'] || 0, color: 'bg-purple-100 text-purple-800 border-purple-300' },
              { name: 'Ida 3', count: stats.byEstado['IDA 3'] || 0, color: 'bg-indigo-100 text-indigo-800 border-indigo-300' }
            ]
          },
          {
            id: 'despacho',
            title: 'Despacho Local',
            description: 'Despacho y distribución',
            status: (stats.byEstado['DESPACHO'] || 0) > 0 ? 'active' : 'pending',
            assignee: { name: 'Despacho', icon: Ship },
            detailedStates: [
              { name: 'Despacho', count: stats.byEstado['DESPACHO'] || 0, color: 'bg-cyan-100 text-cyan-800 border-cyan-300' }
            ]
          }
        ]
      },
      {
        title: 'Stock',
        description: 'Control de Calidad',
        icon: CheckCircle,
        color: 'bg-gradient-to-br from-blue-500 to-blue-600',
        departmentCode: departmentCodes['stock'],
        steps: [
          {
            id: 'calidad',
            title: 'Control de Calidad',
            description: 'Verificación y conferencia',
            status: ((stats.byEstado['CONFERENCIA'] || 0) + (stats.byEstado['CONFERIDO'] || 0)) > 0 ? 'active' : 'pending',
            assignee: { name: 'Calidad', icon: CheckCircle },
            detailedStates: [
              { name: 'Conferencia', count: stats.byEstado['CONFERENCIA'] || 0, color: 'bg-teal-100 text-teal-800 border-teal-300' },
              { name: 'Conferido', count: stats.byEstado['CONFERIDO'] || 0, color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
              { name: 'Stock Algesa', count: stats.byEstado['STOCK ALGESA'] || 0, color: 'bg-blue-100 text-blue-800 border-blue-300' },
              { name: 'Stock', count: stats.byEstado['STOCK'] || 0, color: 'bg-blue-100 text-blue-800 border-blue-300' }
            ]
          },
          {
            id: 'terceros',
            title: 'Gestión de Terceros',
            description: 'Manejo de terceros',
            status: (stats.byEstado['PODER 3RO'] || 0) > 0 ? 'active' : 'pending',
            assignee: { name: 'Gestión', icon: Users },
            detailedStates: [
              { name: 'Poder de 3ro', count: stats.byEstado['PODER 3RO'] || 0, color: 'bg-pink-100 text-pink-800 border-pink-300' }
            ]
          },
          {
            id: 'especial',
            title: 'Procesamiento Especial',
            description: 'Casos especiales',
            status: (stats.byEstado['CRÉDITO'] || 0) > 0 ? 'active' : 'pending',
            assignee: { name: 'Especial', icon: Wrench },
            detailedStates: [
              { name: 'Carneado()', count: 0, color: 'bg-gray-100 text-gray-800 border-gray-300' }
            ]
          }
        ]
      },
      {
        title: 'Administrativo',
        description: 'Procesos Administrativos',
        icon: FileText,
        color: 'bg-gradient-to-br from-purple-500 to-purple-600',
        departmentCode: departmentCodes['administrativo'],
        steps: [
          {
            id: 'administrativo',
            title: 'Procesos Administrativos',
            description: 'Gestión administrativa',
            status: (stats.byEstado['CRÉDITO'] || 0) > 0 ? 'active' : 'pending',
            assignee: { name: 'Admin', icon: FileText },
            detailedStates: [
              { name: 'Trámite Web', count: 0, color: 'bg-gray-100 text-gray-800 border-gray-300' },
              { name: 'Sin Crédito / Sin Stock M', count: 0, color: 'bg-gray-100 text-gray-800 border-gray-300' },
              { name: 'Sin Crédito / Sin Solicitud de Preparo M', count: 0, color: 'bg-gray-100 text-gray-800 border-gray-300' },
              { name: 'Sin Crédito / En Preparación ()', count: 0, color: 'bg-gray-100 text-gray-800 border-gray-300' },
              { name: 'Sin Stock M', count: 0, color: 'bg-gray-100 text-gray-800 border-gray-300' },
              { name: 'Sin Solicitud de Preparo M', count: 0, color: 'bg-gray-100 text-gray-800 border-gray-300' },
              { name: 'En Preparación()', count: stats.byEstado['PREPARACIÓN'] || 0, color: 'bg-amber-100 text-amber-800 border-amber-300' },
              { name: 'Facturado', count: stats.byEstado['FACTURADO'] || 0, color: 'bg-green-100 text-green-800 border-green-300' }
            ]
          }
        ]
      },
      {
        title: 'Logística de Entrega',
        description: 'Planificación y Ejecución',
        icon: Truck,
        color: 'bg-gradient-to-br from-cyan-500 to-cyan-600',
        departmentCode: departmentCodes['logistica-entrega'],
        steps: [
          {
            id: 'planificacion',
            title: 'Planificación y Ejecución',
            description: 'Entrega final',
            status: (stats.byEstado['LOGISTICA ENTREGA'] || 0) > 0 ? 'active' : 'pending',
            assignee: { name: 'Entrega', icon: Truck },
            detailedStates: [
              { name: 'Programación de Entrega ()', count: 0, color: 'bg-gray-100 text-gray-800 border-gray-300' },
              { name: 'Entrega Técnica()', count: stats.byEstado['ENTREGA TÉCNICA'] || 0, color: 'bg-emerald-100 text-emerald-800 border-emerald-300' }
            ]
          },
          {
            id: 'credito',
            title: 'Crédito',
            description: 'Gestión de crédito',
            status: (stats.byEstado['CRÉDITO'] || 0) > 0 ? 'active' : 'pending',
            assignee: { name: 'Finanzas', icon: DollarSign },
            detailedStates: [
              { name: 'Crédito', count: stats.byEstado['CRÉDITO'] || 0, color: 'bg-rose-100 text-rose-800 border-rose-300' },
              { name: 'Enviado P12', count: stats.byEstado['ENVIADO P12'] || 0, color: 'bg-lime-100 text-lime-800 border-lime-300' }
            ]
          }
        ]
      }
    ];

    return workflows;
  }, [stats]);

  // Función para verificar contraseña protegida
  const verifyProtectedPassword = async (actionName: string): Promise<boolean> => {
    const { value: password } = await Swal.fire({
      title: `🔐 Acceso Restringido`,
      html: `
        <div class="text-center">
          <div class="w-16 h-16 bg-red-500 rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
            </svg>
          </div>
          <p class="text-gray-600 mb-4">Esta acción requiere autorización especial</p>
          <p class="text-sm text-gray-500 mb-4"><strong>Acción:</strong> ${actionName}</p>
        </div>
      `,
      input: 'password',
      inputPlaceholder: 'Ingresa la contraseña de administrador',
      inputAttributes: {
        autocapitalize: 'off',
        autocorrect: 'off'
      },
      showCancelButton: true,
      confirmButtonText: 'Verificar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      inputValidator: (value) => {
        if (!value) {
          return 'Debes ingresar la contraseña';
        }
      }
    });

    if (password === PROTECTED_PASSWORD) {
      setIsProtectedAuthenticated(true);
      // La autenticación expira después de 5 minutos
      setTimeout(() => {
        setIsProtectedAuthenticated(false);
      }, 5 * 60 * 1000);
      
      await Swal.fire({
        icon: 'success',
        title: '✅ Acceso autorizado',
        text: 'Autorización concedida por 5 minutos',
        timer: 2000,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
      return true;
    } else if (password) {
      await Swal.fire({
        icon: 'error',
        title: 'Contraseña incorrecta',
        text: 'La contraseña ingresada no es válida',
        confirmButtonColor: '#dc2626'
      });
    }
    
    return false;
  };

  // Función para manejar la autenticación de departamentos
  const handleDepartmentAccess = async (departmentTitle: string, inputCode: string): Promise<boolean> => {
    // Códigos de acceso para cada departamento
    const departmentCodes: Record<string, string> = {
      'En Facturación': 'FAC20',
      'Logística de Entrada': 'Logx25',
      'Stock': 'ST0CK25', 
      'Administrativo': 'Admi.25',
      'Logística de Entrega': 'Logx25'
    };

    // Contraseña maestra que desbloquea todo
    const masterPassword = 'Crismar002';
    
    const expectedCode = departmentCodes[departmentTitle];
    const isValidCode = inputCode === expectedCode || inputCode === masterPassword;
    
    if (isValidCode) {
      // Filtrar productos por estados del departamento y mostrar la lista
      const departmentStates = getDepartmentStates(departmentTitle);
      const departmentItems = items.filter(item => departmentStates.includes(item.estado));
      
      if (departmentItems.length > 0) {
        // Mostrar lista de productos del departamento
        await showDepartmentProducts(departmentTitle, departmentItems);
      } else {
        await Swal.fire({
          icon: 'info',
          title: `${departmentTitle}`,
          text: 'No hay productos en este departamento actualmente',
          confirmButtonColor: '#059669'
        });
      }
    }
    
    return isValidCode;
  };

  // Función para obtener los estados de cada departamento
  const getDepartmentStates = (departmentTitle: string): string[] => {
    const departmentStatesMap: Record<string, string[]> = {
      'En Facturación': ['PEDIDO', 'APROBACION DE FACTURACION', 'FACTURACIÓN', 'FACTURACION'],
      'Logística de Entrada': ['EMBARQUE LIBRE', 'TRANSITO', 'ADUANA ORIGEN', 'ADUANA DESTINO', 'IDA 3', 'IDA3', 'DESPACHO'],
      'Stock': ['CONFERENCIA', 'CONFERIDO', 'STOCK ALGESA', 'STOCK', 'PODER 3RO', 'PODER DE 3RO', 'PROCESAMIENTO ESPECIAL', 'CARNEADO'],
      'Administrativo': ['TRAMITE WEB', 'SIN CREDITO SIN STOCK M', 'SIN CREDITO / SIN STOCK M', 'SIN CREDITO SIN SOLICITUD DE PREPARO M', 'SIN CREDITO / SIN SOLICITUD DE PREPARO M', 'SIN CREDITO EN PREPARACION', 'SIN CREDITO / EN PREPARACION', 'SIN STOCK M', 'SIN SOLICITUD DE PREPARO M', 'EN PREPARACION', 'PREPARACION', 'PREPARACIÓN', 'FACTURADO'],
      'Logística de Entrega': ['PROGRAMACION DE ENTREGA', 'ENTREGA TECNICA', 'ENTREGA TÉCNICA', 'CREDITO', 'CRÉDITO', 'ENVIADO P12', 'LOGISTICA ENTREGA']
    };
    
    return departmentStatesMap[departmentTitle] || [];
  };

  // Función para mostrar los productos del departamento
  const showDepartmentProducts = async (departmentTitle: string, departmentItems: InventoryItem[]) => {
    // Mostrar el modal de detalle de estado con los productos del departamento
    const statusGroup = {
      title: departmentTitle,
      states: getDepartmentStates(departmentTitle),
      color: 'from-blue-500 to-blue-600',
      bgColor: 'from-blue-50 to-blue-100',
      textColor: 'text-blue-700',
      icon: Package,
      key: departmentTitle.toLowerCase().replace(/\s+/g, '-')
    };
    
    setSelectedStatusGroup(statusGroup);
    setShowStatusDetailModal(true);
  };

  // Generate process flow nodes
  const processNodes = useMemo(() => {
    const allNodes = [
      {
        id: 'production',
        title: 'Producción',
        count: (stats.byEstado['PEDIDO'] || 0) + (stats.byEstado['FACTURACIÓN'] || 0),
        status: ((stats.byEstado['PEDIDO'] || 0) + (stats.byEstado['FACTURACIÓN'] || 0)) > 0 ? 'active' : 'pending',
        icon: Factory
      },
      {
        id: 'shipping',
        title: 'Embarque',
        count: stats.byEstado['EMBARQUE LIBRE'] || 0,
        status: (stats.byEstado['EMBARQUE LIBRE'] || 0) > 0 ? 'active' : 'pending',
        icon: Ship
      },
      {
        id: 'transit',
        title: 'Tránsito',
        count: (stats.byEstado['TRANSITO'] || 0) + (stats.byEstado['ADUANA ORIGEN'] || 0) + (stats.byEstado['ADUANA DESTINO'] || 0),
        status: ((stats.byEstado['TRANSITO'] || 0) + (stats.byEstado['ADUANA ORIGEN'] || 0) + (stats.byEstado['ADUANA DESTINO'] || 0)) > 0 ? 'active' : 'pending',
        icon: Truck
      },
      {
        id: 'processing',
        title: 'Procesamiento',
        count: (stats.byEstado['CONFERENCIA'] || 0) + (stats.byEstado['PREPARACIÓN'] || 0),
        status: ((stats.byEstado['CONFERENCIA'] || 0) + (stats.byEstado['PREPARACIÓN'] || 0)) > 0 ? 'active' : 'pending',
        icon: Wrench
      },
      {
        id: 'delivery',
        title: 'Entrega',
        count: stats.byEstado['ENTREGA TÉCNICA'] || 0,
        status: (stats.byEstado['ENTREGA TÉCNICA'] || 0) > 0 ? 'completed' : 'pending',
        icon: CheckCircle
      }
    ];
    
    // Apply filter if exists
    if (processFilter) {
      return allNodes.filter(node => 
        node.title.toLowerCase().includes(processFilter.toLowerCase())
      );
    }
    
    return allNodes;
  }, [stats]);

  const handleAddItem = () => {
    if (isProtectedAuthenticated) {
      setEditingItem(null);
      setShowItemModal(true);
    } else {
      verifyProtectedPassword('Agregar nuevo item').then((authorized) => {
        if (authorized) {
          setEditingItem(null);
          setShowItemModal(true);
        }
      });
    }
  };

  const handleEditItem = (item: InventoryItem) => {
    setEditingItem(item);
    setShowItemModal(true);
  };

  const handleSaveItem = async (itemData: Omit<InventoryItem, 'id'>) => {
    try {
      if (editingItem) {
        const changes = detectChanges(editingItem, itemData);
        await updateItem(editingItem.id!, itemData);
        
        if (itemData.type === 'IMPLEMENTO') {
          await logProductAction('UPDATE', `Implemento actualizado: ${itemData.codigo}`, editingItem.id, itemData.codigo, changes);
        } else {
          await logMachineAction('UPDATE', `Máquina actualizada: ${itemData.codigo}`, editingItem.id, itemData.codigo, changes);
        }
        
        await Swal.fire({
          icon: 'success',
          title: '¡Item actualizado!',
          text: 'Los cambios se han guardado correctamente',
          timer: 2000,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
      } else {
        await addItem(itemData);
        
        if (itemData.type === 'IMPLEMENTO') {
          await logProductAction('CREATE', `Nuevo implemento creado: ${itemData.codigo}`, undefined, itemData.codigo);
        } else {
          await logMachineAction('CREATE', `Nueva máquina creada: ${itemData.codigo}`, undefined, itemData.codigo);
        }
        
        await Swal.fire({
          icon: 'success',
          title: '¡Item agregado!',
          text: 'El nuevo item se ha registrado correctamente',
          timer: 2000,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
      }
      setShowItemModal(false);
      setEditingItem(null);
    } catch (error: any) {
      await Swal.fire({
        icon: 'error',
        title: 'Error al guardar',
        text: error.message || 'No se pudo guardar el item',
        confirmButtonColor: '#dc2626'
      });
    }
  };

  const handleDeleteItem = async (id: string, type: 'IMPLEMENTO' | 'MAQUINA') => {
    // Verificar contraseña antes de proceder con la eliminación
    const passwordVerified = isProtectedAuthenticated || await verifyProtectedPassword('Eliminar item del inventario');
    
    if (!passwordVerified) {
      return;
    }

    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        const item = items.find(i => i.id === id);
        await deleteItem(id);
        
        if (item) {
          await logBulkAction('PRODUCT', 'DELETE', `Item de inventario eliminado: ${item.codigo} (${item.type})`);
        }
        
        await Swal.fire({
          icon: 'success',
          title: '¡Item eliminado!',
          text: 'El item se ha eliminado correctamente',
          timer: 2000,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
      } catch (error) {
        await Swal.fire({
          icon: 'error',
          title: 'Error al eliminar',
          text: 'No se pudo eliminar el item',
          confirmButtonColor: '#dc2626'
        });
      }
    }
  };

  const handleOpenLink = (url: string, title: string) => {
    if (!url) {
      Swal.fire({
        icon: 'warning',
        title: 'Sin enlace',
        text: 'No hay un enlace configurado para este item',
        timer: 2000,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
      return;
    }

    const formattedUrl = url.startsWith('http') ? url : `https://${url}`;
    setSelectedLink({ url: formattedUrl, title });
    setShowLinkModal(true);
  };

  const handleExportToExcel = async () => {
    try {
      setShowExportOptionsModal(true);
    } catch (error) {
      console.error('Error opening export modal:', error);
    }
  };

  const handleStatusGroupClick = (group: any) => {
    // Set the pending group and show auth modal
    setPendingStatusGroup(group);
    setShowCategoryAuthModal(true);
  };

  const handleCategoryAuthentication = async (password: string): Promise<boolean> => {
    // Define passwords for each category
    const categoryPasswords: Record<string, string> = {
      'pendienteFab': 's0014',
      'porLlegar': 'ad205', 
      'enStock': 'xx102',
      'procesos': 'qpl25',
      'paraEntrega': '01qm0'
    };

    const expectedPassword = categoryPasswords[pendingStatusGroup?.key];
    
    if (password === expectedPassword) {
      // Authentication successful, show the status detail modal
      setSelectedStatusGroup(pendingStatusGroup);
      setShowStatusDetailModal(true);
      setPendingStatusGroup(null);
      return true;
    }
    
    return false;
  };

  const handleBulkImport = async (items: Omit<InventoryItem, 'id'>[]) => {
    // Verificar contraseña antes de proceder con la importación
    const passwordVerified = isProtectedAuthenticated || await verifyProtectedPassword('Carga rápida de inventario');
    
    if (!passwordVerified) {
      throw new Error('Acceso denegado: Se requiere autorización para la carga rápida');
    }

    try {
      await importItems(items);
      await logBulkAction('PRODUCT', 'BULK_IMPORT', `Importación masiva: ${items.length} items al inventario unificado`);
      
      await Swal.fire({
        icon: 'success',
        title: '¡Importación completada!',
        html: `
          <div class="text-center">
            <p class="mb-4">Se importaron exitosamente <strong>${items.length}</strong> registros</p>
            <div class="grid grid-cols-2 gap-4 max-w-xs mx-auto">
              <div class="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <div class="text-2xl font-bold text-blue-600">${items.filter(item => item.type === 'IMPLEMENTO').length}</div>
                <div class="text-sm text-blue-700">Implementos</div>
              </div>
              <div class="bg-green-50 p-3 rounded-lg border border-green-200">
                <div class="text-2xl font-bold text-green-600">${items.filter(item => item.type === 'MAQUINA').length}</div>
                <div class="text-sm text-green-700">Máquinas</div>
              </div>
            </div>
          </div>
        `,
        confirmButtonColor: '#059669',
        timer: 4000
      });
    } catch (error: any) {
      throw new Error(error.message || 'Error en la importación masiva');
    }
  };

  const handleStateManagement = async () => {
    if (isProtectedAuthenticated) {
      setShowStateManagementModal(true);
    } else {
      const authorized = await verifyProtectedPassword('Gestión de estados y departamentos');
      if (authorized) {
        setShowStateManagementModal(true);
      }
    }
  };

  const handleBulkImportModal = async () => {
    if (isProtectedAuthenticated) {
      setShowBulkImportModal(true);
    } else {
      const authorized = await verifyProtectedPassword('Carga rápida de inventario');
      if (authorized) {
        setShowBulkImportModal(true);
      }
    }
  };

  if (loading && items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-white to-cyan-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center bg-white/20 dark:bg-gray-800/20 backdrop-blur-lg p-8 rounded-2xl shadow-xl border border-white/30 dark:border-gray-700/30">
          <div className="relative">
            <RefreshCw className="w-12 h-12 text-cyan-600 animate-spin mx-auto mb-4" />
            <div className="absolute inset-0 bg-cyan-100 rounded-full animate-ping opacity-20"></div>
          </div>
          <p className="text-gray-700 dark:text-gray-300 text-lg font-medium">Cargando inventario...</p>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">Preparando el sistema unificado</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-white to-cyan-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center bg-white/20 dark:bg-gray-800/20 backdrop-blur-lg p-8 rounded-2xl shadow-xl border border-white/30 dark:border-gray-700/30">
          <div className="w-16 h-16 bg-red-100/50 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Error de Conexión</h3>
          <p className="text-red-600 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
          >
            Reintentar Conexión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-white to-cyan-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 relative overflow-hidden transition-colors duration-300">
      {/* Background with flowing curves */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/50 via-cyan-50/30 to-cyan-100/50 dark:from-gray-900/50 dark:via-gray-800/30 dark:to-gray-700/50">
        <div className="absolute inset-0 opacity-30">
          <svg className="w-full h-full" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice">
            <defs>
              <linearGradient id="curve1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={theme === 'dark' ? "#374151" : "#06b6d4"} stopOpacity="0.2"/>
                <stop offset="50%" stopColor={theme === 'dark' ? "#4b5563" : "#0891b2"} stopOpacity="0.3"/>
                <stop offset="100%" stopColor={theme === 'dark' ? "#6b7280" : "#0e7490"} stopOpacity="0.2"/>
              </linearGradient>
              <linearGradient id="curve2" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={theme === 'dark' ? "#4b5563" : "#0891b2"} stopOpacity="0.2"/>
                <stop offset="50%" stopColor={theme === 'dark' ? "#374151" : "#06b6d4"} stopOpacity="0.3"/>
                <stop offset="100%" stopColor={theme === 'dark' ? "#6b7280" : "#0e7490"} stopOpacity="0.2"/>
              </linearGradient>
            </defs>
            
            {/* Flowing curves */}
            <path d="M0,300 Q400,100 800,250 T1600,200 L1920,150 L1920,0 L0,0 Z" fill="url(#curve1)"/>
            <path d="M0,600 Q600,400 1200,500 T1920,450 L1920,300 Q1600,350 1200,300 T400,400 Z" fill="url(#curve2)"/>
            <path d="M0,900 Q800,700 1600,800 L1920,750 L1920,600 Q1400,650 800,600 T0,700 Z" fill="url(#curve1)" opacity="0.5"/>
            
            {/* Additional flowing elements */}
            <circle cx="200" cy="200" r="100" fill={theme === 'dark' ? "#374151" : "#06b6d4"} opacity="0.1"/>
            <circle cx="1600" cy="400" r="150" fill="#06b6d4" opacity="0.1"/>
            <circle cx="800" cy="700" r="80" fill="#0891b2" opacity="0.1"/>
            <circle cx="1400" cy="800" r="120" fill="#0e7490" opacity="0.1"/>
          </svg>
        </div>
      </div>
      
      {/* Header */}
      <header className="relative z-10 bg-white/10 dark:bg-gray-900/10 backdrop-blur-xl border-b border-white/20 dark:border-gray-700/20 sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-white/20 dark:bg-gray-800/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30 dark:border-gray-700/30 flex-shrink-0">
                <Layers className="w-4 h-4 sm:w-6 sm:h-6 text-cyan-600" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-base sm:text-2xl font-bold text-gray-800 dark:text-white truncate">
                  Inventario Unificado
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
                  {filteredItems.length} de {items.length} items • {stats.implementos} implementos • {stats.maquinas} máquinas
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-1 sm:space-x-3 flex-shrink-0">
              {/* View Mode Toggle */}
              <div className="flex items-center bg-white/20 dark:bg-gray-800/20 backdrop-blur-sm rounded-xl border border-white/30 dark:border-gray-700/30 p-1">
                <button
                  onClick={() => setViewMode('dashboard')}
                  className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                    viewMode === 'dashboard'
                      ? 'bg-cyan-500 text-white shadow-lg'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-white/20 dark:hover:bg-gray-700/20'
                  }`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                    viewMode === 'table'
                      ? 'bg-cyan-500 text-white shadow-lg'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-white/20 dark:hover:bg-gray-700/20'
                  }`}
                >
                  Tabla
                </button>
              </div>
              
              <ThemeToggle />
              
              <button
                onClick={handleExportToExcel}
                className="inline-flex items-center px-3 sm:px-4 py-2 bg-white/20 dark:bg-gray-800/20 backdrop-blur-sm text-gray-700 dark:text-gray-300 rounded-xl hover:bg-white/30 dark:hover:bg-gray-700/30 transition-all space-x-1 sm:space-x-2 text-xs sm:text-sm font-medium border border-white/30 dark:border-gray-700/30"
              >
                <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Exportar</span>
              </button>
              
              <button
                onClick={() => setShowAuditModal(true)}
                className="inline-flex items-center px-3 sm:px-4 py-2 bg-white/20 dark:bg-gray-800/20 backdrop-blur-sm text-gray-700 dark:text-gray-300 rounded-xl hover:bg-white/30 dark:hover:bg-gray-700/30 transition-all space-x-1 sm:space-x-2 text-xs sm:text-sm font-medium border border-white/30 dark:border-gray-700/30"
              >
                <History className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Historial</span>
              </button>
              
              <button
                onClick={handleBulkImportModal}
                className="inline-flex items-center px-3 sm:px-4 py-2 bg-cyan-500/80 dark:bg-cyan-600/80 backdrop-blur-sm text-white rounded-xl hover:bg-cyan-600/80 dark:hover:bg-cyan-700/80 transition-all space-x-1 sm:space-x-2 text-xs sm:text-sm font-medium border border-cyan-400/30 dark:border-cyan-500/30 relative"
              >
                <Zap className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Carga Rápida</span>
                {!isProtectedAuthenticated && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                    <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>
              
              <button
                onClick={handleAddItem}
                className="inline-flex items-center px-3 sm:px-4 py-2 bg-cyan-500/80 dark:bg-cyan-600/80 backdrop-blur-sm text-white rounded-xl hover:bg-cyan-600/80 dark:hover:bg-cyan-700/80 transition-all space-x-1 sm:space-x-2 text-xs sm:text-sm font-medium border border-cyan-400/30 dark:border-cyan-500/30 relative"
              >
                <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Agregar</span>
                {!isProtectedAuthenticated && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                    <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>
              
              <button
                onClick={handleStateManagement}
                className="inline-flex items-center px-3 sm:px-4 py-2 bg-white/20 dark:bg-gray-800/20 backdrop-blur-sm text-gray-700 dark:text-gray-300 rounded-xl hover:bg-white/30 dark:hover:bg-gray-700/30 transition-all space-x-1 sm:space-x-2 text-xs sm:text-sm font-medium border border-white/30 dark:border-gray-700/30 relative"
              >
                <Settings className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Estados</span>
                {!isProtectedAuthenticated && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                    <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {viewMode === 'dashboard' ? (
          <>
            {/* Hero Section */}
            <div className="text-center mb-12">
              <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 dark:text-white mb-4">
                Inventario
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
                {stats.total} equipos • {stats.implementos} implementos • {stats.maquinas} tractores
              </p>
              
              {/* Quick Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50">
                  <div className="flex items-center justify-center space-x-3 mb-3">
                    <div className="w-12 h-12 bg-blue-500 dark:bg-blue-600 rounded-xl flex items-center justify-center">
                      <Package className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.implementos}</div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 font-medium">Implementos</p>
                </div>
                
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50">
                  <div className="flex items-center justify-center space-x-3 mb-3">
                    <div className="w-12 h-12 bg-green-500 dark:bg-green-600 rounded-xl flex items-center justify-center">
                      <Settings className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.maquinas}</div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 font-medium">Máquinas</p>
                </div>
                
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50">
                  <div className="flex items-center justify-center space-x-3 mb-3">
                    <div className="w-12 h-12 bg-purple-500 dark:bg-purple-600 rounded-xl flex items-center justify-center">
                      <BarChart3 className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalCR.toLocaleString()}</div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 font-medium">Total CR</p>
                </div>
              </div>
            </div>

            {/* Process Flow Diagram */}
            <div className="mb-12">
              <ProcessFlowDiagram 
                nodes={processNodes} 
                onFilterChange={setProcessFilter}
                onNodeClick={(node) => {
                  // Handle node click - could filter by status or show details
                  console.log('Node clicked:', node);
                }}
              />
            </div>

            {/* Workflow Cards */}
            <div className="relative">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-8">
                Flujo de Procesos por Departamento
              </h2>
              
              {/* Layout reorganizado: 3 columnas arriba y 2 abajo */}
              <div className="mb-12">
                {/* Primera fila - 3 columnas: En Facturación, Logística de Entrada, Stock */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                  {workflowData.slice(0, 3).map((workflow) => (
                    <WorkflowCard
                      key={workflow.title}
                      title={workflow.title}
                      description={workflow.description}
                      steps={workflow.steps}
                      icon={workflow.icon}
                      color={workflow.color}
                      nextProcess={workflow.nextProcess}
                      departmentCode={workflow.departmentCode}
                      onDepartmentAccess={handleDepartmentAccess}
                      onStepClick={(step) => {
                        console.log('Step clicked:', step);
                      }}
                    />
                  ))}
                </div>
                
                {/* Segunda fila - 2 columnas centradas: Administrativo, Logística de Entrega */}
                {workflowData.length > 3 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
                    {workflowData.slice(3).map((workflow) => (
                      <WorkflowCard
                        key={workflow.title}
                        title={workflow.title}
                        description={workflow.description}
                        steps={workflow.steps}
                        icon={workflow.icon}
                        color={workflow.color}
                        nextProcess={workflow.nextProcess}
                        departmentCode={workflow.departmentCode}
                        onDepartmentAccess={handleDepartmentAccess}
                        onStepClick={(step) => {
                          console.log('Step clicked:', step);
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* Enhanced Process Flow Summary for Desktop */}
            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 mt-8 mb-12">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 text-center">
                Resumen del Flujo de Procesos
              </h3>
              
              {/* Desktop Flow Visualization */}
              <div className="hidden lg:flex items-center justify-center space-x-4 mb-6">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-green-500 rounded-full shadow-lg"></div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Facturación</span>
                </div>
                <div className="w-12 h-0.5 bg-gradient-to-r from-green-500 to-blue-500"></div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-blue-500 rounded-full shadow-lg"></div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Logística Entrada</span>
                </div>
                <div className="w-12 h-0.5 bg-gradient-to-r from-blue-500 to-emerald-500"></div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-emerald-500 rounded-full shadow-lg"></div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Stock</span>
                </div>
                <div className="w-12 h-0.5 bg-gradient-to-r from-emerald-500 to-purple-500"></div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-purple-500 rounded-full shadow-lg"></div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Administrativo</span>
                </div>
                <div className="w-12 h-0.5 bg-gradient-to-r from-purple-500 to-orange-500"></div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-orange-500 rounded-full shadow-lg"></div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Logística Entrega</span>
                </div>
              </div>
              
              {/* Mobile Flow Visualization */}
              <div className="flex lg:hidden items-center justify-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span>Producción</span>
                </div>
                <div className="w-8 h-0.5 bg-gradient-to-r from-blue-500 to-green-500"></div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>Logística</span>
                </div>
                <div className="w-8 h-0.5 bg-gradient-to-r from-green-500 to-purple-500"></div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <span>Entrega</span>
                </div>
              </div>
              
              <p className="text-center text-xs text-gray-500 dark:text-gray-400">
                Los productos fluyen automáticamente entre departamentos siguiendo este proceso
              </p>
              
              {/* Process Statistics */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mt-6">
                {workflowData.map((workflow, index) => {
                  const totalItems = workflow.steps.reduce((total, step) => {
                    return total + (step.detailedStates?.reduce((stepTotal, state) => stepTotal + state.count, 0) || 0);
                  }, 0);
                  
                  return (
                    <div key={workflow.title} className="text-center p-3 bg-white/50 dark:bg-gray-700/50 rounded-lg border border-gray-200/50 dark:border-gray-600/50">
                      <div className="text-lg font-bold text-gray-900 dark:text-white">{totalItems}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">{workflow.title}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Status Overview Cards */}
            <UnifiedStatsCards stats={stats} items={items} onStatusGroupClick={handleStatusGroupClick} />
          </>
        ) : (
          <>
            <UnifiedStatsCards stats={stats} items={items} onStatusGroupClick={handleStatusGroupClick} />
          </>
        )}
        
        <UnifiedFilterBar
          filters={filters}
          onFiltersChange={setFilters}
          availableProveedores={availableProveedores}
          availableEstados={availableEstados}
          availableLugares={availableLugares}
          availableClientes={availableClientes}
        />
        
        {viewMode === 'table' && (
          <UnifiedInventoryTable
            items={items}
            onEdit={handleEditItem}
            onDelete={handleDeleteItem}
            onOpenLink={handleOpenLink}
            isAuthenticated={isAuthenticated}
            filters={filters}
            onFiltersChange={setFilters}
          />
        )}
      </main>

      {/* Modals */}
      <UnifiedInventoryModal
        isOpen={showItemModal}
        onClose={() => {
          setShowItemModal(false);
          setEditingItem(null);
        }}
        onSave={handleSaveItem}
        item={editingItem}
        title={editingItem ? 'Editar Item' : 'Agregar Item'}
      />

      <UnifiedBulkImportModal
        isOpen={showBulkImportModal}
        onClose={() => setShowBulkImportModal(false)}
        onImport={handleBulkImport}
      />
      <AuditLogModal
        isOpen={showAuditModal}
        onClose={() => setShowAuditModal(false)}
      />

      <LinkModal
        isOpen={showLinkModal}
        onClose={() => setShowLinkModal(false)}
        url={selectedLink.url}
        title={selectedLink.title}
      />

      <ExportOptionsModal
        isOpen={showExportOptionsModal}
        onClose={() => setShowExportOptionsModal(false)}
        onSelectExcel={() => {
          setShowExportOptionsModal(false);
          // TODO: Implement unified Excel export
        }}
        onSelectPDF={() => {
          setShowExportOptionsModal(false);
          // TODO: Implement unified PDF export
        }}
        title="Selecciona el formato para exportar inventario"
      />

      <StatusDetailModal
        isOpen={showStatusDetailModal}
        onClose={() => setShowStatusDetailModal(false)}
        items={items}
        statusGroup={selectedStatusGroup}
        onEdit={handleEditItem}
        onDelete={handleDeleteItem}
        onOpenLink={handleOpenLink}
        isAuthenticated={isAuthenticated}
      />

      <CategoryAuthModal
        isOpen={showCategoryAuthModal}
        onClose={() => {
          setShowCategoryAuthModal(false);
          setPendingStatusGroup(null);
        }}
        onAuthenticate={handleCategoryAuthentication}
        categoryTitle={pendingStatusGroup?.title || ''}
      />

      <StateManagementModal
        isOpen={showStateManagementModal}
        onClose={() => setShowStateManagementModal(false)}
      />

      <ChatToggle />
    </div>
  );
};

export default UnifiedInventoryPage;