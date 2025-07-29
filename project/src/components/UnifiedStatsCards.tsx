import React, { useState } from 'react';
import { Package, Settings, Users, Search, X, Eye, Layers, CheckCircle, Truck, BarChart3 } from 'lucide-react';
import { InventoryStats } from '../types/inventory';
import Swal from 'sweetalert2';

interface StatusGroup {
  title: string;
  color: string;
  bgColor: string;
  textColor: string;
  icon: React.ComponentType<any>;
  states: string[];
  total: number;
  key: string;
}

interface UnifiedStatsCardsProps {
  stats: InventoryStats;
  items?: any[]; // Agregar items para la búsqueda
  onStatusGroupClick?: (group: StatusGroup) => void;
}

const UnifiedStatsCards: React.FC<UnifiedStatsCardsProps> = ({ stats, items = [], onStatusGroupClick }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Función para buscar productos por código o cualquier identificador
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    
    if (!term.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    // Buscar en todos los campos del item
    const results = items.filter(item => {
      const searchLower = term.toLowerCase();
      return (
        item.codigo?.toLowerCase().includes(searchLower) ||
        item.proforma?.toLowerCase().includes(searchLower) ||
        item.po?.toLowerCase().includes(searchLower) ||
        item.factura?.toLowerCase().includes(searchLower) ||
        item.orderNr?.toLowerCase().includes(searchLower) ||
        item.chassis?.toLowerCase().includes(searchLower) ||
        item.descripcion?.toLowerCase().includes(searchLower) ||
        item.cliente?.toLowerCase().includes(searchLower) ||
        item.proveedor?.toLowerCase().includes(searchLower)
      );
    });

    setSearchResults(results);
    setShowSearchResults(true);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setSearchResults([]);
    setShowSearchResults(false);
  };

  const showItemDetails = async (item: any) => {
    const formatDate = (dateStr: string) => {
      if (!dateStr) return 'No definida';
      try {
        return new Date(dateStr).toLocaleDateString('es-ES');
      } catch {
        return dateStr;
      }
    };

    const formatValue = (value: any) => {
      if (value === null || value === undefined || value === '') return 'N/A';
      if (typeof value === 'boolean') return value ? 'Sí' : 'No';
      if (typeof value === 'number') return value.toLocaleString();
      return value.toString();
    };

    // Organizar todos los campos del item
    const basicFields = [
      { key: 'type', label: 'Tipo', value: item.type },
      { key: 'codigo', label: 'Código', value: item.codigo },
      { key: 'descripcion', label: 'Descripción', value: item.descripcion },
      { key: 'proveedor', label: 'Proveedor', value: item.proveedor },
      { key: 'cliente', label: 'Cliente', value: item.cliente },
      { key: 'lugar', label: 'Lugar', value: item.lugar },
      { key: 'chassis', label: 'Chassis', value: item.chassis },
      { key: 'orderNr', label: 'Order Nr', value: item.orderNr }
    ];

    const documentFields = [
      { key: 'proforma', label: 'Proforma', value: item.proforma },
      { key: 'po', label: 'P.O', value: item.po },
      { key: 'factura', label: 'Factura', value: item.factura },
      { key: 'id_negociacion', label: 'ID Negociación', value: item.id_negociacion },
      { key: 'es_emergencia', label: 'Es Emergencia', value: item.es_emergencia }
    ];

    const dateFields = [
      { key: 'fecha_produccion', label: 'F. Producción', value: item.fecha_produccion },
      { key: 'fecha_facturacion', label: 'F. Facturación', value: item.fecha_facturacion },
      { key: 'fecha_embarque', label: 'F. Embarque', value: item.fecha_embarque },
      { key: 'fechaEmbarque', label: 'F. Embarque', value: item.fechaEmbarque },
      { key: 'fecha_llegada', label: 'F. Llegada', value: item.fecha_llegada },
      { key: 'fechaLlegada', label: 'F. Llegada', value: item.fechaLlegada },
      { key: 'fecha_entrega_prevista', label: 'F. Entrega Prevista', value: item.fecha_entrega_prevista },
      { key: 'fecha_entrega_concluida', label: 'F. Entrega Concluida', value: item.fecha_entrega_concluida },
      { key: 'fecha_carneo', label: 'F. Carneo', value: item.fecha_carneo },
      { key: 'fecha_reposicion', label: 'F. Reposición', value: item.fecha_reposicion },
      { key: 'fecha_inicio_preparacion', label: 'F. Inicio Preparación', value: item.fecha_inicio_preparacion },
      { key: 'fecha_fin_preparacion', label: 'F. Fin Preparación', value: item.fecha_fin_preparacion },
      { key: 'entrega_tecnica_programada', label: 'Entrega Técnica Programada', value: item.entrega_tecnica_programada },
      { key: 'entrega_tecnica_concluida', label: 'Entrega Técnica Concluida', value: item.entrega_tecnica_concluida }
    ].filter(field => field.value); // Solo mostrar fechas que tienen valor

    const postVentaFields = [
      { key: 'pieza_carneada', label: 'Pieza Carneada', value: item.pieza_carneada },
      { key: 'cliente_destino', label: 'Cliente Destino', value: item.cliente_destino },
      { key: 'chasis_destino', label: 'Chasis Destino', value: item.chasis_destino },
      { key: 'motivo', label: 'Motivo', value: item.motivo },
      { key: 'destino_llegada', label: 'Destino Llegada', value: item.destino_llegada }
    ].filter(field => field.value); // Solo mostrar campos que tienen valor

    // Campos dinámicos (cualquier otro campo que no esté en las categorías anteriores)
    const knownFields = new Set([
      'id', 'createdAt', 'updatedAt', 'type', 'codigo', 'descripcion', 'proveedor', 'cliente', 
      'lugar', 'chassis', 'orderNr', 'proforma', 'po', 'factura', 'id_negociacion', 'es_emergencia',
      'fecha_produccion', 'fecha_facturacion', 'fecha_embarque', 'fechaEmbarque', 'fecha_llegada', 
      'fechaLlegada', 'fecha_entrega_prevista', 'fecha_entrega_concluida', 'fecha_carneo', 
      'fecha_reposicion', 'fecha_inicio_preparacion', 'fecha_fin_preparacion', 'entrega_tecnica_programada',
      'entrega_tecnica_concluida', 'pieza_carneada', 'cliente_destino', 'chasis_destino', 'motivo',
      'destino_llegada', 'estado', 'cr', 'link'
    ]);

    const dynamicFields = Object.keys(item)
      .filter(key => !knownFields.has(key) && item[key] !== null && item[key] !== undefined && item[key] !== '')
      .map(key => ({
        key,
        label: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
        value: item[key]
      }));
    await Swal.fire({
      title: `📦 ${item.type}: ${item.codigo}`,
      html: `
        <div class="text-left space-y-6 max-h-96 overflow-y-auto">
          <div class="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 class="font-semibold text-blue-900 mb-2">Estado Actual</h4>
            <div class="flex items-center space-x-2">
              <span class="inline-flex items-center px-3 py-1 text-sm font-semibold rounded-full bg-green-100 text-green-800 border border-green-300">
                ${item.estado}
              </span>
              <span class="text-sm text-blue-700">${item.type}</span>
              ${item.cr ? `<span class="text-sm bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">CR: ${item.cr.toLocaleString()}</span>` : ''}
            </div>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h5 class="font-medium text-gray-800 mb-2">Información Básica</h5>
              <div class="space-y-2 text-sm">
                ${basicFields.map(field => `
                  <div class="flex justify-between">
                    <span class="text-gray-600">${field.label}:</span>
                    <span class="font-medium text-gray-900">${formatValue(field.value)}</span>
                  </div>
                `).join('')}
              </div>
            </div>
            
            <div>
              <h5 class="font-medium text-gray-800 mb-2">Documentos</h5>
              <div class="space-y-2 text-sm">
                ${documentFields.map(field => `
                  <div class="flex justify-between">
                    <span class="text-gray-600">${field.label}:</span>
                    <span class="font-medium text-gray-900">${formatValue(field.value)}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
          
          ${dateFields.length > 0 ? `
            <div>
              <h5 class="font-medium text-gray-800 mb-3">📅 Fechas del Proceso</h5>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                ${dateFields.map(field => `
                  <div class="bg-gray-50 p-2 rounded-lg">
                    <div class="text-gray-600 text-xs">${field.label}</div>
                    <div class="font-medium text-gray-900">${formatDate(field.value)}</div>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
          
          ${postVentaFields.length > 0 ? `
            <div>
              <h5 class="font-medium text-gray-800 mb-3">🔧 Post Venta</h5>
              <div class="space-y-3 text-sm">
                ${postVentaFields.map(field => `
                  <div class="bg-purple-50 p-3 rounded-lg border border-purple-200">
                    <div class="text-purple-600 text-xs font-medium">${field.label}</div>
                    <div class="text-purple-900 mt-1">${formatValue(field.value)}</div>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
          
          ${dynamicFields.length > 0 ? `
            <div>
              <h5 class="font-medium text-gray-800 mb-3">📋 Información Adicional</h5>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                ${dynamicFields.map(field => `
                  <div class="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <div class="text-gray-600 text-xs font-medium">${field.label}</div>
                    <div class="text-gray-900 mt-1 font-medium">${formatValue(field.value)}</div>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
          
          ${item.link ? `
            <div class="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
              <h5 class="font-medium text-indigo-900 mb-2">🔗 Enlace</h5>
              <a href="${item.link}" target="_blank" class="text-indigo-600 hover:text-indigo-800 underline break-all">
                ${item.link}
              </a>
            </div>
          ` : ''}
          
          <div class="bg-gray-100 p-3 rounded-lg text-xs text-gray-600">
            <div class="grid grid-cols-2 gap-2">
              ${item.createdAt ? `<div><strong>Creado:</strong> ${new Date(item.createdAt).toLocaleString('es-ES')}</div>` : ''}
              ${item.updatedAt ? `<div><strong>Actualizado:</strong> ${new Date(item.updatedAt).toLocaleString('es-ES')}</div>` : ''}
            </div>
          </div>
        </div>
      `,
      width: '800px',
      confirmButtonText: 'Cerrar',
      confirmButtonColor: '#059669',
      customClass: {
        popup: 'text-left',
        htmlContainer: 'max-h-96 overflow-y-auto'
      }
    });
  };

  // Agrupar estados según la clasificación actualizada con TODOS los estados
  const getGroupedStats = () => {
    const groups = {
      pendienteFab: {
        title: 'Pendiente en Fab',
        color: 'from-gray-500 to-gray-600',
        bgColor: 'from-gray-50 to-gray-100',
        textColor: 'text-gray-700',
        icon: Factory,
        states: ['PEDIDO', 'APROBACION DE FACTURACION']
      },
      porLlegar: {
        title: '🔵 Por llegar',
        color: 'from-blue-500 to-blue-600',
        bgColor: 'from-blue-50 to-blue-100',
        textColor: 'text-blue-700',
        icon: Ship,
        states: [
          'FACTURACION', 
          'FACTURACIÓN', 
          'EMBARQUE LIBRE', 
          'TRANSITO', 
          'ADUANA ORIGEN', 
          'ADUANA DESTINO', 
          'IDA 3', 
          'IDA3', 
          'DESPACHO'
        ]
      },
      enStock: {
        title: '🟢 En stock',
        color: 'from-green-500 to-green-600',
        bgColor: 'from-green-50 to-green-100',
        textColor: 'text-green-700',
        icon: CheckCircle,
        states: [
          'CONFERENCIA', 
          'CONFERIDO', 
          'STOCK ALGESA', 
          'STOCK', 
          'PODER 3RO', 
          'PODER DE 3RO', 
          'PROCESAMIENTO ESPECIAL', 
          'CARNEADO'
        ]
      },
      procesos: {
        title: '🟡 Procesos / Oportunidades',
        color: 'from-yellow-500 to-yellow-600',
        bgColor: 'from-yellow-50 to-yellow-100',
        textColor: 'text-yellow-700',
        icon: Wrench,
        states: [
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
          'SIN SOLICITUD DE PREPARACION',
          'PREPARACION SOLICITADO',
          'SOLICITUD DE PREPARACION RECIBIDA',
          'PREPARACION CONCLUIDA'
        ]
      },
      paraEntrega: {
        title: '🟣 Para entrega',
        color: 'from-purple-500 to-purple-600',
        bgColor: 'from-purple-50 to-purple-100',
        textColor: 'text-purple-700',
        icon: Truck,
        states: [
          'PROGRAMACION DE ENTREGA', 
          'ENTREGA TECNICA',
          'ENTREGA TÉCNICA',
          'CREDITO',
          'CRÉDITO',
          'ENVIADO P12',
          'LOGISTICA ENTREGA',
          'FACTURADO'
        ]
      }
    };

    // Calcular totales por grupo
    const groupTotals = Object.entries(groups).map(([key, group]) => {
      const total = group.states.reduce((sum, state) => {
        return sum + (stats.byEstado[state] || 0);
      }, 0);
      
      return {
        ...group,
        total,
        key
      };
    });

    return groupTotals;
  };

  // Obtener todos los estados únicos que existen en los datos
  const getAllStatesWithCounts = () => {
    return Object.entries(stats.byEstado)
      .filter(([state, count]) => count > 0)
      .sort(([a], [b]) => a.localeCompare(b));
  };

  const allStates = getAllStatesWithCounts();

  const cards = [
    {
      title: 'Total Items',
      value: stats.total.toString(),
      icon: Layers,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'from-purple-50 to-purple-100',
      textColor: 'text-purple-700'
    },
    {
      title: 'Implementos',
      value: stats.implementos.toString(),
      icon: Package,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'from-blue-50 to-blue-100',
      textColor: 'text-blue-700'
    },
    {
      title: 'Máquinas',
      value: stats.maquinas.toString(),
      icon: Settings,
      color: 'from-green-500 to-green-600',
      bgColor: 'from-green-50 to-green-100',
      textColor: 'text-green-700'
    },
    {
      title: 'Total CR',
      value: stats.totalCR.toLocaleString(),
      icon: BarChart3,
      color: 'from-emerald-500 to-emerald-600',
      bgColor: 'from-emerald-50 to-emerald-100',
      textColor: 'text-emerald-700'
    },
    {
      title: 'Proveedores',
      value: Object.keys(stats.byProveedor).length.toString(),
      icon: Users,
      color: 'from-indigo-500 to-indigo-600',
      bgColor: 'from-indigo-50 to-indigo-100',
      textColor: 'text-indigo-700'
    },
    {
      title: 'Clientes',
      value: Object.keys(stats.byCliente).length.toString(),
      icon: Users,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'from-orange-50 to-orange-100',
      textColor: 'text-orange-700'
    }
  ];

  // Obtener TODOS los estados únicos que existen en los datos, incluyendo variaciones
  const getAllUniqueStates = () => {
    const allUniqueStates = new Set<string>();
    
    // Agregar estados que tienen datos
    Object.keys(stats.byEstado).forEach(state => {
      if (stats.byEstado[state] > 0) {
        allUniqueStates.add(state);
      }
    });
    
    // Agregar estados adicionales que podrían existir en los items pero no en stats
    items.forEach(item => {
      if (item.estado && item.estado.trim()) {
        allUniqueStates.add(item.estado.trim());
      }
    });
    
    // Agregar estados conocidos del sistema que podrían no tener datos aún
    const knownStates = [
      'PEDIDO',
      'APROBACION DE FACTURACION',
      'FACTURACIÓN',
      'EMBARQUE LIBRE',
      'TRANSITO',
      'ADUANA ORIGEN',
      'ADUANA DESTINO',
      'IDA 3',
      'DESPACHO',
      'CONFERENCIA',
      'CONFERIDO',
      'STOCK ALGESA',
      'STOCK',
      'PODER 3RO',
      'CREDITO',
      'PREPARACION',
      'ENVIADO P12',
      'FACTURADO',
      'LOGISTICA ENTREGA',
      'ENTREGA TECNICA',
      'TRAMITE WEB',
      'SIN CREDITO SIN STOCK M',
      'SIN CREDITO SIN SOLICITUD DE PREPARO M',
      'SIN CREDITO EN PREPARACION',
      'SIN STOCK M',
      'SIN SOLICITUD DE PREPARO M',
      'PROGRAMACION DE ENTREGA',
      'PROCESAMIENTO ESPECIAL',
      'CARNEADO',
      'SIN SOLICITUD DE PREPARACION',
      'PREPARACION SOLICITADO',
      'SOLICITUD DE PREPARACION RECIBIDA',
      'PREPARACION CONCLUIDA'
    ];
    
    knownStates.forEach(state => allUniqueStates.add(state));
    
    // Convertir a array y ordenar
    return Array.from(allUniqueStates)
      .sort()
      .map(state => [state, stats.byEstado[state] || 0] as [string, number]);
  };

  return (
    <div className="space-y-6 mb-6 sm:mb-8">
      {/* Buscador de Productos */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center mb-4">
          <Search className="w-6 h-6 text-gray-600 mr-3" />
          <h3 className="text-xl font-bold text-gray-900">Buscador de Productos</h3>
        </div>
        
        <div className="relative">
          <div className="flex items-center space-x-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-4 h-6 w-6 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por código, proforma, P.O, factura, chassis, descripción..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-12 pr-12 py-4 bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 text-gray-900 placeholder-gray-500 text-lg"
              />
              {searchTerm && (
                <button
                  onClick={clearSearch}
                  className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              )}
            </div>
            
            {searchResults.length > 0 && (
              <div className="text-base text-gray-700 font-semibold">
                {searchResults.length} resultado{searchResults.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>
          
          {/* Resultados de búsqueda */}
          {showSearchResults && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border-2 border-gray-300 z-50 max-h-96 overflow-y-auto">
              {searchResults.length === 0 ? (
                <div className="p-6 text-center">
                  <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-700 font-semibold text-lg">No se encontraron productos</p>
                  <p className="text-gray-500 text-base mt-2">
                    Intenta con otro término de búsqueda
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {searchResults.slice(0, 10).map((item, index) => (
                    <div 
                      key={item.id || index}
                      className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => showItemDetails(item)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4 mb-3">
                            <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                              item.type === 'IMPLEMENTO' 
                                ? 'bg-gray-100 text-gray-800 border border-gray-300' 
                                : 'bg-gray-200 text-gray-900 border border-gray-400'
                            }`}>
                              {item.type === 'IMPLEMENTO' ? <Package className="w-4 h-4 mr-1" /> : <Settings className="w-4 h-4 mr-1" />}
                              {item.type}
                            </span>
                            <span className="font-bold text-gray-900 text-lg">
                              {item.codigo}
                            </span>
                          </div>
                          
                          <p className="text-base text-gray-700 mb-3 line-clamp-2">
                            {item.descripcion}
                          </p>
                          
                          <div className="flex items-center space-x-6 text-sm text-gray-600">
                            <span><strong>Estado:</strong> {item.estado}</span>
                            {item.proveedor && <span><strong>Proveedor:</strong> {item.proveedor}</span>}
                            {item.cliente && <span><strong>Cliente:</strong> {item.cliente}</span>}
                          </div>
                        </div>
                        
                        <div className="ml-4">
                          <span className="inline-flex items-center px-4 py-2 text-sm font-semibold rounded-lg border bg-gray-100 text-gray-800 border-gray-300">
                            {item.estado}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {searchResults.length > 10 && (
                    <div className="p-4 text-center text-base text-gray-600 bg-gray-50">
                      ... y {searchResults.length - 10} resultados más
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="mt-4 text-sm text-gray-600">
          💡 Puedes buscar por código, proforma, P.O, factura, chassis, descripción, cliente o proveedor
        </div>
      </div>


      {/* Estadísticas adicionales */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        {cards.slice(-3).map((card, index) => {
          const Icon = card.icon;
          
          return (
            <div 
              key={`additional-${index}`}
              className="group relative bg-white rounded-lg p-4 sm:p-6 transition-all duration-300 border-2 border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md"
            >
              <div className="text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3 border border-gray-200">
                  <Icon className="w-6 h-6 text-gray-600" />
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  {card.value}
                </p>
                <p className="text-sm sm:text-base text-gray-700 font-semibold">
                  {card.title}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default UnifiedStatsCards;