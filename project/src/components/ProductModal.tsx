import React, { useState, useEffect } from 'react';
import { X, Save, Calendar, MapPin, DollarSign } from 'lucide-react';
import { Product } from '../types/product';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Omit<Product, 'id'>) => Promise<void>;
  product?: Product | null;
  title: string;
}

const ProductModal: React.FC<ProductModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  product, 
  title 
}) => {
  const [formData, setFormData] = useState<Omit<Product, 'id'>>({
    codigo: '',
    proforma: '',
    factura: '',
    disponibilidad: 'STOCK',
    descripcion: '',
    llegada: 'EN CIABAY',
    sucursal: '',
    cliente: '',
    lugar: 'CIABAY'
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when modal opens/closes or product changes
  useEffect(() => {
    if (isOpen) {
      if (product) {
        // Editing existing product
        setFormData({
          codigo: product.codigo || '',
          proforma: product.proforma || '',
          factura: product.factura || '',
          disponibilidad: product.disponibilidad || 'STOCK',
          descripcion: product.descripcion || '',
          llegada: product.llegada || 'EN CIABAY',
          sucursal: product.sucursal || '',
          cliente: product.cliente || '',
          lugar: product.lugar || 'CIABAY'
        });
      } else {
        // Adding new product
        setFormData({
          codigo: '',
          proforma: '',
          factura: '',
          disponibilidad: 'STOCK',
          descripcion: '',
          llegada: 'EN CIABAY',
          sucursal: '',
          cliente: '',
          lugar: 'CIABAY'
        });
      }
      setErrors({});
    }
  }, [isOpen, product]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.codigo.trim()) {
      newErrors.codigo = 'El código es requerido';
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
      console.error('Error saving product:', error);
      setErrors({ general: 'Error al guardar el producto. Intente nuevamente.' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
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
      codigo: '',
      proforma: '',
      factura: '',
      disponibilidad: 'STOCK',
      descripcion: '',
      llegada: 'EN CIABAY',
      sucursal: '',
      cliente: '',
      lugar: 'CIABAY'
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
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
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                placeholder="Ingrese el código del producto"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Número de proforma"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Número de factura"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="w-4 h-4 inline mr-1" />
                Estado del Producto
              </label>
              <select
                name="disponibilidad"
                value={formData.disponibilidad}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="STOCK">STOCK (Disponible)</option>
                <option value="FACTURADO">FACTURADO (Vendido)</option>
                <option value="VENDIDO">VENDIDO</option>
                <option value="EN CIABAY">EN CIABAY</option>
                <option value="ENTREGADO">ENTREGADO</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Ubicación/Llegada
              </label>
              <select
                name="llegada"
                value={formData.llegada}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Seleccionar...</option>
                <option value="EN CIABAY">EN CIABAY</option>
                <option value="EN PACTUS">EN PACTUS</option>
                <option value="ENTREGADO">ENTREGADO</option>
                <optgroup label="Fechas de llegada">
                  <option value="15-jul.">15-jul.</option>
                  <option value="21-jul.">21-jul.</option>
                  <option value="30-jul.">30-jul.</option>
                  <option value="4-jul.">4-jul.</option>
                  <option value="7-jul.">7-jul.</option>
                  <option value="8-jul.">8-jul.</option>
                  <option value="10-jul.">10-jul.</option>
                  <option value="14-jul.">14-jul.</option>
                  <option value="20-jul.">20-jul.</option>
                  <option value="15-ago.">15-ago.</option>
                </optgroup>
              </select>
              <input
                type="text"
                name="llegada"
                value={formData.llegada}
                onChange={handleChange}
                placeholder="O escribir fecha personalizada (ej: 25-jul.)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mt-2"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sucursal
              </label>
              <select
                name="sucursal"
                value={formData.sucursal}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Seleccionar sucursal</option>
                <option value="SAN ALBERTO">SAN ALBERTO</option>
                <option value="SANTA RITA">SANTA RITA</option>
                <option value="BELLA VISTA">BELLA VISTA</option>
                <option value="CAMPO 9">CAMPO 9</option>
                <option value="PACTUS">PACTUS</option>
                <option value="SANTA ROSA">SANTA ROSA</option>
                <option value="KATUETE">KATUETE</option>
              </select>
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nombre del cliente"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                Lugar
              </label>
              <select
                name="lugar"
                value={formData.lugar}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Seleccionar lugar</option>
                <option value="CIABAY">CIABAY</option>
                <option value="PACTUS">PACTUS</option>
                <option value="CIABAY/PACTUS">CIABAY/PACTUS</option>
              </select>
            </div>
          </div>
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción
            </label>
            <textarea
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Descripción del producto"
            />
          </div>
          
          <div className="bg-blue-50 p-4 rounded-md mt-4">
            <h4 className="text-sm font-medium text-blue-800 mb-2">Guía de Estados:</h4>
            <ul className="text-xs text-blue-700 space-y-1">
              <li><strong>STOCK:</strong> Producto disponible para venta</li>
              <li><strong>FACTURADO:</strong> Producto vendido (ya facturado)</li>
              <li><strong>VENDIDO:</strong> Producto vendido pero no facturado</li>
              <li><strong>ENTREGADO:</strong> Producto entregado al cliente</li>
            </ul>
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

export default ProductModal;