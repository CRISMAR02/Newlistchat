import React, { useState } from 'react';
import { Package, Settings, TrendingUp, MapPin, DollarSign, Layers, Clock, BarChart3, Users, Truck, AlertTriangle, CheckCircle, Factory, Ship, Plane, FileText, CreditCard, Wrench, Archive, Building, UserCheck, Search, X, Eye } from 'lucide-react';
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

    await Swal.fire({
      title: `📦 ${item.type}: ${item.codigo}`,
      html: `
        <div class="text-left space-y-4">
          <div class="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 class="font-semibold text-blue-900 mb-2">Estado Actual</h4>
            <div class="flex items-center space-x-2">
              <span class="inline-flex items-center px-3 py-1 text-sm font-semibold rounded-full bg-green-100 text-green-800 border border-green-300">
                ${item.estado}
              </span>
              <span class="text-sm text-blue-700">${item.type}</span>
            </div>
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <div>
              <h5 class="font-medium text-gray-800 mb-2">Información Básica</h5>
              <div class="space-y-1 text-sm">
                <div><strong>Código:</strong> ${item.codigo}</div>
                <div><strong>Descripción:</strong> ${item.descripcion || 'N/A'}</div>
                <div><strong>Proveedor:</strong> ${item.proveedor || 'N/A'}</div>
                <div><strong>Cliente:</strong> ${item.cliente || 'N/A'}</div>
              </div>
            </div>
            
            <div>
              <h5 class="font-medium text-gray-800 mb-2">Documentos</h5>
              <div class="space-y-1 text-sm">
                <div><strong>Proforma:</strong> ${item.proforma || 'N/A'}</div>
                <div><strong>P.O:</strong> ${item.po || 'N/A'}</div>
                <div><strong>Factura:</strong> ${item.factura || 'N/A'}</div>
                <div><strong>Order Nr:</strong> ${item.orderNr || 'N/A'}</div>
              </div>
            </div>
          </div>
          
          <div>
            <h5 class="font-medium text-gray-800 mb-2">Fechas del Proceso</h5>
            <div class="grid grid-cols-2 gap-2 text-sm">
              <div><strong>F. Producción:</strong> ${formatDate(item.fechaProduccion)}</div>
              <div><strong>F. Embarque:</strong> ${formatDate(item.fechaEmbarque)}</div>
              <div><strong>F. Llegada:</strong> ${formatDate(item.fechaLlegada)}</div>
              <div><strong>F. Entrega:</strong> ${formatDate(item.fechaEntrega)}</div>
            </div>
          </div>
          
          ${item.cr ? `
            <div class="bg-green-50 p-3 rounded-lg border border-green-200">
              <div class="text-center">
                <div class="text-2xl font-bold text-green-800">${item.cr.toLocaleString()}</div>
                <div class="text-sm text-green-600">CR (Variable)</div>
              </div>
            </div>
          ` : ''}
          
          ${item.lugar ? `
            <div class="text-center">
              <span class="inline-flex items-center px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded-full">
                📍 ${item.lugar}
              </span>
            </div>
          ` : ''}
        </div>
      `,
      width: '600px',
      confirmButtonText: 'Cerrar',
      confirmButtonColor: '#059669',
      customClass: {
        popup: 'text-left'
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
          'PREPARACIÓN'
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
      'FACTURACION',
      'FACTURACIÓN',
      'EMBARQUE LIBRE',
      'TRANSITO',
      'TRÁNSITO',
      'ADUANA ORIGEN',
      'ADUANA DESTINO',
      'IDA 3',
      'IDA3',
      'DESPACHO',
      'CONFERENCIA',
      'CONFERIDO',
      'STOCK ALGESA',
      'STOCK',
      'PODER 3RO',
      'PODER DE 3RO',
      'CREDITO',
      'CRÉDITO',
      'PREPARACION',
      'PREPARACIÓN',
      'EN PREPARACION',
      'ENVIADO P12',
      'FACTURADO',
      'LOGISTICA ENTREGA',
      'ENTREGA TECNICA',
      'ENTREGA TÉCNICA',
      'TRAMITE WEB',
      'SIN CREDITO SIN STOCK M',
      'SIN CREDITO / SIN STOCK M',
      'SIN CREDITO SIN SOLICITUD DE PREPARO M',
      'SIN CREDITO / SIN SOLICITUD DE PREPARO M',
      'SIN CREDITO EN PREPARACION',
      'SIN CREDITO / EN PREPARACION',
      'SIN STOCK M',
      'SIN SOLICITUD DE PREPARO M',
      'PROGRAMACION DE ENTREGA',
      'PROCESAMIENTO ESPECIAL',
      'CARNEADO'
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
      <div className="bg-black/20 dark:bg-gray-900/40 backdrop-blur-xl p-6 rounded-2xl border border-white/10 dark:border-gray-700/20">
        <div className="flex items-center mb-4">
          <Search className="w-5 h-5 text-blue-400 dark:text-blue-300 mr-3" />
          <h3 className="text-lg font-semibold text-white dark:text-gray-200">Buscador de Productos</h3>
        </div>
        
        <div className="relative">
          <div className="flex items-center space-x-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por código, proforma, P.O, factura, chassis, descripción..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-10 py-3 bg-black/30 dark:bg-gray-800/50 backdrop-blur-sm border border-white/20 dark:border-gray-600/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500"
              />
              {searchTerm && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-300 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
            
            {searchResults.length > 0 && (
              <div className="text-sm text-gray-300 dark:text-gray-400">
                {searchResults.length} resultado{searchResults.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>
          
          {/* Resultados de búsqueda */}
          {showSearchResults && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 max-h-96 overflow-y-auto">
              {searchResults.length === 0 ? (
                <div className="p-6 text-center">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 dark:text-gray-400 font-medium">No se encontraron productos</p>
                  <p className="text-gray-500 dark:text-gray-500 text-sm mt-1">
                    Intenta con otro término de búsqueda
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {searchResults.slice(0, 10).map((item, index) => (
                    <div 
                      key={item.id || index}
                      className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                      onClick={() => showItemDetails(item)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                              item.type === 'IMPLEMENTO' 
                                ? 'bg-blue-100 text-blue-800 border border-blue-300' 
                                : 'bg-green-100 text-green-800 border border-green-300'
                            }`}>
                              {item.type === 'IMPLEMENTO' ? <Package className="w-3 h-3 mr-1" /> : <Settings className="w-3 h-3 mr-1" />}
                              {item.type}
                            </span>
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {item.codigo}
                            </span>
                          </div>
                          
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                            {item.descripcion}
                          </p>
                          
                          <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-500">
                            <span><strong>Estado:</strong> {item.estado}</span>
                            {item.proveedor && <span><strong>Proveedor:</strong> {item.proveedor}</span>}
                            {item.cliente && <span><strong>Cliente:</strong> {item.cliente}</span>}
                          </div>
                        </div>
                        
                        <div className="ml-4">
                          <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full border ${
                            item.estado === 'STOCK' || item.estado === 'STOCK ALGESA' || item.estado === 'CONFERIDO' 
                              ? 'bg-green-100 text-green-800 border-green-300'
                              : item.estado === 'TRANSITO' || item.estado === 'EMBARQUE LIBRE'
                              ? 'bg-blue-100 text-blue-800 border-blue-300'
                              : item.estado === 'PEDIDO'
                              ? 'bg-gray-100 text-gray-800 border-gray-300'
                              : 'bg-yellow-100 text-yellow-800 border-yellow-300'
                          }`}>
                            {item.estado}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {searchResults.length > 10 && (
                    <div className="p-3 text-center text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800">
                      ... y {searchResults.length - 10} resultados más
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="mt-4 text-xs text-gray-400 dark:text-gray-500">
          💡 Puedes buscar por código, proforma, P.O, factura, chassis, descripción, cliente o proveedor
        </div>
      </div>

      {/* Sección de todos los estados */}
      <div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">Todos los Estados del Sistema</h3>
        <div className="bg-black/10 dark:bg-gray-900/30 backdrop-blur-xl rounded-2xl p-6 border border-white/10 dark:border-gray-700/20">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {getAllUniqueStates().map(([state, count]) => {
              // Determinar a qué categoría pertenece este estado
              let category = 'Sin categoría';
              let categoryColor = 'bg-gray-500/10 border-gray-500/20 text-gray-400';
              
              getGroupedStats().forEach(group => {
                if (group.states.includes(state)) {
                  category = group.title;
                  const colorIndex = getGroupedStats().findIndex(g => g.key === group.key);
                  const colors = [
                    'bg-gray-500/10 border-gray-500/20 text-gray-300',
                    'bg-blue-500/10 border-blue-500/20 text-blue-300',
                    'bg-green-500/10 border-green-500/20 text-green-300',
                    'bg-yellow-500/10 border-yellow-500/20 text-yellow-300',
                    'bg-purple-500/10 border-purple-500/20 text-purple-300'
                  ];
                  categoryColor = colors[colorIndex] || colors[0];
                }
              });
              
              return (
                <div 
                  key={state}
                  className={`${categoryColor} backdrop-blur-sm rounded-xl p-4 border transition-all duration-200 hover:scale-105 cursor-pointer`}
                  onClick={() => {
                    // Buscar automáticamente productos con este estado
                    handleSearch('');
                    const itemsWithState = items.filter(item => item.estado === state);
                    if (itemsWithState.length > 0) {
                      setSearchResults(itemsWithState);
                      setShowSearchResults(true);
                      setSearchTerm(`Estado: ${state}`);
                    }
                  }}
                >
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white mb-1">
                      {count}
                    </div>
                    <div className="text-sm font-medium text-gray-200 dark:text-gray-300 mb-2">
                      {state}
                    </div>
                    <div className="text-xs text-gray-400 dark:text-gray-500">
                      {category}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {getAllUniqueStates().length === 0 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-500/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Archive className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-400 dark:text-gray-500 text-lg font-medium">No hay estados con datos</p>
              <p className="text-gray-500 dark:text-gray-600 text-sm mt-1">Agrega algunos items al inventario para ver los estados</p>
            </div>
          )}
        </div>
      </div>

      {/* Estadísticas adicionales */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        {cards.slice(-3).map((card, index) => {
          const Icon = card.icon;
          const colors = ['bg-emerald-500/10 dark:bg-emerald-600/20 border-emerald-500/20 dark:border-emerald-600/30', 'bg-indigo-500/10 dark:bg-indigo-600/20 border-indigo-500/20 dark:border-indigo-600/30', 'bg-orange-500/10 dark:bg-orange-600/20 border-orange-500/20 dark:border-orange-600/30'];
          const iconColors = ['text-emerald-400 dark:text-emerald-300', 'text-indigo-400 dark:text-indigo-300', 'text-orange-400 dark:text-orange-300'];
          
          return (
            <div 
              key={`additional-${index}`}
              className={`group relative ${colors[index]} backdrop-blur-xl rounded-2xl p-4 sm:p-6 transition-all duration-300 border hover:scale-105`}
            >
              <div className="text-center">
                <div className={`w-12 h-12 ${colors[index]} rounded-xl flex items-center justify-center mx-auto mb-3 border`}>
                  <Icon className={`w-6 h-6 ${iconColors[index]}`} />
                </div>
                <p className="text-2xl font-bold text-white mb-2">
                  {card.value}
                </p>
                <p className="text-sm text-gray-300 dark:text-gray-400 font-medium">
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