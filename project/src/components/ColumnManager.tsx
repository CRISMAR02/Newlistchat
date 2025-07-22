import React, { useState } from 'react';
import { X, Plus, Settings, Eye, EyeOff, GripVertical, Trash2, RotateCcw } from 'lucide-react';
import { ColumnConfig } from '../types/product';
import { MachineColumnConfig } from '../types/machine';
import Swal from 'sweetalert2';

interface ColumnManagerProps {
  isOpen: boolean;
  onClose: () => void;
  columns: (ColumnConfig | MachineColumnConfig)[];
  onAddColumn: (column: Omit<ColumnConfig | MachineColumnConfig, 'order'>) => void;
  onRemoveColumn: (key: string) => void;
  onUpdateColumn: (key: string, updates: Partial<ColumnConfig | MachineColumnConfig>) => void;
  onResetToDefault: () => void;
  defaultColumns: string[];
  title: string;
}

const ColumnManager: React.FC<ColumnManagerProps> = ({
  isOpen,
  onClose,
  columns,
  onAddColumn,
  onRemoveColumn,
  onUpdateColumn,
  onResetToDefault,
  defaultColumns,
  title
}) => {
  const [newColumn, setNewColumn] = useState({
    key: '',
    label: '',
    type: 'text' as const,
    visible: true,
    required: false,
    options: [] as string[]
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [optionsText, setOptionsText] = useState('');

  const handleAddColumn = () => {
    if (!newColumn.key.trim() || !newColumn.label.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos requeridos',
        text: 'La clave y etiqueta son requeridas',
        confirmButtonColor: '#dc2626'
      });
      return;
    }

    if (columns.some(col => col.key === newColumn.key)) {
      Swal.fire({
        icon: 'error',
        title: 'Clave duplicada',
        text: 'Ya existe una columna con esa clave',
        confirmButtonColor: '#dc2626'
      });
      return;
    }

    const columnToAdd = {
      ...newColumn,
      options: newColumn.type === 'select' ? optionsText.split(',').map(opt => opt.trim()).filter(Boolean) : undefined
    };

    onAddColumn(columnToAdd);
    setNewColumn({
      key: '',
      label: '',
      type: 'text',
      visible: true,
      required: false,
      options: []
    });
    setOptionsText('');
    setShowAddForm(false);
    
    Swal.fire({
      icon: 'success',
      title: '¡Columna agregada!',
      text: 'La nueva columna se ha agregado correctamente',
      timer: 2000,
      showConfirmButton: false,
      toast: true,
      position: 'top-end'
    });
  };

  const handleRemoveColumn = async (key: string) => {
    if (defaultColumns.includes(key)) {
      Swal.fire({
        icon: 'warning',
        title: 'No se puede eliminar',
        text: 'Esta es una columna por defecto y no se puede eliminar',
        confirmButtonColor: '#dc2626'
      });
      return;
    }

    const result = await Swal.fire({
      title: '¿Eliminar columna?',
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
        onRemoveColumn(key);
        Swal.fire({
          icon: 'success',
          title: '¡Columna eliminada!',
          timer: 2000,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
      } catch (error: any) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.message,
          confirmButtonColor: '#dc2626'
        });
      }
    }
  };

  const handleResetToDefault = async () => {
    const result = await Swal.fire({
      title: '¿Restaurar configuración por defecto?',
      text: 'Se perderán todas las columnas personalizadas',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, restaurar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      onResetToDefault();
      Swal.fire({
        icon: 'success',
        title: '¡Configuración restaurada!',
        timer: 2000,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
    }
  };

  if (!isOpen) return null;

  const sortedColumns = [...columns].sort((a, b) => a.order - b.order);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-gray-100">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Gestión de Columnas</h2>
              <p className="text-sm text-gray-500">{title}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleResetToDefault}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors hover:bg-gray-100 rounded-lg"
              title="Restaurar por defecto"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
          {/* Add Column Button */}
          <div className="mb-6">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 space-x-2 font-medium shadow-lg hover:shadow-xl"
            >
              <Plus className="w-4 h-4" />
              <span>Agregar Columna</span>
            </button>
          </div>

          {/* Add Column Form */}
          {showAddForm && (
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Nueva Columna</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Clave (ID único) *
                  </label>
                  <input
                    type="text"
                    value={newColumn.key}
                    onChange={(e) => setNewColumn({ ...newColumn, key: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '') })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="ej: precio_unitario"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Etiqueta (Nombre visible) *
                  </label>
                  <input
                    type="text"
                    value={newColumn.label}
                    onChange={(e) => setNewColumn({ ...newColumn, label: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="ej: Precio Unitario"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Campo
                  </label>
                  <select
                    value={newColumn.type}
                    onChange={(e) => setNewColumn({ ...newColumn, type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="text">Texto</option>
                    <option value="number">Número</option>
                    <option value="date">Fecha</option>
                    <option value="select">Lista de opciones</option>
                    <option value="url">URL/Enlace</option>
                  </select>
                </div>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newColumn.visible}
                      onChange={(e) => setNewColumn({ ...newColumn, visible: e.target.checked })}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Visible</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newColumn.required}
                      onChange={(e) => setNewColumn({ ...newColumn, required: e.target.checked })}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Requerido</span>
                  </label>
                </div>
              </div>
              
              {newColumn.type === 'select' && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Opciones (separadas por comas)
                  </label>
                  <input
                    type="text"
                    value={optionsText}
                    onChange={(e) => setOptionsText(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="ej: Opción 1, Opción 2, Opción 3"
                  />
                </div>
              )}
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={handleAddColumn}
                  className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors font-medium"
                >
                  Agregar Columna
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors font-medium"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Columns List */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Columnas Configuradas</h3>
            {sortedColumns.map((column) => (
              <div
                key={column.key}
                className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <GripVertical className="w-4 h-4 text-gray-400" />
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onUpdateColumn(column.key, { visible: !column.visible })}
                        className={`p-1 rounded transition-colors ${
                          column.visible 
                            ? 'text-green-600 hover:bg-green-100' 
                            : 'text-gray-400 hover:bg-gray-100'
                        }`}
                      >
                        {column.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-900">{column.label}</span>
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                            {column.key}
                          </span>
                          <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                            {column.type}
                          </span>
                          {column.required && (
                            <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">
                              Requerido
                            </span>
                          )}
                          {defaultColumns.includes(column.key) && (
                            <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">
                              Por defecto
                            </span>
                          )}
                        </div>
                        {column.options && column.options.length > 0 && (
                          <div className="text-xs text-gray-500 mt-1">
                            Opciones: {column.options.join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {!defaultColumns.includes(column.key) && (
                      <button
                        onClick={() => handleRemoveColumn(column.key)}
                        className="p-2 text-red-600 hover:text-red-900 hover:bg-red-100 rounded-lg transition-all duration-200"
                        title="Eliminar columna"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ColumnManager;