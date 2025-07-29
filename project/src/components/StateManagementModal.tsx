import React, { useState, useEffect } from 'react';
import { X, Plus, Edit, Trash2, Save, Settings, Factory, Ship, CheckCircle, Wrench, Truck, Users, Package } from 'lucide-react';
import { Department, CustomState } from '../types/inventory';
import { stateManagementService } from '../services/stateManagementService';
import Swal from 'sweetalert2';

interface StateManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStateAdded?: () => void;
}

const StateManagementModal: React.FC<StateManagementModalProps> = ({
  isOpen,
  onClose,
  onStateAdded
}) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [customStates, setCustomStates] = useState<CustomState[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'states' | 'departments'>('states');
  const [showAddStateForm, setShowAddStateForm] = useState(false);
  const [showAddDepartmentForm, setShowAddDepartmentForm] = useState(false);
  const [editingState, setEditingState] = useState<CustomState | null>(null);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);

  // Form states
  const [newState, setNewState] = useState({
    name: '',
    departmentId: '',
    order: 0,
    isActive: true
  });

  const [newDepartment, setNewDepartment] = useState({
    name: '',
    color: 'from-blue-500 to-blue-600',
    bgColor: 'from-blue-50 to-blue-100',
    textColor: 'text-blue-700',
    icon: 'Package',
    description: ''
  });

  const iconOptions = [
    { value: 'Factory', label: 'Fábrica', icon: Factory },
    { value: 'Ship', label: 'Barco', icon: Ship },
    { value: 'CheckCircle', label: 'Check', icon: CheckCircle },
    { value: 'Wrench', label: 'Herramienta', icon: Wrench },
    { value: 'Truck', label: 'Camión', icon: Truck },
    { value: 'Users', label: 'Usuarios', icon: Users },
    { value: 'Package', label: 'Paquete', icon: Package },
    { value: 'Settings', label: 'Configuración', icon: Settings }
  ];

  const colorOptions = [
    { value: 'from-blue-500 to-blue-600', label: 'Azul', bg: 'from-blue-50 to-blue-100', text: 'text-blue-700' },
    { value: 'from-green-500 to-green-600', label: 'Verde', bg: 'from-green-50 to-green-100', text: 'text-green-700' },
    { value: 'from-purple-500 to-purple-600', label: 'Morado', bg: 'from-purple-50 to-purple-100', text: 'text-purple-700' },
    { value: 'from-red-500 to-red-600', label: 'Rojo', bg: 'from-red-50 to-red-100', text: 'text-red-700' },
    { value: 'from-yellow-500 to-yellow-600', label: 'Amarillo', bg: 'from-yellow-50 to-yellow-100', text: 'text-yellow-700' },
    { value: 'from-indigo-500 to-indigo-600', label: 'Índigo', bg: 'from-indigo-50 to-indigo-100', text: 'text-indigo-700' },
    { value: 'from-pink-500 to-pink-600', label: 'Rosa', bg: 'from-pink-50 to-pink-100', text: 'text-pink-700' },
    { value: 'from-gray-500 to-gray-600', label: 'Gris', bg: 'from-gray-50 to-gray-100', text: 'text-gray-700' }
  ];

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    setLoading(true);
    try {
      await stateManagementService.initializeDefaultDepartments();
      const [depts, states] = await Promise.all([
        stateManagementService.getAllDepartments(),
        stateManagementService.getAllCustomStates()
      ]);
      setDepartments(depts);
      setCustomStates(states);
    } catch (error) {
      console.error('Error fetching data:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar los datos',
        confirmButtonColor: '#dc2626'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddState = async () => {
    if (!newState.name.trim() || !newState.departmentId) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos requeridos',
        text: 'El nombre del estado y el departamento son requeridos',
        confirmButtonColor: '#dc2626'
      });
      return;
    }

    try {
      await stateManagementService.addCustomState({
        name: newState.name.toUpperCase(),
        departmentId: newState.departmentId,
        order: customStates.length + 1,
        isActive: newState.isActive
      });

      await fetchData();
      setNewState({ name: '', departmentId: '', order: 0, isActive: true });
      setShowAddStateForm(false);
      onStateAdded?.();

      await Swal.fire({
        icon: 'success',
        title: '¡Estado agregado!',
        text: `El estado "${newState.name}" se ha agregado correctamente`,
        timer: 2000,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
    } catch (error: any) {
      await Swal.fire({
        icon: 'error',
        title: 'Error al agregar estado',
        text: error.message || 'No se pudo agregar el estado',
        confirmButtonColor: '#dc2626'
      });
    }
  };

  const handleAddDepartment = async () => {
    if (!newDepartment.name.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Nombre requerido',
        text: 'El nombre del departamento es requerido',
        confirmButtonColor: '#dc2626'
      });
      return;
    }

    try {
      await stateManagementService.addDepartment(newDepartment);
      await fetchData();
      setNewDepartment({
        name: '',
        color: 'from-blue-500 to-blue-600',
        bgColor: 'from-blue-50 to-blue-100',
        textColor: 'text-blue-700',
        icon: 'Package',
        description: ''
      });
      setShowAddDepartmentForm(false);

      await Swal.fire({
        icon: 'success',
        title: '¡Departamento agregado!',
        text: `El departamento "${newDepartment.name}" se ha agregado correctamente`,
        timer: 2000,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
    } catch (error: any) {
      await Swal.fire({
        icon: 'error',
        title: 'Error al agregar departamento',
        text: error.message || 'No se pudo agregar el departamento',
        confirmButtonColor: '#dc2626'
      });
    }
  };

  const handleDeleteState = async (state: CustomState) => {
    const result = await Swal.fire({
      title: '¿Eliminar estado?',
      text: `Se eliminará el estado "${state.name}". Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await stateManagementService.deleteCustomState(state.id);
        await fetchData();
        onStateAdded?.();

        await Swal.fire({
          icon: 'success',
          title: '¡Estado eliminado!',
          timer: 2000,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
      } catch (error: any) {
        await Swal.fire({
          icon: 'error',
          title: 'Error al eliminar',
          text: error.message || 'No se pudo eliminar el estado',
          confirmButtonColor: '#dc2626'
        });
      }
    }
  };

  const handleDeleteDepartment = async (department: Department) => {
    const result = await Swal.fire({
      title: '¿Eliminar departamento?',
      text: `Se eliminará el departamento "${department.name}". Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await stateManagementService.deleteDepartment(department.id);
        await fetchData();

        await Swal.fire({
          icon: 'success',
          title: '¡Departamento eliminado!',
          timer: 2000,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
      } catch (error: any) {
        await Swal.fire({
          icon: 'error',
          title: 'Error al eliminar',
          text: error.message || 'No se pudo eliminar el departamento',
          confirmButtonColor: '#dc2626'
        });
      }
    }
  };

  const getIconComponent = (iconName: string) => {
    const iconOption = iconOptions.find(opt => opt.value === iconName);
    return iconOption ? iconOption.icon : Package;
  };

  const getDepartmentName = (departmentId: string) => {
    const dept = departments.find(d => d.id === departmentId);
    return dept?.name || 'Departamento desconocido';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col border border-gray-100">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Gestión de Estados y Departamentos</h2>
              <p className="text-sm text-gray-500">Administra estados personalizados y departamentos</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('states')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'states'
                ? 'border-b-2 border-purple-500 text-purple-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Estados Personalizados
          </button>
          <button
            onClick={() => setActiveTab('departments')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'departments'
                ? 'border-b-2 border-purple-500 text-purple-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Departamentos
          </button>
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Cargando datos...</p>
              </div>
            </div>
          ) : (
            <>
              {activeTab === 'states' && (
                <div>
                  {/* Add State Button */}
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Estados Personalizados</h3>
                    <button
                      onClick={() => setShowAddStateForm(true)}
                      className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 space-x-2 font-medium shadow-lg hover:shadow-xl"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Agregar Estado</span>
                    </button>
                  </div>

                  {/* Add State Form */}
                  {showAddStateForm && (
                    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-6 mb-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Nuevo Estado</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nombre del Estado *
                          </label>
                          <input
                            type="text"
                            value={newState.name}
                            onChange={(e) => setNewState({ ...newState, name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="ej: EN REVISIÓN TÉCNICA"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Departamento *
                          </label>
                          <select
                            value={newState.departmentId}
                            onChange={(e) => setNewState({ ...newState, departmentId: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          >
                            <option value="">Seleccionar departamento</option>
                            {departments.map(dept => (
                              <option key={dept.id} value={dept.id}>{dept.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      
                      <div className="flex items-center mt-4">
                        <input
                          type="checkbox"
                          id="isActive"
                          checked={newState.isActive}
                          onChange={(e) => setNewState({ ...newState, isActive: e.target.checked })}
                          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                          Estado activo
                        </label>
                      </div>
                      
                      <div className="flex space-x-3 mt-6">
                        <button
                          onClick={handleAddState}
                          className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors font-medium"
                        >
                          Agregar Estado
                        </button>
                        <button
                          onClick={() => setShowAddStateForm(false)}
                          className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors font-medium"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}

                  {/* States List */}
                  <div className="space-y-3">
                    {customStates.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Settings className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500 text-lg font-medium">No hay estados personalizados</p>
                        <p className="text-gray-400 text-sm mt-1">Agrega estados personalizados para tu flujo de trabajo</p>
                      </div>
                    ) : (
                      customStates.map((state) => (
                        <div
                          key={state.id}
                          className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all duration-200"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3">
                                <span className={`inline-flex items-center px-3 py-1 text-sm font-semibold rounded-full ${
                                  state.isActive 
                                    ? 'bg-green-100 text-green-800 border border-green-300' 
                                    : 'bg-gray-100 text-gray-600 border border-gray-300'
                                }`}>
                                  {state.name}
                                </span>
                                <span className="text-sm text-gray-500">
                                  → {getDepartmentName(state.departmentId)}
                                </span>
                                {!state.isActive && (
                                  <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">
                                    Inactivo
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-400 mt-1">
                                Creado: {state.createdAt.toLocaleDateString('es-ES')}
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => setEditingState(state)}
                                className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-colors"
                                title="Editar estado"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteState(state)}
                                className="p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg transition-colors"
                                title="Eliminar estado"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'departments' && (
                <div>
                  {/* Add Department Button */}
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Departamentos</h3>
                    <button
                      onClick={() => setShowAddDepartmentForm(true)}
                      className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 space-x-2 font-medium shadow-lg hover:shadow-xl"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Agregar Departamento</span>
                    </button>
                  </div>

                  {/* Add Department Form */}
                  {showAddDepartmentForm && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Nuevo Departamento</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nombre del Departamento *
                          </label>
                          <input
                            type="text"
                            value={newDepartment.name}
                            onChange={(e) => setNewDepartment({ ...newDepartment, name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="ej: Control de Calidad"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Icono
                          </label>
                          <select
                            value={newDepartment.icon}
                            onChange={(e) => setNewDepartment({ ...newDepartment, icon: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            {iconOptions.map(option => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Color del Tema
                          </label>
                          <select
                            value={newDepartment.color}
                            onChange={(e) => {
                              const colorOption = colorOptions.find(opt => opt.value === e.target.value);
                              if (colorOption) {
                                setNewDepartment({
                                  ...newDepartment,
                                  color: colorOption.value,
                                  bgColor: colorOption.bg,
                                  textColor: colorOption.text
                                });
                              }
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            {colorOptions.map(option => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Descripción
                          </label>
                          <textarea
                            value={newDepartment.description}
                            onChange={(e) => setNewDepartment({ ...newDepartment, description: e.target.value })}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Descripción del departamento"
                          />
                        </div>
                      </div>
                      
                      <div className="flex space-x-3 mt-6">
                        <button
                          onClick={handleAddDepartment}
                          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                          Agregar Departamento
                        </button>
                        <button
                          onClick={() => setShowAddDepartmentForm(false)}
                          className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors font-medium"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Departments List */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {departments.map((department) => {
                      const IconComponent = getIconComponent(department.icon);
                      const statesInDept = customStates.filter(s => s.departmentId === department.id);
                      
                      return (
                        <div
                          key={department.id}
                          className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-all duration-200"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <div className={`w-12 h-12 bg-gradient-to-br ${department.color} rounded-xl flex items-center justify-center`}>
                                <IconComponent className="w-6 h-6 text-white" />
                              </div>
                              <div>
                                <h4 className="text-lg font-semibold text-gray-900">{department.name}</h4>
                                <p className="text-sm text-gray-600">{department.description}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => setEditingDepartment(department)}
                                className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-colors"
                                title="Editar departamento"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteDepartment(department)}
                                className="p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg transition-colors"
                                title="Eliminar departamento"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          
                          <div className="text-sm text-gray-500">
                            <strong>Estados personalizados:</strong> {statesInDept.length}
                            {statesInDept.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {statesInDept.map(state => (
                                  <span
                                    key={state.id}
                                    className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                                      state.isActive 
                                        ? 'bg-green-100 text-green-700' 
                                        : 'bg-gray-100 text-gray-600'
                                    }`}
                                  >
                                    {state.name}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-100 bg-gray-50">
          <div className="text-sm text-gray-500">
            {activeTab === 'states' 
              ? `${customStates.length} estados personalizados`
              : `${departments.length} departamentos configurados`
            }
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default StateManagementModal;