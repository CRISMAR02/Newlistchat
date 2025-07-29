import React, { useState, useEffect } from 'react';
import { X, Save, Package, Settings, Calendar, Users, MapPin, Truck, Lock, Factory, Ship, CheckCircle, Wrench, DollarSign, Eye, EyeOff, Plus, Trash2, CreditCard, UserCheck } from 'lucide-react';
import { InventoryItem } from '../types/inventory';
import { stateManagementService } from '../services/stateManagementService';
import Swal from 'sweetalert2';

interface UnifiedInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Omit<InventoryItem, 'id'>) => Promise<void>;
  item?: InventoryItem | null;
  title: string;
}

interface DepartmentAuth {
  [key: string]: boolean;
}

const UnifiedInventoryModal: React.FC<UnifiedInventoryModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  item, 
  title 
}) => {
  const [formData, setFormData] = useState<Record<string, any>>({
    // Campos básicos del sistema
    type: 'IMPLEMENTO',
    proveedor: '',
    codigo: '',
    proforma: '',
    po: '',
    factura: '',
    estado: 'PEDIDO',
    descripcion: '',
    cliente: '',
    lugar: '',
    chassis: '',
    cr: 0,
    orderNr: '',
    link: '',
    
    // Facturación
    id_negociacion: '',
    es_emergencia: false,
    fecha_produccion: '',
    fecha_facturacion: '',
    destino_llegada: '',
    
    // Logística de entrada
    fecha_embarque: '',
    fecha_llegada: '',
    
    // Post venta
    fecha_carneo: '',
    fecha_reposicion: '',
    pieza_carneada: '',
    cliente_destino: '',
    chasis_destino: '',
    motivo: '',
    fecha_inicio_preparacion: '',
    fecha_fin_preparacion: '',
    entrega_tecnica_programada: '',
    entrega_tecnica_concluida: '',
    
    // Logística de entrega
    fecha_entrega_prevista: '',
    fecha_entrega_concluida: '',
    
    // Administrativo
    fecha_de_solicitud_de_preparacion: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [availableStates, setAvailableStates] = useState<string[]>([]);
  const [departmentAuth, setDepartmentAuth] = useState<DepartmentAuth>({});
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentDepartment, setCurrentDepartment] = useState<string>('');

  // Department passwords
  const departmentPasswords: Record<string, string> = {
    'facturacion': 'FAC20',
    'logistica-entrada': 'Logx25',
    'post-venta': 'POST25',
    'logistica-entrega': 'ENT25',
    'administrativo': 'Admi.25'
  };
  
  // Contraseña maestra
  const masterPassword = 'Crismar002';

  // Load available states when modal opens
  useEffect(() => {
    if (isOpen) {
      loadAvailableStates();
      // Reset department auth when modal opens
      setDepartmentAuth({});
    }
  }, [isOpen]);

  const loadAvailableStates = async () => {
    try {
      const states = await stateManagementService.getAllAvailableStates();
      setAvailableStates(states);
    } catch (error) {
      console.error('Error loading available states:', error);
      // Fallback states if service fails
      const fallbackStates = [
        'PEDIDO', 'FACTURACIÓN', 'EMBARQUE LIBRE', 'TRANSITO', 'ADUANA ORIGEN', 
        'ADUANA DESTINO', 'IDA 3', 'DESPACHO', 'CONFERENCIA', 'CONFERIDO', 
        'STOCK ALGESA', 'STOCK', 'PODER 3RO', 'CRÉDITO', 'PREPARACIÓN', 
        'ENVIADO P12', 'FACTURADO', 'LOGISTICA ENTREGA', 'ENTREGA TÉCNICA'
      ];
      setAvailableStates(fallbackStates);
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (item) {
        // Cargar datos existentes
        const initialData: Record<string, any> = {
          // Campos básicos
          type: 'IMPLEMENTO', // Tipo fijo
          proveedor: item.proveedor || '',
          codigo: item.codigo || '',
          proforma: item.proforma || '',
          po: item.po || '',
          factura: item.factura || '',
          estado: item.estado || 'PEDIDO',
          cliente: item.cliente || '',
          lugar: item.lugar || '',
          chassis: item.chassis || '',
          cr: item.cr || 0,
          orderNr: item.orderNr || '',
          link: item.link || '',
          
          // Facturación
          id_negociacion: item.id_negociacion || '',
          es_emergencia: item.es_emergencia || false,
          fecha_produccion: item.fecha_produccion || '',
          fecha_facturacion: item.fecha_facturacion || '',
          destino_llegada: item.destino_llegada || '',
          
          // Logística de entrada
          fecha_embarque: item.fecha_embarque || '',
          fecha_llegada: item.fecha_llegada || '',
          
          // Post venta
          fecha_carneo: item.fecha_carneo || '',
          fecha_reposicion: item.fecha_reposicion || '',
          pieza_carneada: item.pieza_carneada || '',
          cliente_destino: item.cliente_destino || '',
          chasis_destino: item.chasis_destino || '',
          motivo: item.motivo || '',
          fecha_inicio_preparacion: item.fecha_inicio_preparacion || '',
          fecha_fin_preparacion: item.fecha_fin_preparacion || '',
          entrega_tecnica_programada: item.entrega_tecnica_programada || '',
          entrega_tecnica_concluida: item.entrega_tecnica_concluida || '',
          
          // Logística de entrega
          fecha_entrega_prevista: item.fecha_entrega_prevista || '',
          fecha_entrega_concluida: item.fecha_entrega_concluida || '',
          
          // Administrativo
          fecha_de_solicitud_de_preparacion: item.fecha_de_solicitud_de_preparacion || ''
        };
        
        setFormData(initialData);
      } else {
        // Datos por defecto para nuevo item
        setFormData({
          type: 'IMPLEMENTO', // Tipo fijo
          proveedor: '',
          codigo: '',
          proforma: '',
          po: '',
          factura: '',
          estado: 'PEDIDO',
          cliente: '',
          lugar: '',
          chassis: '',
          cr: 0,
          orderNr: '',
          link: '',
          
          // Facturación
          id_negociacion: '',
          es_emergencia: false,
          fecha_produccion: '',
          fecha_facturacion: '',
          destino_llegada: '',
          
          // Logística de entrada
          fecha_embarque: '',
          fecha_llegada: '',
          
          // Post venta
          fecha_carneo: '',
          fecha_reposicion: '',
          pieza_carneada: '',
          cliente_destino: '',
          chasis_destino: '',
          motivo: '',
          fecha_inicio_preparacion: '',
          fecha_fin_preparacion: '',
          entrega_tecnica_programada: '',
          entrega_tecnica_concluida: '',
          
          // Logística de entrega
          fecha_entrega_prevista: '',
          fecha_entrega_concluida: '',
          
          // Administrativo
          fecha_de_solicitud_de_preparacion: ''
        });
      }
      setErrors({});
    }
  }, [isOpen, item?.id]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.id_negociacion?.trim()) {
      newErrors.id_negociacion = 'El ID de negociación es requerido (clave primaria)';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // Usar id_negociacion como codigo si no hay codigo
      const dataToSave = {
        ...formData,
        type: 'IMPLEMENTO', // Tipo fijo
        codigo: formData.codigo || formData.id_negociacion
      };
      
      await onSave(dataToSave);
      onClose();
    } catch (error) {
      console.error('Error saving item:', error);
      setErrors({ general: 'Error al guardar el item. Intente nuevamente.' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    let processedValue: any = value;
    if (type === 'checkbox') {
      processedValue = (e.target as HTMLInputElement).checked;
    } else if (name === 'cr') {
      processedValue = value === '' ? 0 : parseFloat(value) || 0;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleDepartmentAccess = (departmentKey: string) => {
    if (departmentAuth[departmentKey]) {
      return; // Already authenticated
    }
    
    setCurrentDepartment(departmentKey);
    setShowPasswordModal(true);
  };

  const handlePasswordSubmit = async (password: string) => {
    const expectedPassword = departmentPasswords[currentDepartment];
    const isValid = password === expectedPassword || password === masterPassword;
    
    if (isValid) {
      setDepartmentAuth(prev => ({
        ...prev,
        [currentDepartment]: true
      }));
      setShowPasswordModal(false);
      setCurrentDepartment('');
      
      await Swal.fire({
        icon: 'success',
        title: '🔓 Acceso concedido',
        text: password === masterPassword ? 'Acceso total autorizado' : 'Ahora puedes editar esta sección',
        timer: 1500,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
    } else {
      await Swal.fire({
        icon: 'error',
        title: 'Contraseña incorrecta',
        text: 'Intenta nuevamente',
        timer: 2000,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
    }
  };

  const isFieldUnlocked = (departmentKey: string): boolean => {
    return departmentAuth[departmentKey] || false;
  };

  const handleClose = () => {
    setFormData({});
    setErrors({});
    setDepartmentAuth({});
    onClose();
  };

  const getDepartmentTitle = (key: string) => {
    const titles: Record<string, string> = {
      'facturacion': 'Facturación',
      'logistica-entrada': 'Logística de Entrada',
      'post-venta': 'Post Venta',
      'logistica-entrega': 'Logística de Entrega'
    };
    return titles[key] || key;
  };

  const getDepartmentIcon = (key: string) => {
    const icons: Record<string, React.ComponentType<any>> = {
      'facturacion': CreditCard,
      'logistica-entrada': Ship,
      'post-venta': UserCheck,
      'logistica-entrega': Truck,
      'administrativo': Settings
    };
    return icons[key] || Settings;
  };

  const getDepartmentColor = (key: string) => {
    const colors: Record<string, string> = {
      'facturacion': 'bg-green-50 border-green-200',
      'logistica-entrada': 'bg-blue-50 border-blue-200',
      'post-venta': 'bg-purple-50 border-purple-200',
      'logistica-entrega': 'bg-orange-50 border-orange-200',
      'administrativo': 'bg-yellow-50 border-yellow-200'
    };
    return colors[key] || 'bg-gray-50 border-gray-200';
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6">
            {errors.general && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {errors.general}
              </div>
            )}
            
            {/* Department Sections */}
            <div className="space-y-6 mb-6">
              {/* Facturación */}
              <div className={`border rounded-lg p-4 ${getDepartmentColor('facturacion')}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <CreditCard className="w-5 h-5 text-green-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Facturación</h3>
                  </div>
                  {!departmentAuth['facturacion'] && (
                    <button
                      type="button"
                      onClick={() => handleDepartmentAccess('facturacion')}
                      className="flex items-center space-x-1 px-3 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors text-sm"
                    >
                      <Lock className="w-4 h-4" />
                      <span>Desbloquear</span>
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ID Negociación * (Clave Primaria)
                    </label>
                    <input
                      type="text"
                      name="id_negociacion"
                      value={formData.id_negociacion || ''}
                      onChange={handleChange}
                      disabled={!isFieldUnlocked('facturacion')}
                      required
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed ${
                        errors.id_negociacion ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="ID único de negociación"
                    />
                    {errors.id_negociacion && (
                      <p className="mt-1 text-sm text-red-600">{errors.id_negociacion}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cliente
                    </label>
                    <input
                      type="text"
                      name="cliente"
                      value={formData.cliente || ''}
                      onChange={handleChange}
                      disabled={!isFieldUnlocked('facturacion')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                      placeholder="Nombre del cliente"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Es Emergencia
                    </label>
                    <div className="flex items-center space-x-3 mt-3">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          name="es_emergencia"
                          checked={formData.es_emergencia || false}
                          onChange={handleChange}
                          disabled={!isFieldUnlocked('facturacion')}
                          className="rounded border-gray-300 text-red-600 focus:ring-red-500 disabled:opacity-50"
                        />
                        <span className="ml-2 text-sm text-gray-700">Pedido de emergencia</span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha de Producción
                    </label>
                    <input
                      type="date"
                      name="fecha_produccion"
                      value={formData.fecha_produccion || ''}
                      onChange={handleChange}
                      disabled={!isFieldUnlocked('facturacion')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha de Facturación
                    </label>
                    <input
                      type="date"
                      name="fecha_facturacion"
                      value={formData.fecha_facturacion || ''}
                      onChange={handleChange}
                      disabled={!isFieldUnlocked('facturacion')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Destino de Llegada
                    </label>
                    <input
                      type="text"
                      name="destino_llegada"
                      value={formData.destino_llegada || ''}
                      onChange={handleChange}
                      disabled={!isFieldUnlocked('facturacion')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                      placeholder="Destino final"
                    />
                  </div>
                </div>
              </div>

              {/* Logística de Entrada */}
              <div className={`border rounded-lg p-4 ${getDepartmentColor('logistica-entrada')}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Ship className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Logística de Entrada</h3>
                  </div>
                  {!departmentAuth['logistica-entrada'] && (
                    <button
                      type="button"
                      onClick={() => handleDepartmentAccess('logistica-entrada')}
                      className="flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm"
                    >
                      <Lock className="w-4 h-4" />
                      <span>Desbloquear</span>
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha de Embarque
                    </label>
                    <input
                      type="date"
                      name="fecha_embarque"
                      value={formData.fecha_embarque || ''}
                      onChange={handleChange}
                      disabled={!isFieldUnlocked('logistica-entrada')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha de Llegada
                    </label>
                    <input
                      type="date"
                      name="fecha_llegada"
                      value={formData.fecha_llegada || ''}
                      onChange={handleChange}
                      disabled={!isFieldUnlocked('logistica-entrada')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {/* Administrativo */}
              <div className={`border rounded-lg p-4 ${getDepartmentColor('administrativo')}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Settings className="w-5 h-5 text-yellow-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Administrativo</h3>
                  </div>
                  {!departmentAuth['administrativo'] && (
                    <button
                      type="button"
                      onClick={() => handleDepartmentAccess('administrativo')}
                      className="flex items-center space-x-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-md hover:bg-yellow-200 transition-colors text-sm"
                    >
                      <Lock className="w-4 h-4" />
                      <span>Desbloquear</span>
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha de Solicitud de Preparación
                    </label>
                    <input
                      type="date"
                      name="fecha_de_solicitud_de_preparacion"
                      value={formData.fecha_de_solicitud_de_preparacion || ''}
                      onChange={handleChange}
                      disabled={!isFieldUnlocked('administrativo')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cambio de Estado
                    </label>
                    <div className="space-y-2">
                      <div className="text-sm text-gray-600 mb-2">
                        Estado actual: <span className="font-semibold">{formData.estado}</span>
                      </div>
                      {formData.estado !== 'PREPARACION SOLICITADO' && (
                        <button
                          type="button"
                          onClick={() => {
                            if (isFieldUnlocked('administrativo')) {
                              setFormData(prev => ({
                                ...prev,
                                estado: 'PREPARACION SOLICITADO'
                              }));
                              Swal.fire({
                                icon: 'success',
                                title: 'Estado cambiado',
                                text: 'El estado se cambió a "PREPARACION SOLICITADO"',
                                timer: 2000,
                                showConfirmButton: false,
                                toast: true,
                                position: 'top-end'
                              });
                            } else {
                              handleDepartmentAccess('administrativo');
                            }
                          }}
                          disabled={!isFieldUnlocked('administrativo')}
                          className="w-full px-3 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors font-medium disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                        >
                          <Calendar className="w-4 h-4" />
                          <span>Cambiar a "Preparación Solicitado"</span>
                        </button>
                      )}
                      {formData.estado === 'PREPARACION SOLICITADO' && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-sm text-green-800 font-medium">
                              Estado: PREPARACION SOLICITADO
                            </span>
                          </div>
                          <p className="text-xs text-green-700 mt-1">
                            El item está en estado de preparación solicitado
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Post Venta */}
              <div className={`border rounded-lg p-4 ${getDepartmentColor('post-venta')}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <UserCheck className="w-5 h-5 text-purple-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Post Venta</h3>
                  </div>
                  {!departmentAuth['post-venta'] && (
                    <button
                      type="button"
                      onClick={() => handleDepartmentAccess('post-venta')}
                      className="flex items-center space-x-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors text-sm"
                    >
                      <Lock className="w-4 h-4" />
                      <span>Desbloquear</span>
                    </button>
                  )}
                </div>
                
                {/* Primera fila: Fecha de Carneo, Fecha de Reposición, Cliente Destino */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha de Carneo
                    </label>
                    <input
                      type="date"
                      name="fecha_carneo"
                      value={formData.fecha_carneo || ''}
                      onChange={handleChange}
                      disabled={!isFieldUnlocked('post-venta')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha de Reposición
                    </label>
                    <input
                      type="date"
                      name="fecha_reposicion"
                      value={formData.fecha_reposicion || ''}
                      onChange={handleChange}
                      disabled={!isFieldUnlocked('post-venta')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cliente Destino
                    </label>
                    <input
                      type="text"
                      name="cliente_destino"
                      value={formData.cliente_destino || ''}
                      onChange={handleChange}
                      disabled={!isFieldUnlocked('post-venta')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                      placeholder="Cliente final"
                    />
                  </div>
                </div>
                
                {/* Segunda fila: Chasis Destino, Pieza Carneada, Motivo */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Chasis Destino
                    </label>
                    <input
                      type="text"
                      name="chasis_destino"
                      value={formData.chasis_destino || ''}
                      onChange={handleChange}
                      disabled={!isFieldUnlocked('post-venta')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                      placeholder="Número de chasis destino"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pieza Carneada (Descripción detallada)
                    </label>
                    <textarea
                      name="pieza_carneada"
                      value={formData.pieza_carneada || ''}
                      onChange={handleChange}
                      rows={3}
                      disabled={!isFieldUnlocked('post-venta')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                      placeholder="Descripción detallada de la pieza carneada"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Motivo
                    </label>
                    <textarea
                      name="motivo"
                      value={formData.motivo || ''}
                      onChange={handleChange}
                      rows={3}
                      disabled={!isFieldUnlocked('post-venta')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                      placeholder="Motivo del carneo o reposición"
                    />
                  </div>
                </div>
                
                {/* Subsección: Preparación */}
                <div className="mb-6">
                  <h4 className="text-md font-semibold text-gray-800 mb-4 border-b border-purple-200 pb-2">
                    Preparación
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fecha Inicio Preparación
                      </label>
                      <input
                        type="date"
                        name="fecha_inicio_preparacion"
                        value={formData.fecha_inicio_preparacion || ''}
                        onChange={handleChange}
                        disabled={!isFieldUnlocked('post-venta')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fecha Fin Preparación
                      </label>
                      <input
                        type="date"
                        name="fecha_fin_preparacion"
                        value={formData.fecha_fin_preparacion || ''}
                        onChange={handleChange}
                        disabled={!isFieldUnlocked('post-venta')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cambiar Estado
                      </label>
                      <div className="space-y-2">
                        <div className="text-sm text-gray-600 mb-2">
                          Estado actual: <span className="font-semibold">{formData.estado}</span>
                        </div>
                        {formData.estado !== 'PREPARACION SOLICITADO' && (
                          <button
                            type="button"
                            onClick={() => {
                              if (isFieldUnlocked('post-venta')) {
                                setFormData(prev => ({
                                  ...prev,
                                  estado: 'PREPARACION SOLICITADO'
                                }));
                                Swal.fire({
                                  icon: 'success',
                                  title: 'Estado cambiado',
                                  text: 'El estado se cambió a "PREPARACION SOLICITADO"',
                                  timer: 2000,
                                  showConfirmButton: false,
                                  toast: true,
                                  position: 'top-end'
                                });
                              } else {
                                handleDepartmentAccess('post-venta');
                              }
                            }}
                            disabled={!isFieldUnlocked('post-venta')}
                            className="w-full px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors font-medium disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                          >
                            <Calendar className="w-4 h-4" />
                            <span>Cambiar a "Preparación Solicitado"</span>
                          </button>
                        )}
                        {formData.estado === 'PREPARACION SOLICITADO' && (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                            <div className="flex items-center space-x-2">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              <span className="text-sm text-green-800 font-medium">
                                Estado: PREPARACION SOLICITADO
                              </span>
                            </div>
                            <p className="text-xs text-green-700 mt-1">
                              El item está en estado de preparación solicitado
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Subsección: Entrega Técnica */}
                <div>
                  <h4 className="text-md font-semibold text-gray-800 mb-4 border-b border-purple-200 pb-2">
                    Entrega Técnica
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Entrega Técnica Programada
                      </label>
                      <input
                        type="date"
                        name="entrega_tecnica_programada"
                        value={formData.entrega_tecnica_programada || ''}
                        onChange={handleChange}
                        disabled={!isFieldUnlocked('post-venta')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Entrega Técnica Concluida
                      </label>
                      <input
                        type="date"
                        name="entrega_tecnica_concluida"
                        value={formData.entrega_tecnica_concluida || ''}
                        onChange={handleChange}
                        disabled={!isFieldUnlocked('post-venta')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cambiar Estado
                      </label>
                      <select
                        value=""
                        onChange={(e) => {
                          if (e.target.value && isFieldUnlocked('post-venta')) {
                            setFormData(prev => ({
                              ...prev,
                              estado: e.target.value
                            }));
                            Swal.fire({
                              icon: 'success',
                              title: 'Estado cambiado',
                              text: `El estado se cambió a "${e.target.value}"`,
                              timer: 2000,
                              showConfirmButton: false,
                              toast: true,
                              position: 'top-end'
                            });
                          }
                        }}
                        disabled={!isFieldUnlocked('post-venta')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        <option value="">Seleccionar estado</option>
                        <option value="ENTREGA TECNICA PROGRAMADA">Entrega Técnica Programada</option>
                        <option value="ENTREGA TECNICA CONCLUIDA">Entrega Técnica Concluida</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Logística de Entrega */}
              <div className={`border rounded-lg p-4 ${getDepartmentColor('logistica-entrega')}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Truck className="w-5 h-5 text-orange-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Logística de Entrega</h3>
                  </div>
                  {!departmentAuth['logistica-entrega'] && (
                    <button
                      type="button"
                      onClick={() => handleDepartmentAccess('logistica-entrega')}
                      className="flex items-center space-x-1 px-3 py-1 bg-orange-100 text-orange-700 rounded-md hover:bg-orange-200 transition-colors text-sm"
                    >
                      <Lock className="w-4 h-4" />
                      <span>Desbloquear</span>
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha de Entrega Prevista
                    </label>
                    <input
                      type="date"
                      name="fecha_entrega_prevista"
                      value={formData.fecha_entrega_prevista || ''}
                      onChange={handleChange}
                      disabled={!isFieldUnlocked('logistica-entrega')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha de Entrega Concluida
                    </label>
                    <input
                      type="date"
                      name="fecha_entrega_concluida"
                      value={formData.fecha_entrega_concluida || ''}
                      onChange={handleChange}
                      disabled={!isFieldUnlocked('logistica-entrega')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

            </div>
            
            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>{loading ? 'Guardando...' : 'Guardar'}</span>
              </button>
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors font-medium disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-gray-100">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center">
                  <Lock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Acceso Restringido</h3>
                  <p className="text-sm text-gray-500">{getDepartmentTitle(currentDepartment)}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setCurrentDepartment('');
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <form onSubmit={(e) => {
                e.preventDefault();
                const input = e.currentTarget.querySelector('input[type="password"]') as HTMLInputElement;
                if (input && input.value.trim()) {
                  handlePasswordSubmit(input.value.trim());
                  input.value = '';
                }
              }}>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Contraseña del Departamento
                  </label>
                  <input
                    type="password"
                    placeholder="Ingrese la contraseña"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    autoFocus
                    required
                  />
                  <div className="mt-3 text-xs text-gray-500 space-y-1">
                    <p><strong>Contraseñas por departamento:</strong></p>
                    <p>• Facturación: FAC20</p>
                    <p>• Logística Entrada: Logx25</p>
                    <p>• Post Venta: POST25</p>
                    <p>• Logística Entrega: ENT25</p>
                    <p>• Administrativo: Admi.25</p>
                    <p>• <strong>Maestra:</strong> Crismar002 (acceso total)</p>
                  </div>
                </div>
                
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-red-600 to-pink-600 text-white py-3 px-4 rounded-xl hover:from-red-700 hover:to-pink-700 transition-all duration-200 font-semibold"
                  >
                    Acceder
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordModal(false);
                      setCurrentDepartment('');
                    }}
                    className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-xl hover:bg-gray-200 transition-all duration-200 font-semibold"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UnifiedInventoryModal;