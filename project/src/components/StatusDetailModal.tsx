import React, { useState, useMemo } from 'react';
import { X, Search, Edit, Trash2, ExternalLink, Package, Settings } from 'lucide-react';
import { InventoryItem } from '../types/inventory';

interface StatusDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: InventoryItem[];
  statusGroup: {
    title: string;
    states: string[];
    color: string;
    bgColor: string;
    textColor: string;
    icon: React.ComponentType<any>;
  };
  onEdit?: (item: InventoryItem) => void;
  onDelete?: (id: string, type: 'IMPLEMENTO' | 'MAQUINA') => void;
  onOpenLink?: (url: string, title: string) => void;
  isAuthenticated: boolean;
}

const StatusDetailModal: React.FC<StatusDetailModalProps> = ({
  isOpen,
  onClose,
  items,
  statusGroup,
  onEdit,
  onDelete,
  onOpenLink,
  isAuthenticated
}) => {
  // Don't render if statusGroup is null
  if (!statusGroup) {
    return null;
  }

  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Filter items that belong to this status group
  const groupItems = useMemo(() => {
    return items.filter(item => statusGroup.states.includes(item.estado));
  }, [items, statusGroup.states]);

  // Apply search filter
  const filteredItems = useMemo(() => {
    if (!searchTerm) return groupItems;
    
    return groupItems.filter(item =>
      Object.values(item).some(value =>
        value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [groupItems, searchTerm]);

  const handleDelete = (id: string, type: 'IMPLEMENTO' | 'MAQUINA') => {
    if (deleteConfirm === id && onDelete) {
      onDelete(id, type);
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(id);
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  const getTypeIcon = (type: 'IMPLEMENTO' | 'MAQUINA') => {
    return type === 'IMPLEMENTO' ? 
      <Package className="w-4 h-4 text-blue-500" /> : 
      <Settings className="w-4 h-4 text-green-500" />;
  };

  const getTypeColor = (type: 'IMPLEMENTO' | 'MAQUINA') => {
    return type === 'IMPLEMENTO' ? 
      'bg-blue-100 text-blue-800 border-blue-300' : 
      'bg-green-100 text-green-800 border-green-300';
  };

  const getStatusColor = (estado: string) => {
    const statusColors: Record<string, string> = {
      'PEDIDO': 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border-gray-300',
      'FACTURACIÓN': 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border-yellow-300',
      'EMBARQUE LIBRE': 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border-blue-300',
      'TRANSITO': 'bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800 border-orange-300',
      'ADUANA ORIGEN': 'bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 border-purple-300',
      'ADUANA DESTINO': 'bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 border-purple-300',
      'IDA 3': 'bg-gradient-to-r from-indigo-100 to-indigo-200 text-indigo-800 border-indigo-300',
      'DESPACHO': 'bg-gradient-to-r from-cyan-100 to-cyan-200 text-cyan-800 border-cyan-300',
      'CONFERENCIA': 'bg-gradient-to-r from-teal-100 to-teal-200 text-teal-800 border-teal-300',
      'CONFERIDO': 'bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-800 border-emerald-300',
      'STOCK ALGESA': 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border-blue-300',
      'PODER 3RO': 'bg-gradient-to-r from-pink-100 to-pink-200 text-pink-800 border-pink-300',
      'CREDITO': 'bg-gradient-to-r from-rose-100 to-rose-200 text-rose-800 border-rose-300',
      'PREPARACION': 'bg-gradient-to-r from-amber-100 to-amber-200 text-amber-800 border-amber-300',
      'ENVIADO P12': 'bg-gradient-to-r from-lime-100 to-lime-200 text-lime-800 border-lime-300',
      'FACTURADO': 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 border-green-300',
      'LOGISTICA ENTREGA': 'bg-gradient-to-r from-violet-100 to-violet-200 text-violet-800 border-violet-300',
      'ENTREGA TECNICA': 'bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-800 border-emerald-300',
      'SIN SOLICITUD DE PREPARACION': 'bg-gradient-to-r from-red-100 to-red-200 text-red-800 border-red-300',
      'PREPARACION SOLICITADO': 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border-yellow-300',
      'SOLICITUD DE PREPARACION RECIBIDA': 'bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800 border-orange-300',
      'PREPARACION CONCLUIDA': 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 border-green-300'
    };
    
    return statusColors[estado?.toUpperCase()] || 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border-gray-300';
  };

  if (!isOpen) return null;

  const Icon = statusGroup.icon;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col border border-gray-100">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 ${statusGroup.bgColor} rounded-xl flex items-center justify-center border`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{statusGroup.title}</h2>
              <p className="text-sm text-gray-500">
                {filteredItems.length} items encontrados
                {filteredItems.length !== groupItems.length && ` (${groupItems.length} total en el grupo)`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-6 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar en estos items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 text-lg font-medium">
                {searchTerm ? 'No se encontraron items con ese criterio' : 'No hay items en este estado'}
              </p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="mt-2 text-purple-600 hover:text-purple-800 text-sm"
                >
                  Limpiar búsqueda
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-all duration-200"
                >
                  {/* Header con tipo y acciones */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className={`inline-flex items-center px-3 py-1 text-sm font-semibold rounded-full border ${getTypeColor(item.type)}`}>
                        {getTypeIcon(item.type)}
                        <span className="ml-2">{item.type}</span>
                      </span>
                      <span className="font-bold text-lg text-gray-900">{item.codigo}</span>
                      <span className="text-gray-600 max-w-md truncate" title={item.descripcion}>
                        {item.descripcion}
                      </span>
                      {item.chassis && (
                        <span className="text-sm text-gray-500">
                          <span className="font-medium">Chasis:</span> {item.chassis}
                        </span>
                      )}
                      {item.cliente && (
                        <span className="text-sm text-gray-500">
                          <span className="font-medium">Cliente:</span> {item.cliente}
                        </span>
                      )}
                    </div>
                    {isAuthenticated && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => onEdit?.(item)}
                          className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id!, item.type)}
                          className={`p-2 transition-colors rounded-lg border ${
                            deleteConfirm === item.id 
                              ? 'text-red-800 bg-red-100 border-red-300' 
                              : 'text-red-600 hover:text-red-800 hover:bg-red-100 border-red-200'
                          }`}
                          title={deleteConfirm === item.id ? 'Confirmar eliminación' : 'Eliminar'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        {item.link && (
                          <button
                            onClick={() => onOpenLink?.(item.link!, item.descripcion)}
                            className="p-2 text-green-600 hover:text-green-800 hover:bg-green-100 rounded-lg transition-colors border border-green-200"
                            title="Ver enlace"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-100 bg-gray-50">
          <div className="text-sm text-gray-500">
            Mostrando {filteredItems.length} de {groupItems.length} items en {statusGroup.title}
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

export default StatusDetailModal;