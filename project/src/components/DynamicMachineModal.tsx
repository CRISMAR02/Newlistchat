import React, { useState, useEffect } from 'react';
import { X, Save, Calendar, MapPin, DollarSign, Link } from 'lucide-react';
import { Machine } from '../types/machine';
import { useMachineTableSettings } from '../hooks/useTableSettings';

interface DynamicMachineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (machine: Omit<Machine, 'id'>) => Promise<void>;
  machine?: Machine | null;
  title: string;
}

const DynamicMachineModal: React.FC<DynamicMachineModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  machine, 
  title 
}) => {
  const { settings } = useMachineTableSettings();
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form data based on columns configuration
  useEffect(() => {
    if (isOpen) {
      const initialData: Record<string, any> = {};
      
      settings.columns.forEach(column => {
        if (machine) {
          initialData[column.key] = machine[column.key] || '';
        } else {
          // Set default values for new machines
          switch (column.type) {
            case 'number':
              initialData[column.key] = 0;
              break;
            case 'select':
              if (column.options && column.options.length > 0) {
                initialData[column.key] = column.options[0];
              } else {
                initialData[column.key] = '';
              }
              break;
            default:
              initialData[column.key] = '';
          }
        }
      });
      
      setFormData(initialData);
      setErrors({});
    }
  }, [isOpen, machine, settings.columns]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    settings.columns.forEach(column => {
      if (column.required && !formData[column.key]?.toString().trim()) {
        newErrors[column.key] = `${column.label} es requerido`;
      }
    });
    
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
      await onSave(formData as Omit<Machine, 'id'>);
      onClose();
    } catch (error) {
      console.error('Error saving machine:', error);
      setErrors({ general: 'Error al guardar la máquina. Intente nuevamente.' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const column = settings.columns.find(col => col.key === name);
    
    let processedValue = value;
    if (column?.type === 'number') {
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

  const handleClose = () => {
    setFormData({});
    setErrors({});
    onClose();
  };

  const renderField = (column: any) => {
    const value = formData[column.key] || '';
    const hasError = !!errors[column.key];
    
    const baseClasses = `w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
      hasError ? 'border-red-500' : 'border-gray-300'
    }`;

    switch (column.type) {
      case 'select':
        return (
          <select
            name={column.key}
            value={value}
            onChange={handleChange}
            required={column.required}
            className={baseClasses}
          >
            <option value="">Seleccionar {column.label.toLowerCase()}</option>
            {column.options?.map((option: string) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );
      
      case 'number':
        return (
          <input
            type="number"
            step="0.01"
            name={column.key}
            value={value}
            onChange={handleChange}
            required={column.required}
            className={baseClasses}
            placeholder={`Ingrese ${column.label.toLowerCase()}`}
          />
        );
      
      case 'date':
        return (
          <input
            type="date"
            name={column.key}
            value={value}
            onChange={handleChange}
            required={column.required}
            className={baseClasses}
          />
        );
      
      case 'url':
        return (
          <input
            type="url"
            name={column.key}
            value={value}
            onChange={handleChange}
            required={column.required}
            className={baseClasses}
            placeholder="https://ejemplo.com"
          />
        );
      
      default:
        if (column.key === 'descripcion') {
          return (
            <textarea
              name={column.key}
              value={value}
              onChange={handleChange}
              rows={3}
              required={column.required}
              className={baseClasses}
              placeholder={`Ingrese ${column.label.toLowerCase()}`}
            />
          );
        }
        
        return (
          <input
            type="text"
            name={column.key}
            value={value}
            onChange={handleChange}
            required={column.required}
            className={baseClasses}
            placeholder={`Ingrese ${column.label.toLowerCase()}`}
          />
        );
    }
  };

  if (!isOpen) return null;

  const visibleColumns = settings.columns.sort((a, b) => a.order - b.order);

  return (
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
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {visibleColumns.map((column) => (
              <div key={column.key} className={column.key === 'descripcion' ? 'md:col-span-3' : ''}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {column.label}
                  {column.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                {renderField(column)}
                {errors[column.key] && (
                  <p className="mt-1 text-sm text-red-600">{errors[column.key]}</p>
                )}
              </div>
            ))}
          </div>
          
          <div className="flex space-x-3 mt-6">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
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
  );
};

export default DynamicMachineModal;