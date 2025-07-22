import { useState, useEffect } from 'react';
import { InventoryItem, InventoryStats } from '../types/inventory';
import { unifiedInventoryService } from '../services/unifiedInventoryService';

export const useUnifiedInventory = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRemovalResult, setAutoRemovalResult] = useState<{ removed: number; kept: number } | null>(null);

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // First, auto-remove duplicates if any exist
      const removalResult = await unifiedInventoryService.autoRemoveDuplicatesOnStartup();
      if (removalResult) {
        setAutoRemovalResult(removalResult);
        console.log(`Auto-removed ${removalResult.removed} unified inventory duplicates, kept ${removalResult.kept} items`);
      }
      
      // Then fetch the clean item list
      const fetchedItems = await unifiedInventoryService.getAllItems();
      setItems(fetchedItems);
    } catch (err: any) {
      setError(err.message || 'Error al cargar inventario');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addItem = async (item: Omit<InventoryItem, 'id'>) => {
    try {
      await unifiedInventoryService.addItem(item);
      await fetchItems(); // Refresh list
    } catch (err: any) {
      setError(err.message || 'Error al agregar item');
      throw err;
    }
  };

  const updateItem = async (id: string, updates: Partial<InventoryItem>) => {
    try {
      await unifiedInventoryService.updateItem(id, updates);
      await fetchItems(); // Refresh list
    } catch (err: any) {
      setError(err.message || 'Error al actualizar item');
      throw err;
    }
  };

  const deleteItem = async (id: string) => {
    try {
      await unifiedInventoryService.deleteItem(id);
      await fetchItems(); // Refresh list
    } catch (err: any) {
      setError(err.message || 'Error al eliminar item');
      throw err;
    }
  };

  const importItems = async (items: Omit<InventoryItem, 'id'>[]) => {
    try {
      setLoading(true);
      await unifiedInventoryService.bulkImportItems(items);
      await fetchItems(); // Refresh list
    } catch (err: any) {
      setError(err.message || 'Error al importar items');
      throw err;
    }
  };

  const clearAllItems = async () => {
    try {
      setLoading(true);
      await unifiedInventoryService.clearAllItems();
      await fetchItems(); // Refresh list
    } catch (err: any) {
      setError(err.message || 'Error al limpiar inventario');
      throw err;
    }
  };

  const removeDuplicates = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await unifiedInventoryService.removeDuplicateItems();
      await fetchItems(); // Refresh list
      return result;
    } catch (err: any) {
      setError(err.message || 'Error al eliminar duplicados');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (): InventoryStats => {
    const stats: InventoryStats = {
      total: items.length,
      implementos: 0,
      maquinas: 0,
      totalCR: 0,
      byProveedor: {},
      byEstado: {},
      byLugar: {},
      byCliente: {},
      pendingProduction: 0,
      pendingShipment: 0,
      pendingDelivery: 0,
      recentlyUpdated: 0
    };

    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    items.forEach(item => {
      // Count by type
      if (item.type === 'IMPLEMENTO') {
        stats.implementos++;
      } else {
        stats.maquinas++;
      }

      // Sum CR values
      if (item.cr) {
        stats.totalCR += item.cr;
      }

      // Count by proveedor
      if (item.proveedor) {
        stats.byProveedor[item.proveedor] = (stats.byProveedor[item.proveedor] || 0) + 1;
      }

      // Count by estado
      if (item.estado) {
        stats.byEstado[item.estado] = (stats.byEstado[item.estado] || 0) + 1;
      }

      // Count by lugar
      if (item.lugar) {
        stats.byLugar[item.lugar] = (stats.byLugar[item.lugar] || 0) + 1;
      }

      // Count by cliente
      if (item.cliente) {
        stats.byCliente[item.cliente] = (stats.byCliente[item.cliente] || 0) + 1;
      }

      // Count pending items by dates
      const today = new Date().toISOString().split('T')[0];
      
      if (item.fechaProduccion && item.fechaProduccion <= today && !item.fechaEmbarque) {
        stats.pendingProduction++;
      }
      
      if (item.fechaEmbarque && item.fechaEmbarque <= today && !item.fechaLlegada) {
        stats.pendingShipment++;
      }
      
      if (item.fechaLlegada && item.fechaLlegada <= today && !item.fechaEntrega) {
        stats.pendingDelivery++;
      }

      // Count recently updated
      if (item.updatedAt && new Date(item.updatedAt) > oneWeekAgo) {
        stats.recentlyUpdated++;
      }
    });

    return stats;
  };

  useEffect(() => {
    fetchItems();
  }, []);

  return {
    items,
    loading,
    error,
    autoRemovalResult,
    stats: calculateStats(),
    addItem,
    updateItem,
    deleteItem,
    importItems,
    clearAllItems,
    removeDuplicates,
    refetch: fetchItems
  };
};