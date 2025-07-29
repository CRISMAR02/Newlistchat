import React, { useState, useEffect } from 'react';
import { X, Save, Calendar, MapPin, DollarSign, Link } from 'lucide-react';
import { Machine } from '../types/machine';

interface MachineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (machine: Omit<Machine, 'id'>) => Promise<void>;
  machine?: Machine | null;
  title: string;
}

const MachineModal: React.FC<MachineModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  machine, 
  title 
}) => {
  const [formData, setFormData] = useState<Omit<Machine, 'id'>>({
    orderNr: '',
    codigo: '',
    descripcion: '',
    chasis: '',
    po: '',
    model: '',
    plant: '',
    orderPrice: 0,
    totalPerUnit: 0,
    totalAmountUSD: 0,
    nc: 0,
    cuadroTfDe: '',
    estado: '',
    llegada: '',
    ubicacion: '',
    link: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when modal opens/closes or machine changes
  useEffect(() => {
    if (isOpen) {
      if (machine) {
        // Editing existing machine
        setFormData({
          orderNr: machine.orderNr || '',
          codigo: machine.codigo || '',
          descripcion: machine.descripcion || '',
          chasis: machine.chasis || '',
          po: machine.po || '',
          model: machine.model || '',
          plant: machine.plant || '',
          orderPrice: machine.orderPrice || 0,
          totalPerUnit: machine.totalPerUnit || 0,
          totalAmountUSD: machine.totalAmountUSD || 0,
          nc: machine.nc || 0,
          cuadroTfDe: machine.cuadroTfDe || '',
          estado: machine.estado || '',
          llegada: machine.llegada || '',
          ubicacion: machine.ubicacion || '',
          link: machine.link || ''
        });
      } else {
        // Adding new machine
        setFormData({
          orderNr: '',
          codigo: '',
          descripcion: '',
          chasis: '',
          po: '',
          model: '',
          plant: '',
          orderPrice: 0,
          totalPerUnit: 0,
          totalAmountUSD: 0,
          nc: 0,
          cuadroTfDe: '',
          estado: '',
          llegada: '',
          ubicacion: '',
          link: ''
        });
      }
      setErrors({});
    }
  }, [isOpen, machine]);

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
      await onSave(formData);
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
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('Price') || name.includes('Amount') || name === 'nc' ? 
        (value === '' ? 0 : parseFloat(value) || 0) : value
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
    setFormData({
      orderNr: '',
      codigo: '',
      descripcion: '',
      chasis: '',
      po: '',
      model: '',
      plant: '',
      orderPrice: 0,
      totalPerUnit: 0,
      totalAmountUSD: 0,
      nc: 0,
      cuadroTfDe: '',
      estado: '',
      llegada: '',
      ubicacion: '',
      link: ''
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Order Nr.
              </label>
              <input
                type="text"
                name="orderNr"
                value={formData.orderNr}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Número de orden"
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
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.codigo ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Código de la máquina"
              />
              {errors.codigo && (
                <p className="mt-1 text-sm text-red-600">{errors.codigo}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chasis
              </label>
              <input
                type="text"
                name="chasis"
                value={formData.chasis}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Número de chasis"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Purchase Order"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Model
              </label>
              <input
                type="text"
                name="model"
                value={formData.model}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Modelo"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Plant
              </label>
              <input
                type="text"
                name="plant"
                value={formData.plant}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Planta"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="w-4 h-4 inline mr-1" />
                Order Price
              </label>
              <input
                type="number"
                step="0.01"
                name="orderPrice"
                value={formData.orderPrice}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="w-4 h-4 inline mr-1" />
                Total per Unit
              </label>
              <input
                type="number"
                step="0.01"
                name="totalPerUnit"
                value={formData.totalPerUnit}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="w-4 h-4 inline mr-1" />
                Total Amount USD
              </label>
              <input
                type="number"
                step="0.01"
                name="totalAmountUSD"
                value={formData.totalAmountUSD}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                NC
              </label>
              <input
                type="number"
                step="0.01"
                name="nc"
                value={formData.nc}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Cuadro TF DE
              </label>
              <input
                type="text"
                name="cuadroTfDe"
                value={formData.cuadroTfDe}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="ej: feb-25"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Seleccionar estado</option>
                <option value="En Stock - Libre">En Stock - Libre</option>
                <option value="Facturado">Facturado</option>
                <option value="Entregado">Entregado</option>
                <option value="IDA3 - En Conferencia - Libre">IDA3 - En Conferencia - Libre</option>
                <option value="Disponible Embarque - Libre">Disponible Embarque - Libre</option>
                <option value="P. C. Importacion - Libre">P. C. Importacion - Libre</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Llegada
              </label>
              <input
                type="text"
                name="llegada"
                value={formData.llegada}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Información de llegada"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                Ubicación
              </label>
              <select
                name="ubicacion"
                value={formData.ubicacion}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Seleccionar ubicación</option>
                <option value="MATRIZ">MATRIZ</option>
                <option value="KATUETE">KATUETE</option>
                <option value="SAN ALBERTO">SAN ALBERTO</option>
                <option value="SANTA RITA">SANTA RITA</option>
                <option value="BELLA VISTA">BELLA VISTA</option>
                <option value="CAMPO 9">CAMPO 9</option>
                <option value="PACTUS">PACTUS</option>
              </select>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Link className="w-4 h-4 inline mr-1" />
                Enlace (URL)
              </label>
              <input
                type="url"
                name="link"
                value={formData.link}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://ejemplo.com"
              />
            </div>
          </div>
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción *
            </label>
            <textarea
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              rows={3}
              required
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.descripcion ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Descripción de la máquina"
            />
            {errors.descripcion && (
              <p className="mt-1 text-sm text-red-600">{errors.descripcion}</p>
            )}
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

export default MachineModal;