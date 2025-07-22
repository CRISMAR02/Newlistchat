import React, { useState, useEffect } from 'react';
import { X, Save, Package, Settings, Calendar, Users, MapPin, Truck, Lock, Factory, Ship, CheckCircle, Wrench, DollarSign, Eye, EyeOff, Plus, Trash2 } from 'lucide-react';
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
  const [formData, setFormData] = useState<Omit<InventoryItem, 'id'>>({
    type: 'IMPLEMENTO',
    proveedor: '',
    codigo: '',
    proforma: '',
    po: '',
    factura: '',
    estado: 'PEDIDO',
    descripcion: '',
    fechaProduccion: '',
    fechaEmbarque: '',
    fechaLlegada: '',
    fechaEntrega: '',
    cliente: '',
    lugar: '',
    chassis: '',
    cr: 0,
    orderNr: '',
    link: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [availableStates, setAvailableStates] = useState<string[]>([]);
  const [departmentAuth, setDepartmentAuth] = useState<DepartmentAuth>({});
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentDepartment, setCurrentDepartment] = useState<string>('');
  const [dynamicFields, setDynamicFields] = useState<Record<string, any>>({});
  const [newFieldName, setNewFieldName] = useState('');
  const [showAddField, setShowAddField] = useState(false);

  // Department passwords
  const departmentPasswords: Record<string, string> = {
    'facturacion': 'FAC20',
    'logistica-entrada': 'Logx25',
    'stock': 'ST0CK25',
    'administrativo': 'Admi.25',
    'logistica-entrega': 'Logx25'
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
        // Cargar campos dinámicos existentes
        const dynamicData: Record<string, any> = {};
        Object.keys(item).forEach(key => {
          if (!['id', 'type', 'proveedor', 'codigo', 'proforma', 'po', 'factura', 'estado', 'descripcion', 
                'fechaProduccion', 'fechaEmbarque', 'fechaLlegada', 'fechaEntrega', 'cliente', 'lugar', 
                'chassis', 'cr', 'orderNr', 'link', 'createdAt', 'updatedAt'].includes(key)) {
            dynamicData[key] = item[key];
          }
        });
        setDynamicFields(dynamicData);
        
        setFormData({
          type: item.type,
          proveedor: item.proveedor || '',
          codigo: item.codigo || '',
          proforma: item.proforma || '',
          po: item.po || '',
          factura: item.factura || '',
          estado: item.estado || 'PEDIDO',
          descripcion: item.descripcion || '',
          fechaProduccion: item.fechaProduccion || '',
          fechaEmbarque: item.fechaEmbarque || '',
          fechaLlegada: item.fechaLlegada || '',
          fechaEntrega: item.fechaEntrega || '',
          cliente: item.cliente || '',
          lugar: item.lugar || '',
          chassis: item.chassis || '',
          cr: item.cr || 0,
          orderNr: item.orderNr || '',
          link: item.link || ''
        });
      } else {
        setDynamicFields({});
        setFormData({
          type: 'IMPLEMENTO',
          proveedor: '',
          codigo: '',
          proforma: '',
          po: '',
          factura: '',
          estado: 'PEDIDO',
          descripcion: '',
          fechaProduccion: '',
          fechaEmbarque: '',
          fechaLlegada: '',
          fechaEntrega: '',
          cliente: '',
          lugar: '',
          chassis: '',
          cr: 0,
          orderNr: '',
          link: ''
        });
      }
      setErrors({});
    }
  }, [isOpen, item?.id]); // Only depend on item.id to avoid infinite loops

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.codigo.trim()) {
      newErrors.codigo = 'El código es requerido';
    }
    
    if (!formData.descripcion.trim()) {
      newErrors.descripcion = 'La descripción es requerida';
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
      // Combinar datos del formulario con campos dinámicos
      const completeData = {
        ...formData,
        ...dynamicFields
      };
      await onSave(completeData);
      onClose();
    } catch (error) {
      console.error('Error saving item:', error);
      setErrors({ general: 'Error al guardar el item. Intente nuevamente.' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    let processedValue: any = value;
    if (name === 'cr') {
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

  const handleDynamicFieldChange = (fieldName: string, value: any) => {
    setDynamicFields(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const addDynamicField = () => {
    if (!newFieldName.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Nombre requerido',
        text: 'Ingresa un nombre para el nuevo campo',
        confirmButtonColor: '#dc2626'
      });
      return;
    }

    const fieldKey = newFieldName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    
    if (fieldKey in formData || fieldKey in dynamicFields) {
      Swal.fire({
        icon: 'warning',
        title: 'Campo existente',
        text: 'Ya existe un campo con ese nombre',
        confirmButtonColor: '#dc2626'
      });
      return;
    }

    setDynamicFields(prev => ({
      ...prev,
      [fieldKey]: ''
    }));
    
    setNewFieldName('');
    setShowAddField(false);
    
    Swal.fire({
      icon: 'success',
      title: 'Campo agregado',
      text: `El campo "${newFieldName}" se ha agregado correctamente`,
      timer: 2000,
      showConfirmButton: false,
      toast: true,
      position: 'top-end'
    });
  };

  const removeDynamicField = (fieldName: string) => {
    setDynamicFields(prev => {
      const newFields = { ...prev };
      delete newFields[fieldName];
      return newFields;
    });
  };

  const handleTypeChange = (newType: 'IMPLEMENTO' | 'MAQUINA') => {
    setFormData(prev => ({
      ...prev,
      type: newType,
      estado: 'PEDIDO'
    }));
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

  // Función para verificar si un campo específico está desbloqueado
  const isFieldUnlocked = (fieldName: string): boolean => {
    // Mapeo de campos a departamentos
    const fieldDepartmentMap: Record<string, string> = {
      'fechaProduccion': 'facturacion',
      'factura': 'logistica-entrada',
      'fechaLlegada': 'stock',
      'cliente': 'stock',
      'fechaEntrega': 'administrativo'
    };
    
    const department = fieldDepartmentMap[fieldName];
    if (!department) return true; // Si no está mapeado, está desbloqueado
    
    return departmentAuth[department] || false;
  };

  const handleClose = () => {
    setFormData({
      type: 'IMPLEMENTO',
      proveedor: '',
      codigo: '',
      proforma: '',
      po: '',
      factura: '',
      estado: 'PEDIDO',
      descripcion: '',
      fechaProduccion: '',
      fechaEmbarque: '',
      fechaLlegada: '',
      fechaEntrega: '',
      cliente: '',
      lugar: '',
      chassis: '',
      cr: 0,
      orderNr: '',
      link: ''
    });
    setErrors({});
    setDepartmentAuth({});
    setDynamicFields({});
    setShowAddField(false);
    setNewFieldName('');
    onClose();
  };

  const getDepartmentTitle = (key: string) => {
    const titles: Record<string, string> = {
      'facturacion': 'En Facturación',
      'logistica-entrada': 'Logística de Entrada',
      'stock': 'Stock',
      'administrativo': 'Administrativo',
      'logistica-entrega': 'Logística de Entrega'
    };
    return titles[key] || key;
  };

  const getDepartmentIcon = (key: string) => {
    const icons: Record<string, React.ComponentType<any>> = {
      'facturacion': DollarSign,
      'logistica-entrada': Ship,
      'stock': CheckCircle,
      'administrativo': Settings,
      'logistica-entrega': Truck
    };
    return icons[key] || Settings;
  };

  const getDepartmentColor = (key: string) => {
    const colors: Record<string, string> = {
      'facturacion': 'bg-green-50 border-green-200',
      'logistica-entrada': 'bg-blue-50 border-blue-200',
      'stock': 'bg-emerald-50 border-emerald-200',
      'administrativo': 'bg-purple-50 border-purple-200',
      'logistica-entrega': 'bg-orange-50 border-orange-200'
    };
    return colors[key] || 'bg-gray-50 border-gray-200';
  };

  const isFieldInDepartment = (fieldName: string, departmentKey: string): boolean => {
    const departmentFields: Record<string, string[]> = {
      'facturacion': ['fechaProduccion'],
      'logistica-entrada': ['factura'],
      'stock': ['fechaLlegada', 'cliente'],
      'administrativo': ['fechaEntrega'],
      'logistica-entrega': ['fechaEntrega']
    };
    
    return departmentFields[departmentKey]?.includes(fieldName) || false;
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
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
            
            {/* Type Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Tipo de Item *
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="type"
                    value="IMPLEMENTO"
                    checked={formData.type === 'IMPLEMENTO'}
                    onChange={() => handleTypeChange('IMPLEMENTO')}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <Package className="w-4 h-4 ml-2 mr-1 text-blue-600" />
                  <span className="text-sm text-gray-700">Implemento</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="type"
                    value="MAQUINA"
                    checked={formData.type === 'MAQUINA'}
                    onChange={() => handleTypeChange('MAQUINA')}
                    className="text-green-600 focus:ring-green-500"
                  />
                  <Settings className="w-4 h-4 ml-2 mr-1 text-green-600" />
                  <span className="text-sm text-gray-700">Máquina</span>
                </label>
              </div>
            </div>

            {/* Previsualización del Item */}
            <div className="mb-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Previsualización del Item</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-gray-500">TIPO:</span>
                  <div className="font-semibold text-gray-900">{formData.type}</div>
                </div>
                <div>
                  <span className="text-gray-500">LOCAL:</span>
                  <div className="font-semibold text-gray-900">{formData.lugar || 'N/D'}</div>
                </div>
                <div>
                  <span className="text-gray-500">ESTADO:</span>
                  <div className="font-semibold text-gray-900">{formData.estado}</div>
                </div>
                <div>
                  <span className="text-gray-500">SUCURSAL:</span>
                  <div className="font-semibold text-gray-900">{formData.orderNr || 'N/D'}</div>
                </div>
                <div>
                  <span className="text-gray-500">GRUPO:</span>
                  <div className="font-semibold text-gray-900">{formData.descripcion?.substring(0, 20) || 'N/D'}</div>
                </div>
                <div>
                  <span className="text-gray-500">CÓDIGO:</span>
                  <div className="font-semibold text-gray-900">{formData.codigo || 'N/D'}</div>
                </div>
                <div>
                  <span className="text-gray-500">DESCRIPCIÓN:</span>
                  <div className="font-semibold text-gray-900">{formData.descripcion?.substring(0, 20) || 'N/D'}</div>
                </div>
                <div>
                  <span className="text-gray-500">DESC.GROUP:</span>
                  <div className="font-semibold text-gray-900">N/D</div>
                </div>
                <div>
                  <span className="text-gray-500">CHASIS:</span>
                  <div className="font-semibold text-gray-900">{formData.chassis || 'N/D'}</div>
                </div>
                <div>
                  <span className="text-gray-500">P.O:</span>
                  <div className="font-semibold text-gray-900">{formData.po || 'N/D'}</div>
                </div>
                <div>
                  <span className="text-gray-500">PROFORMA:</span>
                  <div className="font-semibold text-gray-900">{formData.proforma || 'N/D'}</div>
                </div>
                <div>
                  <span className="text-gray-500">FACTURA:</span>
                  <div className="font-semibold text-gray-900">{formData.factura || 'N/D'}</div>
                </div>
                <div>
                  <span className="text-gray-500">CPV:</span>
                  <div className="font-semibold text-gray-900">N/D</div>
                </div>
                <div>
                  <span className="text-gray-500">Fecha de Llegada:</span>
                  <div className="font-semibold text-gray-900">{formData.fechaLlegada || 'N/D'}</div>
                </div>
                <div>
                  <span className="text-gray-500">CLIENTE:</span>
                  <div className="font-semibold text-gray-900">{formData.cliente || 'N/D'}</div>
                </div>
              </div>
            </div>
            
            {/* Main Fields */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Users className="w-4 h-4 inline mr-1" />
                  Proveedor
                </label>
                <input
                  type="text"
                  name="proveedor"
                  value={formData.proveedor}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Nombre del proveedor"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Código *
                </label>
                <input
                  type="text"
                  name="codigo"
                  value={formData.codigo}
                  onChange={handleChange}
                  required
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    errors.codigo ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Código del item"
                />
                {errors.codigo && (
                  <p className="mt-1 text-sm text-red-600">{errors.codigo}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Proforma
                </label>
                <input
                  type="text"
                  name="proforma"
                  value={formData.proforma}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Número de proforma"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  P.O
                </label>
                <input
                  type="text"
                  name="po"
                  value={formData.po}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Purchase Order"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado
                </label>
                <select
                  name="estado"
                  value={formData.estado}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {availableStates.map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Users className="w-4 h-4 inline mr-1" />
                  Cliente
                </label>
                <input
                  type="text"
                  name="cliente"
                  value={formData.cliente}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Nombre del cliente"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Lugar
                </label>
                <input
                  type="text"
                  name="lugar"
                  value={formData.lugar}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Ubicación"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Truck className="w-4 h-4 inline mr-1" />
                  Chassis
                </label>
                <input
                  type="text"
                  name="chassis"
                  value={formData.chassis}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Número de chassis"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CR (Variable)
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="cr"
                  value={formData.cr}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Order Nr
                </label>
                <input
                  type="text"
                  name="orderNr"
                  value={formData.orderNr}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Número de orden"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Factura
                </label>
                <input
                  type="text"
                  name="factura"
                  value={formData.factura}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Número de factura"
                />
              </div>
            </div>

            {/* Department Sections */}
            <div className="space-y-4 mb-6">
              {/* En Facturación */}
              <div className={`border rounded-lg p-4 ${getDepartmentColor('facturacion')}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Factory className="w-5 h-5 text-green-600" />
                    <h3 className="text-sm font-semibold text-gray-900">En Facturación</h3>
                  </div>
                  {!departmentAuth['facturacion'] && (
                    <button
                      type="button"
                      onClick={() => handleDepartmentAccess('facturacion')}
                      className="flex items-center space-x-1 px-2 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors text-xs"
                    >
                      <Lock className="w-3 h-3" />
                      <span>Desbloquear</span>
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha de Producción
                    </label>
                    <input
                      type="date"
                      name="fechaProduccion"
                      value={formData.fechaProduccion}
                      onChange={handleChange}
                      disabled={!isFieldUnlocked('fechaProduccion')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Aprobación de Facturación
                    </label>
                    <input
                      type="date"
                      disabled={!isFieldUnlocked('fechaProduccion')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {/* Logística de Entrada */}
              <div className={`border rounded-lg p-4 ${getDepartmentColor('logistica-entrada')}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Ship className="w-5 h-5 text-blue-600" />
                    <h3 className="text-sm font-semibold text-gray-900">Logística de Entrada</h3>
                  </div>
                  {!departmentAuth['logistica-entrada'] && (
                    <button
                      type="button"
                      onClick={() => handleDepartmentAccess('logistica-entrada')}
                      className="flex items-center space-x-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-xs"
                    >
                      <Lock className="w-3 h-3" />
                      <span>Desbloquear</span>
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Número de Factura
                    </label>
                    <input
                      type="text"
                      name="factura"
                      value={formData.factura}
                      onChange={handleChange}
                      placeholder="Número de factura"
                      disabled={!isFieldUnlocked('factura')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {/* Stock */}
              <div className={`border rounded-lg p-4 ${getDepartmentColor('stock')}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                    <h3 className="text-sm font-semibold text-gray-900">Stock</h3>
                  </div>
                  {!departmentAuth['stock'] && (
                    <button
                      type="button"
                      onClick={() => handleDepartmentAccess('stock')}
                      className="flex items-center space-x-1 px-2 py-1 bg-emerald-100 text-emerald-700 rounded-md hover:bg-emerald-200 transition-colors text-xs"
                    >
                      <Lock className="w-3 h-3" />
                      <span>Desbloquear</span>
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha de Llegada
                    </label>
                    <input
                      type="date"
                      name="fechaLlegada"
                      value={formData.fechaLlegada}
                      onChange={handleChange}
                      disabled={!isFieldUnlocked('fechaLlegada')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Código de Carneo
                    </label>
                    <input
                      type="text"
                      placeholder="Código carneado"
                      disabled={!isFieldUnlocked('fechaLlegada')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cliente
                    </label>
                    <input
                      type="text"
                      name="cliente"
                      value={formData.cliente}
                      onChange={handleChange}
                      placeholder="Nombre del cliente"
                      disabled={!isFieldUnlocked('cliente')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {/* Administrativo */}
              <div className={`border rounded-lg p-4 ${getDepartmentColor('administrativo')}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Settings className="w-5 h-5 text-purple-600" />
                    <h3 className="text-sm font-semibold text-gray-900">Administrativo</h3>
                  </div>
                  {!departmentAuth['administrativo'] && (
                    <button
                      type="button"
                      onClick={() => handleDepartmentAccess('administrativo')}
                      className="flex items-center space-x-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors text-xs"
                    >
                      <Lock className="w-3 h-3" />
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
                      disabled={!isFieldUnlocked('fechaEntrega')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha de Entrega
                    </label>
                    <input
                      type="date"
                      name="fechaEntrega"
                      value={formData.fechaEntrega}
                      onChange={handleChange}
                      disabled={!isFieldUnlocked('fechaEntrega')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {/* Logística de Entrega */}
              <div className={`border rounded-lg p-4 ${getDepartmentColor('logistica-entrega')}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Truck className="w-5 h-5 text-orange-600" />
                    <h3 className="text-sm font-semibold text-gray-900">Logística de Entrega</h3>
                  </div>
                  {!departmentAuth['logistica-entrega'] && (
                    <button
                      type="button"
                      onClick={() => handleDepartmentAccess('logistica-entrega')}
                      className="flex items-center space-x-1 px-2 py-1 bg-orange-100 text-orange-700 rounded-md hover:bg-orange-200 transition-colors text-xs"
                    >
                      <Lock className="w-3 h-3" />
                      <span>Desbloquear</span>
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha de Entrega
                    </label>
                    <input
                      type="date"
                      name="fechaEntrega"
                      value={formData.fechaEntrega}
                      onChange={handleChange}
                      disabled={!isFieldUnlocked('fechaEntrega')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha de Entrega Técnica
                    </label>
                    <input
                      type="date"
                      disabled={!isFieldUnlocked('fechaEntrega')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha de Entrega Concluida
                    </label>
                    <input
                      type="date"
                      disabled={!isFieldUnlocked('fechaEntrega')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Campos Dinámicos */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Campos Personalizados</h3>
                <button
                  type="button"
                  onClick={() => setShowAddField(true)}
                  className="inline-flex items-center px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 space-x-2 text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  <span>Agregar Campo</span>
                </button>
              </div>

              {/* Formulario para agregar nuevo campo */}
              {showAddField && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center space-x-3">
                    <input
                      type="text"
                      value={newFieldName}
                      onChange={(e) => setNewFieldName(e.target.value)}
                      placeholder="Nombre del nuevo campo (ej: Peso, Dimensiones, etc.)"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addDynamicField();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={addDynamicField}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Agregar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddField(false);
                        setNewFieldName('');
                      }}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {/* Lista de campos dinámicos */}
              {Object.keys(dynamicFields).length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(dynamicFields).map(([fieldName, value]) => (
                    <div key={fieldName} className="relative">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {fieldName.charAt(0).toUpperCase() + fieldName.slice(1).replace(/_/g, ' ')}
                        <button
                          type="button"
                          onClick={() => removeDynamicField(fieldName)}
                          className="ml-2 text-red-500 hover:text-red-700 transition-colors"
                          title="Eliminar campo"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </label>
                      <input
                        type="text"
                        value={value || ''}
                        onChange={(e) => handleDynamicFieldChange(fieldName, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder={`Ingrese ${fieldName.replace(/_/g, ' ')}`}
                      />
                    </div>
                  ))}
                </div>
              )}

              {Object.keys(dynamicFields).length === 0 && !showAddField && (
                <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <Package className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">No hay campos personalizados</p>
                  <p className="text-gray-400 text-xs mt-1">Los campos se crean automáticamente al asociar datos por código</p>
                </div>
              )}
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción *
              </label>
              <textarea
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                rows={3}
                required
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                  errors.descripcion ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Descripción detallada del item"
              />
              {errors.descripcion && (
                <p className="mt-1 text-sm text-red-600">{errors.descripcion}</p>
              )}
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enlace (URL)
              </label>
              <input
                type="url"
                name="link"
                value={formData.link || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="https://ejemplo.com"
              />
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
                <p className="mt-2 text-xs text-gray-500">
                  Cada departamento requiere una contraseña específica para editar sus campos
                </p>
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