import React, { useState, useEffect, useMemo } from 'react';
import { Truck, Download, Plus, Shield, Lock, Upload, RefreshCw, BarChart3, Package2, Trash, AlertTriangle, CheckCircle, History } from 'lucide-react';
import { useProducts } from './hooks/useProducts';
import { FilterState } from './types/product';
import { exportToExcel } from './utils/excelExporter';
import { parseCSVData, initialCSVData } from './utils/csvParser';
import { calculateProductStats } from './utils/statsCalculator';
import { getOverdueProducts, formatOverdueMessage } from './utils/dateUtils';
import { calculateProductNumericSummary } from './utils/numericSummaryCalculator';
import DynamicProductTable from './components/DynamicProductTable';
import FilterBar from './components/FilterBar';
import { checkAllOverdueItems } from './utils/overdueNotifications';
import AuthModal from './components/AuthModal';
import DynamicProductModal from './components/DynamicProductModal';
import StatsCards from './components/StatsCards';
import Navigation from './components/Navigation';
import MachinesPage from './components/MachinesPage';
import DateTimeDisplay from './components/DateTimeDisplay';
import UnifiedInventoryPage from './components/UnifiedInventoryPage';
import LinkModal from './components/LinkModal';
import AuditLogModal from './components/AuditLogModal';
import ExcelExportModal from './components/ExcelExportModal';
import PDFExportModal from './components/PDFExportModal';
import ExportOptionsModal from './components/ExportOptionsModal';
import { useAuditLog } from './hooks/useAuditLog';
import Swal from 'sweetalert2';

function App() {
  const [currentPage, setCurrentPage] = useState<'unified'>('unified');
  const [isAuthenticated, setIsAuthenticated] = useState(true); // Siempre autenticado
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [removingDuplicates, setRemovingDuplicates] = useState(false);
  const [hasShownOverdueNotification, setHasShownOverdueNotification] = useState(false);
  const [hasShownAutoRemovalNotification, setHasShownAutoRemovalNotification] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [machinesForOverdueCheck, setMachinesForOverdueCheck] = useState<any[]>([]);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [selectedLink, setSelectedLink] = useState({ url: '', title: '' });
  const [showExcelExportModal, setShowExcelExportModal] = useState(false);
  const [showPDFExportModal, setShowPDFExportModal] = useState(false);
  const [showExportOptionsModal, setShowExportOptionsModal] = useState(false);
  
  const { products, loading, error, autoRemovalResult, addProduct, updateProduct, deleteProduct, importProducts, removeDuplicates } = useProducts();
  const { logProductAction, logBulkAction, detectChanges } = useAuditLog();
  
  // Get machines data for overdue check
  useEffect(() => {
    const fetchMachinesForOverdue = async () => {
      try {
        // Import machine service to get machines data
        const { machineService } = await import('./services/machineService');
        const machines = await machineService.getAllMachines();
        setMachinesForOverdueCheck(machines);
      } catch (error) {
        console.error('Error fetching machines for overdue check:', error);
        setMachinesForOverdueCheck([]);
      }
    };
    
    fetchMachinesForOverdue();
  }, []);
  
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: '',
    disponibilidad: '',
    sucursal: '',
    lugar: '',
    sortBy: '',
    sortOrder: 'asc'
  });

  // Check for potential duplicates
  const duplicateCount = useMemo(() => {
    const codeGroups = new Map<string, number>();
    products.forEach(product => {
      const count = codeGroups.get(product.codigo) || 0;
      codeGroups.set(product.codigo, count + 1);
    });
    
    let duplicates = 0;
    codeGroups.forEach(count => {
      if (count > 1) {
        duplicates += count - 1;
      }
    });
    
    return duplicates;
  }, [products]);

  const availableStates = useMemo(() => {
    const states = [...new Set(products.map(p => p.disponibilidad).filter(Boolean))];
    return states.sort();
  }, [products]);

  const availableBranches = useMemo(() => {
    const branches = [...new Set(products.map(p => p.sucursal).filter(Boolean))];
    return branches.sort();
  }, [products]);

  const availablePlaces = useMemo(() => {
    const places = [...new Set(products.map(p => p.lugar).filter(Boolean))];
    return places.sort();
  }, [products]);

  const stats = useMemo(() => {
    return calculateProductStats(products);
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = !filters.searchTerm || 
        Object.values(product).some(value => 
          value?.toString().toLowerCase().includes(filters.searchTerm.toLowerCase())
        );
      
      const matchesDisponibilidad = !filters.disponibilidad || 
        product.disponibilidad === filters.disponibilidad;
      
      const matchesSucursal = !filters.sucursal || 
        product.sucursal === filters.sucursal;

      const matchesLugar = !filters.lugar || 
        product.lugar === filters.lugar;

      const matchesLlegada = !filters.llegada || 
        (filters.llegada === 'fecha' ? 
          (product.llegada?.includes('-') && product.llegada?.includes('.')) :
          product.llegada?.includes(filters.llegada));

      return matchesSearch && matchesDisponibilidad && matchesSucursal && matchesLugar && matchesLlegada;
    });
  }, [products, filters]);

  const numericSummary = useMemo(() => {
    // Only show numeric summary when there are active filters
    const hasActiveFilters = filters.searchTerm || filters.disponibilidad || filters.sucursal || filters.lugar || filters.llegada;
    if (!hasActiveFilters) {
      return null;
    }
    
    return calculateProductNumericSummary(products, filteredProducts);
  }, [products, filteredProducts, filters]);

  // Show auto-removal notification if duplicates were removed
  useEffect(() => {
    if (autoRemovalResult && !hasShownAutoRemovalNotification && !loading && currentPage === 'implements') {
      setHasShownAutoRemovalNotification(true);
      
      setTimeout(async () => {
        await Swal.fire({
          icon: 'success',
          title: '🧹 Limpieza Automática Completada',
          html: `
            <div class="text-center">
              <p class="mb-4 text-gray-700">Se eliminaron automáticamente los implementos duplicados:</p>
              <div class="grid grid-cols-2 gap-4 max-w-xs mx-auto">
                <div class="bg-red-50 p-3 rounded-lg border border-red-200">
                  <div class="text-2xl font-bold text-red-600">${autoRemovalResult.removed}</div>
                  <div class="text-sm text-red-700">Eliminados</div>
                </div>
                <div class="bg-green-50 p-3 rounded-lg border border-green-200">
                  <div class="text-2xl font-bold text-green-600">${autoRemovalResult.kept}</div>
                  <div class="text-sm text-green-700">Conservados</div>
                </div>
              </div>
              <p class="mt-4 text-sm text-gray-600">La base de datos ahora está limpia y optimizada.</p>
            </div>
          `,
          confirmButtonText: 'Perfecto',
          confirmButtonColor: '#059669',
          timer: 5000,
          timerProgressBar: true
        });
      }, 1500);
    }
  }, [autoRemovalResult, hasShownAutoRemovalNotification, loading, currentPage]);

  // Check for overdue products when products are loaded (for all users)
  const checkOverdueProducts = async () => {
    const overdueProducts = getOverdueProducts(products);
    
    if (overdueProducts.length > 0) {
      const message = formatOverdueMessage(overdueProducts);
      
      await Swal.fire({
        icon: 'warning',
        title: '⚠️ Fechas Vencidas Detectadas',
        html: message,
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#dc2626',
        width: '600px',
        customClass: {
          popup: 'text-left'
        }
      });
    }
  };

  // Show overdue notification when products are loaded (for all users)
  useEffect(() => {
    if (products.length > 0 && machinesForOverdueCheck.length >= 0 && !loading && !hasShownOverdueNotification && hasShownAutoRemovalNotification && currentPage === 'implements') {
      setHasShownOverdueNotification(true);
      setTimeout(() => {
        checkAllOverdueItems(products, machinesForOverdueCheck);
      }, 2000);
    }
  }, [products, machinesForOverdueCheck, loading, hasShownOverdueNotification, hasShownAutoRemovalNotification, currentPage]);

  const handleExportToExcel = async () => {
    try {
      setShowExportOptionsModal(true);
    } catch (error) {
      console.error('Error opening export modal:', error);
    }
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setShowProductModal(true);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setShowProductModal(true);
  };

  const handleSaveProduct = async (productData) => {
    try {
      if (editingProduct) {
        const changes = detectChanges(editingProduct, productData);
        console.log('Detected changes for product update:', changes);
        await updateProduct(editingProduct.id, productData);
        await logProductAction('UPDATE', `Implemento actualizado: ${productData.codigo}`, editingProduct.id, productData.codigo, changes);
        await Swal.fire({
          icon: 'success',
          title: '¡Implemento actualizado!',
          text: 'Los cambios se han guardado correctamente',
          timer: 2000,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
      } else {
        console.log('Creating new product:', productData);
        await addProduct(productData);
        await logProductAction('CREATE', `Nuevo implemento creado: ${productData.codigo}`, undefined, productData.codigo);
        await Swal.fire({
          icon: 'success',
          title: '¡Implemento agregado!',
          text: 'El nuevo implemento se ha registrado correctamente',
          timer: 2000,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
      }
      setShowProductModal(false);
      setEditingProduct(null);
    } catch (error) {
      await Swal.fire({
        icon: 'error',
        title: 'Error al guardar',
        text: error.message || 'No se pudo guardar el implemento',
        confirmButtonColor: '#dc2626'
      });
    }
  };

  const handleDeleteProduct = async (id: string) => {
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
        const product = products.find(p => p.id === id);
        console.log('Deleting product:', product);
        await deleteProduct(id);
        if (product) {
          await logProductAction('DELETE', `Implemento eliminado: ${product.codigo}`, id, product.codigo);
        }
        await Swal.fire({
          icon: 'success',
          title: '¡Implemento eliminado!',
          text: 'El implemento se ha eliminado correctamente',
          timer: 2000,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
      } catch (error) {
        await Swal.fire({
          icon: 'error',
          title: 'Error al eliminar',
          text: 'No se pudo eliminar el implemento',
          confirmButtonColor: '#dc2626'
        });
      }
    }
  };

  const handleRemoveDuplicates = async () => {
    if (removingDuplicates) return;
    
    const result = await Swal.fire({
      title: '¿Eliminar implementos duplicados?',
      text: `Se encontraron ${duplicateCount} implementos duplicados. Esta acción conservará los implementos con información más completa.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, eliminar duplicados',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        setRemovingDuplicates(true);
        
        Swal.fire({
          title: 'Eliminando duplicados...',
          text: 'Por favor espere mientras procesamos los implementos',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });
        
        const duplicateResult = await removeDuplicates();
        console.log('Removed duplicates result:', duplicateResult);
        await logBulkAction('PRODUCT', 'REMOVE_DUPLICATES', `Eliminados ${duplicateResult.removed} implementos duplicados, conservados ${duplicateResult.kept}`);
        
        await Swal.fire({
          icon: 'success',
          title: '¡Duplicados eliminados!',
          html: `
            <div class="text-center">
              <p class="mb-4">Proceso completado exitosamente:</p>
              <div class="grid grid-cols-2 gap-4 max-w-xs mx-auto">
                <div class="bg-red-50 p-3 rounded-lg border border-red-200">
                  <div class="text-2xl font-bold text-red-600">${duplicateResult.removed}</div>
                  <div class="text-sm text-red-700">Eliminados</div>
                </div>
                <div class="bg-green-50 p-3 rounded-lg border border-green-200">
                  <div class="text-2xl font-bold text-green-600">${duplicateResult.kept}</div>
                  <div class="text-sm text-green-700">Conservados</div>
                </div>
              </div>
            </div>
          `,
          confirmButtonColor: '#059669'
        });
      } catch (error) {
        console.error('Error removing duplicates:', error);
        await Swal.fire({
          icon: 'error',
          title: 'Error al eliminar duplicados',
          text: 'Ocurrió un error durante el proceso. Intente nuevamente.',
          confirmButtonColor: '#dc2626'
        });
      } finally {
        setRemovingDuplicates(false);
      }
    }
  };

  const handleOpenLink = (url: string, title: string) => {
    if (!url) {
      Swal.fire({
        icon: 'warning',
        title: 'Sin enlace',
        text: 'No hay un enlace configurado para este producto',
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

  const filteredProductsCount = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = !filters.searchTerm || 
        Object.values(product).some(value => 
          value?.toString().toLowerCase().includes(filters.searchTerm.toLowerCase())
        );
      
      const matchesDisponibilidad = !filters.disponibilidad || 
        product.disponibilidad === filters.disponibilidad;
      
      const matchesSucursal = !filters.sucursal || 
        product.sucursal === filters.sucursal;

      const matchesLugar = !filters.lugar || 
        product.lugar === filters.lugar;

      const matchesLlegada = !filters.llegada || 
        (filters.llegada === 'fecha' ? 
          (product.llegada?.includes('-') && product.llegada?.includes('.')) :
          product.llegada?.includes(filters.llegada));

      return matchesSearch && matchesDisponibilidad && matchesSucursal && matchesLugar && matchesLlegada;
    }).length;
  }, [products, filters]);

  // Solo mostrar el inventario unificado
  return (
    <div className="min-h-screen bg-gray-50">
      <DateTimeDisplay />
      <Navigation currentPage={currentPage} onPageChange={setCurrentPage} />
      <UnifiedInventoryPage isAuthenticated={isAuthenticated} />
    </div>
  );
}

export default App;