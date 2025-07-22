import React, { useState, useMemo, useEffect } from 'react';
import { Settings, Download, Plus, Upload, Calendar, DollarSign, Calculator, ExternalLink, Lock, Shield, History } from 'lucide-react';
import { useMachines } from '../hooks/useMachines';
import { MachineFilterState, Machine } from '../types/machine';
import { calculateMachineStats, calculateDateRangeSummary } from '../utils/machineStatsCalculator';
import { parseMachineCSVData, initialMachineCSVData } from '../utils/machineCSVParser';
import { exportMachinesToExcel } from '../utils/machineExcelExporter';
import { calculateMachineNumericSummary } from '../utils/numericSummaryCalculator';
import DynamicMachineTable from './DynamicMachineTable';
import MachineFilterBar from './MachineFilterBar';
import { checkAllOverdueItems } from '../utils/overdueNotifications';
import DynamicMachineModal from './DynamicMachineModal';
import MachineStatsCards from './MachineStatsCards';
import LinkModal from './LinkModal';
import AuditLogModal from './AuditLogModal';
import MachineExcelExportModal from './MachineExcelExportModal';
import MachinePDFExportModal from './MachinePDFExportModal';
import ExportOptionsModal from './ExportOptionsModal';
import { useAuditLog } from '../hooks/useAuditLog';
import Swal from 'sweetalert2';

interface MachinesPageProps {
  isAuthenticated: boolean;
}

const MachinesPage: React.FC<MachinesPageProps> = ({ isAuthenticated }) => {
  const [showMachineModal, setShowMachineModal] = useState(false);
  const [editingMachine, setEditingMachine] = useState<Machine | null>(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [selectedLink, setSelectedLink] = useState({ url: '', title: '' });
  const [hasLoadedInitialData, setHasLoadedInitialData] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [showExcelExportModal, setShowExcelExportModal] = useState(false);
  const [showPDFExportModal, setShowPDFExportModal] = useState(false);
  const [showExportOptionsModal, setShowExportOptionsModal] = useState(false);
  const [hasShownOverdueNotification, setHasShownOverdueNotification] = useState(false);
  const [productsForOverdueCheck, setProductsForOverdueCheck] = useState<any[]>([]);
  
  const { machines, loading, error, addMachine, updateMachine, deleteMachine, importMachines } = useMachines();
  const { logMachineAction, logBulkAction, detectChanges } = useAuditLog();
  
  const [filters, setFilters] = useState<MachineFilterState>({
    searchTerm: '',
    estado: '',
    ubicacion: '',
    dateFilter: '',
    sortBy: '',
    sortOrder: 'asc'
  });

  // Load initial data if no machines exist
  useEffect(() => {
    const loadInitialData = async () => {
      if (!loading && machines.length === 0 && !hasLoadedInitialData) {
        try {
          console.log('Loading initial machine data...');
          const parsedMachines = parseMachineCSVData(initialMachineCSVData);
          await importMachines(parsedMachines);
          setHasLoadedInitialData(true);
          
          await Swal.fire({
            icon: 'success',
            title: '¡Datos iniciales cargados!',
            text: `Se cargaron ${parsedMachines.length} máquinas en el sistema`,
            timer: 3000,
            showConfirmButton: false,
            toast: true,
            position: 'top-end'
          });
        } catch (error) {
          console.error('Error loading initial data:', error);
        }
      }
    };

    loadInitialData();
  }, [loading, machines.length, hasLoadedInitialData, importMachines]);

  // Get products data for overdue check
  useEffect(() => {
    const fetchProductsForOverdue = async () => {
      try {
        // Import product service to get products data
        const { productService } = await import('../services/productService');
        const products = await productService.getAllProducts();
        setProductsForOverdueCheck(products);
      } catch (error) {
        console.error('Error fetching products for overdue check:', error);
        setProductsForOverdueCheck([]);
      }
    };
    
    fetchProductsForOverdue();
  }, []);

  // Show overdue notification when machines are loaded
  useEffect(() => {
    if (machines.length > 0 && productsForOverdueCheck.length >= 0 && !loading && !hasShownOverdueNotification) {
      setHasShownOverdueNotification(true);
      setTimeout(() => {
        checkAllOverdueItems(productsForOverdueCheck, machines);
      }, 1500);
    }
  }, [machines, productsForOverdueCheck, loading, hasShownOverdueNotification]);

  const availableStates = useMemo(() => {
    const states = [...new Set(machines.map(m => m.estado).filter(Boolean))];
    return states.sort();
  }, [machines]);

  const availableLocations = useMemo(() => {
    const locations = [...new Set(machines.map(m => m.ubicacion).filter(Boolean))];
    return locations.sort();
  }, [machines]);

  const stats = useMemo(() => {
    return calculateMachineStats(machines);
  }, [machines]);

  const dateRangeSummary = useMemo(() => {
    return calculateDateRangeSummary(machines, filters.dateFilter);
  }, [machines, filters.dateFilter]);

  const filteredMachines = useMemo(() => {
    return machines.filter(machine => {
      const matchesSearch = !filters.searchTerm || 
        Object.values(machine).some(value => 
          value?.toString().toLowerCase().includes(filters.searchTerm.toLowerCase())
        );
      
      const matchesEstado = !filters.estado || 
        machine.estado === filters.estado;
      
      const matchesUbicacion = !filters.ubicacion || 
        machine.ubicacion === filters.ubicacion;

      return matchesSearch && matchesEstado && matchesUbicacion;
    });
  }, [machines, filters]);

  const numericSummary = useMemo(() => {
    // Only show numeric summary when there are active filters
    const hasActiveFilters = filters.searchTerm || filters.estado || filters.ubicacion || filters.dateFilter;
    if (!hasActiveFilters) {
      return null;
    }
    
    return calculateMachineNumericSummary(machines, filteredMachines);
  }, [machines, filteredMachines, filters]);

  const handleAddMachine = () => {
    setEditingMachine(null);
    setShowMachineModal(true);
  };

  const handleEditMachine = (machine: Machine) => {
    setEditingMachine(machine);
    setShowMachineModal(true);
  };

  const handleSaveMachine = async (machineData: Omit<Machine, 'id'>) => {
    try {
      if (editingMachine) {
        const changes = detectChanges(editingMachine, machineData);
        console.log('Detected changes for machine update:', changes);
        await updateMachine(editingMachine.id!, machineData);
        await logMachineAction('UPDATE', `Máquina actualizada: ${machineData.codigo}`, editingMachine.id, machineData.codigo, changes);
        await Swal.fire({
          icon: 'success',
          title: '¡Máquina actualizada!',
          text: 'Los cambios se han guardado correctamente',
          timer: 2000,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
      } else {
        console.log('Creating new machine:', machineData);
        await addMachine(machineData);
        await logMachineAction('CREATE', `Nueva máquina creada: ${machineData.codigo}`, undefined, machineData.codigo);
        await Swal.fire({
          icon: 'success',
          title: '¡Máquina agregada!',
          text: 'La nueva máquina se ha registrado correctamente',
          timer: 2000,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
      }
      setShowMachineModal(false);
      setEditingMachine(null);
    } catch (error: any) {
      await Swal.fire({
        icon: 'error',
        title: 'Error al guardar',
        text: error.message || 'No se pudo guardar la máquina',
        confirmButtonColor: '#dc2626'
      });
    }
  };

  const handleDeleteMachine = async (id: string) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
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
        const machine = machines.find(m => m.id === id);
        console.log('Deleting machine:', machine);
        await deleteMachine(id);
        if (machine) {
          await logMachineAction('DELETE', `Máquina eliminada: ${machine.codigo}`, id, machine.codigo);
        }
        await Swal.fire({
          icon: 'success',
          title: '¡Máquina eliminada!',
          text: 'La máquina se ha eliminado correctamente',
          timer: 2000,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
      } catch (error) {
        await Swal.fire({
          icon: 'error',
          title: 'Error al eliminar',
          text: 'No se pudo eliminar la máquina',
          confirmButtonColor: '#dc2626'
        });
      }
    }
  };

  const handleImportCSV = async () => {
    const { value: file } = await Swal.fire({
      title: 'Importar Máquinas desde CSV',
      input: 'file',
      inputAttributes: {
        accept: '.csv',
        'aria-label': 'Seleccionar archivo CSV'
      },
      showCancelButton: true,
      confirmButtonText: 'Importar',
      cancelButtonText: 'Cancelar'
    });

    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const csvText = e.target?.result as string;
          const parsedMachines = parseMachineCSVData(csvText);
          
          if (parsedMachines.length === 0) {
            await Swal.fire({
              icon: 'warning',
              title: 'Archivo vacío',
              text: 'No se encontraron máquinas válidas en el archivo CSV'
            });
            return;
          }

          await importMachines(parsedMachines);
          console.log('Imported machines:', parsedMachines.length);
          await logBulkAction('MACHINE', 'BULK_IMPORT', `Importadas ${parsedMachines.length} máquinas desde CSV`);
          await Swal.fire({
            icon: 'success',
            title: '¡Importación exitosa!',
            text: `Se importaron ${parsedMachines.length} máquinas correctamente`,
            timer: 3000,
            showConfirmButton: false,
            toast: true,
            position: 'top-end'
          });
        } catch (error) {
          await Swal.fire({
            icon: 'error',
            title: 'Error en la importación',
            text: 'No se pudo procesar el archivo CSV',
            confirmButtonColor: '#dc2626'
          });
        }
      };
      reader.readAsText(file);
    }
  };

  const handleOpenLink = (url: string, title: string) => {
    if (!url) {
      Swal.fire({
        icon: 'warning',
        title: 'Sin enlace',
        text: 'No hay un enlace configurado para este registro',
        timer: 2000,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
      return;
    }

    const formattedUrl = url.startsWith('http') ? url : `https://${url}`;
    setSelectedLink({ url: formattedUrl, title });
    setShowLinkModal(true);
  };

  const handleExportToExcel = async () => {
    try {
      setShowExportOptionsModal(true);
    } catch (error) {
      console.error('Error opening export modal:', error);
    }
  };

  if (loading && machines.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-white to-cyan-50 flex items-center justify-center">
        <div className="text-center bg-white/20 backdrop-blur-lg p-8 rounded-2xl shadow-xl border border-white/30">
          <Settings className="w-12 h-12 text-cyan-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-700 text-lg font-medium">Cargando máquinas...</p>
          <p className="text-gray-400 text-sm mt-2">Preparando el sistema</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-white to-cyan-50 flex items-center justify-center">
        <div className="text-center bg-white/20 backdrop-blur-lg p-8 rounded-2xl shadow-xl border border-white/30">
          <div className="w-16 h-16 bg-red-100/50 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
            <Settings className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Error de Conexión</h3>
          <p className="text-red-600 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
          >
            Reintentar Conexión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-white to-cyan-50">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-lg shadow-lg border-b border-white/20 sticky top-0 z-30 sm:static">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center shadow-lg border border-white/30 flex-shrink-0">
                <Settings className="w-4 h-4 sm:w-6 sm:h-6 text-cyan-600" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-base sm:text-xl font-semibold text-gray-800 truncate">
                  Gestión de Máquinas
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 truncate">
                  {machines.length} máquinas registradas
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-1 sm:space-x-3 flex-shrink-0">
              <button
                onClick={handleExportToExcel}
                className="inline-flex items-center px-2 sm:px-4 py-2 bg-green-500/80 backdrop-blur-sm text-white rounded-lg hover:bg-green-600/80 transition-all space-x-1 sm:space-x-2 text-xs sm:text-sm font-medium shadow-lg border border-green-400/30"
              >
                <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Exportar</span>
              </button>
              
              <button
                onClick={() => setShowAuditModal(true)}
                className="inline-flex items-center px-2 sm:px-4 py-2 bg-white/20 backdrop-blur-sm text-purple-600 rounded-lg hover:bg-white/30 transition-all space-x-1 sm:space-x-2 text-xs sm:text-sm font-medium shadow-lg border border-white/30"
              >
                <History className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Historial</span>
              </button>
              
              <button
                onClick={handleImportCSV}
                className="inline-flex items-center px-2 sm:px-4 py-2 bg-white/20 backdrop-blur-sm text-purple-600 rounded-lg hover:bg-white/30 transition-all space-x-1 sm:space-x-2 text-xs sm:text-sm font-medium shadow-lg border border-white/30"
              >
                <Upload className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Importar CSV</span>
              </button>
              
              <button
                onClick={handleAddMachine}
                className="inline-flex items-center px-2 sm:px-4 py-2 bg-white/20 backdrop-blur-sm text-blue-600 rounded-lg hover:bg-white/30 transition-all space-x-1 sm:space-x-2 text-xs sm:text-sm font-medium shadow-lg border border-white/30"
              >
                <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Agregar</span>
              </button>
              
              <div className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 bg-white/20 backdrop-blur-sm text-gray-700 rounded-lg shadow-lg border border-white/30">
                <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-cyan-600" />
                <span className="text-xs sm:text-sm font-semibold hidden sm:inline">Admin</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-3 sm:py-6">
        <MachineStatsCards stats={stats} />
        
        <MachineFilterBar
          filters={filters}
          onFiltersChange={setFilters}
          availableStates={availableStates}
          availableLocations={availableLocations}
          numericSummary={numericSummary}
        />

        {/* Date Range Summary */}
        {dateRangeSummary && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-6 shadow-[inset_2px_2px_6px_rgba(0,0,0,0.1),inset_-2px_-2px_6px_rgba(255,255,255,0.7)]">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center mr-3 shadow-[2px_2px_4px_rgba(0,0,0,0.1),-2px_-2px_4px_rgba(255,255,255,0.7)]">
                <Calculator className="w-4 h-4 text-gray-600" />
              </div>
              <h3 className="text-base font-medium text-gray-900">Resumen del Período Seleccionado</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg shadow-[inset_1px_1px_3px_rgba(0,0,0,0.1),inset_-1px_-1px_3px_rgba(255,255,255,0.7)]">
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Total Amount USD</span>
                </div>
                <p className="text-xl font-bold text-gray-900 mt-1">
                  ${dateRangeSummary.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg shadow-[inset_1px_1px_3px_rgba(0,0,0,0.1),inset_-1px_-1px_3px_rgba(255,255,255,0.7)]">
                <div className="flex items-center space-x-2">
                  <Calculator className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Total NC</span>
                </div>
                <p className="text-xl font-bold text-gray-900 mt-1">
                  ${dateRangeSummary.totalNC.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg shadow-[inset_1px_1px_3px_rgba(0,0,0,0.1),inset_-1px_-1px_3px_rgba(255,255,255,0.7)]">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Registros</span>
                </div>
                <p className="text-xl font-bold text-gray-900 mt-1">
                  {dateRangeSummary.count}
                </p>
              </div>
            </div>
          </div>
        )}
        
        <DynamicMachineTable
          machines={machines}
          onEdit={handleEditMachine}
          onDelete={handleDeleteMachine}
          onOpenLink={handleOpenLink}
          isAuthenticated={isAuthenticated}
          filters={filters}
          onFiltersChange={setFilters}
        />
      </main>

      {/* Modals */}
      <DynamicMachineModal
        isOpen={showMachineModal}
        onClose={() => {
          setShowMachineModal(false);
          setEditingMachine(null);
        }}
        onSave={handleSaveMachine}
        machine={editingMachine}
        title={editingMachine ? 'Editar Máquina' : 'Agregar Máquina'}
      />

      <LinkModal
        isOpen={showLinkModal}
        onClose={() => setShowLinkModal(false)}
        url={selectedLink.url}
        title={selectedLink.title}
      />

      <AuditLogModal
        isOpen={showAuditModal}
        onClose={() => setShowAuditModal(false)}
      />

      <MachineExcelExportModal
        isOpen={showExcelExportModal}
        onClose={() => setShowExcelExportModal(false)}
        machines={machines}
        filteredMachines={filteredMachines}
      />

      <MachinePDFExportModal
        isOpen={showPDFExportModal}
        onClose={() => setShowPDFExportModal(false)}
        machines={machines}
        filteredMachines={filteredMachines}
      />

      <ExportOptionsModal
        isOpen={showExportOptionsModal}
        onClose={() => setShowExportOptionsModal(false)}
        onSelectExcel={() => {
          setShowExportOptionsModal(false);
          setTimeout(() => setShowExcelExportModal(true), 100);
        }}
        onSelectPDF={() => {
          setShowExportOptionsModal(false);
          setTimeout(() => setShowPDFExportModal(true), 100);
        }}
        title="Selecciona el formato para exportar máquinas"
      />
    </div>
  );
};

export default MachinesPage;