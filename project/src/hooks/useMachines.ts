import { useState, useEffect } from 'react';
import { Machine } from '../types/machine';
import { machineService } from '../services/machineService';

export const useMachines = () => {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRemovalResult, setAutoRemovalResult] = useState<{ removed: number; kept: number } | null>(null);

  const fetchMachines = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // First, auto-remove duplicates if any exist
      const removalResult = await machineService.autoRemoveDuplicatesOnStartup();
      if (removalResult) {
        setAutoRemovalResult(removalResult);
        console.log(`Auto-removed ${removalResult.removed} machine duplicates, kept ${removalResult.kept} machines`);
      }
      
      // Then fetch the clean machine list
      const fetchedMachines = await machineService.getAllMachines();
      setMachines(fetchedMachines);
    } catch (err) {
      setError('Error al cargar máquinas');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addMachine = async (machine: Omit<Machine, 'id'>) => {
    try {
      await machineService.addMachine(machine);
      await fetchMachines(); // Refresh list
    } catch (err: any) {
      setError(err.message || 'Error al agregar máquina');
      throw err;
    }
  };

  const updateMachine = async (id: string, updates: Partial<Machine>) => {
    try {
      await machineService.updateMachine(id, updates);
      await fetchMachines(); // Refresh list
    } catch (err) {
      setError('Error al actualizar máquina');
      throw err;
    }
  };

  const deleteMachine = async (id: string) => {
    try {
      await machineService.deleteMachine(id);
      await fetchMachines(); // Refresh list
    } catch (err) {
      setError('Error al eliminar máquina');
      throw err;
    }
  };

  const importMachines = async (machines: Omit<Machine, 'id'>[]) => {
    try {
      setLoading(true);
      await machineService.bulkImportMachines(machines);
      await fetchMachines(); // Refresh list
    } catch (err) {
      setError('Error al importar máquinas');
      throw err;
    }
  };

  const clearAllMachines = async () => {
    try {
      setLoading(true);
      await machineService.clearAllMachines();
      await fetchMachines(); // Refresh list
    } catch (err) {
      setError('Error al limpiar máquinas');
      throw err;
    }
  };

  const removeDuplicates = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await machineService.removeDuplicateMachines();
      await fetchMachines(); // Refresh list
      return result;
    } catch (err) {
      setError('Error al eliminar duplicados');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMachines();
  }, []);

  return {
    machines,
    loading,
    error,
    autoRemovalResult,
    addMachine,
    updateMachine,
    deleteMachine,
    importMachines,
    clearAllMachines,
    removeDuplicates,
    refetch: fetchMachines
  };
};