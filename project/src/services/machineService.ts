import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy,
  where 
} from 'firebase/firestore';
import { db } from './firebase';
import { Machine } from '../types/machine';

const COLLECTION_NAME = 'machines'; // Colección simple para máquinas

export const machineService = {
  async getAllMachines(): Promise<Machine[]> {
    try {
      const q = query(collection(db, COLLECTION_NAME), orderBy('codigo'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Machine[];
    } catch (error) {
      console.error('Error fetching machines:', error);
      throw error;
    }
  },

  async addMachine(machine: Omit<Machine, 'id'>): Promise<string> {
    try {
      // Check if machine with same codigo already exists
      const existingQuery = query(
        collection(db, COLLECTION_NAME), 
        where('codigo', '==', machine.codigo)
      );
      const existingDocs = await getDocs(existingQuery);
      
      if (!existingDocs.empty) {
        throw new Error(`Ya existe una máquina con el código ${machine.codigo}`);
      }

      const machineWithTimestamp = {
        ...machine,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const docRef = await addDoc(collection(db, COLLECTION_NAME), machineWithTimestamp);
      return docRef.id;
    } catch (error) {
      console.error('Error adding machine:', error);
      throw error;
    }
  },

  async updateMachine(id: string, updates: Partial<Machine>): Promise<void> {
    try {
      const machineRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(machineRef, {
        ...updates,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating machine:', error);
      throw error;
    }
  },

  async deleteMachine(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
    } catch (error) {
      console.error('Error deleting machine:', error);
      throw error;
    }
  },

  async bulkImportMachines(machines: Omit<Machine, 'id'>[]): Promise<void> {
    try {
      console.log(`Starting bulk import of ${machines.length} machines to ${COLLECTION_NAME}...`);
      
      // Get existing machines to avoid duplicates
      const existingMachines = await this.getAllMachines();
      const existingCodes = new Set(existingMachines.map(m => m.codigo));
      
      // Filter out machines that already exist
      const newMachines = machines.filter(machine => !existingCodes.has(machine.codigo));
      
      if (newMachines.length === 0) {
        console.log('No new machines to import - all machines already exist');
        return;
      }

      console.log(`Importing ${newMachines.length} new machines out of ${machines.length} total`);
      
      // Import machines one by one to handle errors better
      let successCount = 0;
      let errorCount = 0;
      
      for (const machine of newMachines) {
        try {
          await this.addMachine(machine);
          successCount++;
        } catch (error) {
          console.error(`Error importing machine ${machine.codigo}:`, error);
          errorCount++;
        }
      }
      
      console.log(`Import completed: ${successCount} successful, ${errorCount} errors`);
      
      if (errorCount > 0) {
        throw new Error(`Import completed with ${errorCount} errors out of ${newMachines.length} machines`);
      }
    } catch (error) {
      console.error('Error bulk importing machines:', error);
      throw error;
    }
  },

  async clearAllMachines(): Promise<void> {
    try {
      const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
      const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      console.log('All machines cleared from database');
    } catch (error) {
      console.error('Error clearing machines:', error);
      throw error;
    }
  },

  async removeDuplicateMachines(): Promise<{ removed: number; kept: number }> {
    try {
      console.log('Starting automatic duplicate removal process for machines...');
      
      // Get all machines
      const allMachines = await this.getAllMachines();
      console.log(`Found ${allMachines.length} total machines`);
      
      // Group machines by codigo
      const machineGroups = new Map<string, Machine[]>();
      
      allMachines.forEach(machine => {
        const codigo = machine.codigo;
        if (!machineGroups.has(codigo)) {
          machineGroups.set(codigo, []);
        }
        machineGroups.get(codigo)!.push(machine);
      });
      
      let duplicatesRemoved = 0;
      let machinesKept = 0;
      
      // Process each group
      for (const [codigo, machines] of machineGroups) {
        if (machines.length > 1) {
          console.log(`Found ${machines.length} duplicates for codigo: ${codigo}`);
          
          // Sort by creation date (keep the oldest one, or the one with most data)
          const sortedMachines = machines.sort((a, b) => {
            // Prefer machines with more complete data
            const aScore = this.getMachineCompleteness(a);
            const bScore = this.getMachineCompleteness(b);
            
            if (aScore !== bScore) {
              return bScore - aScore; // Higher score first
            }
            
            // If completeness is equal, prefer older machines
            const aDate = a.createdAt ? new Date(a.createdAt) : new Date(0);
            const bDate = b.createdAt ? new Date(b.createdAt) : new Date(0);
            return aDate.getTime() - bDate.getTime();
          });
          
          // Keep the first one (best machine), delete the rest
          const machineToKeep = sortedMachines[0];
          const machinesToDelete = sortedMachines.slice(1);
          
          console.log(`Keeping machine with ID: ${machineToKeep.id}, deleting ${machinesToDelete.length} duplicates`);
          
          // Delete duplicates
          for (const machine of machinesToDelete) {
            await this.deleteMachine(machine.id!);
            duplicatesRemoved++;
          }
          
          machinesKept++;
        } else {
          // No duplicates for this codigo
          machinesKept++;
        }
      }
      
      console.log(`Duplicate removal completed. Removed: ${duplicatesRemoved}, Kept: ${machinesKept}`);
      
      return {
        removed: duplicatesRemoved,
        kept: machinesKept
      };
    } catch (error) {
      console.error('Error removing duplicates:', error);
      throw error;
    }
  },

  // Helper function to score machine completeness
  getMachineCompleteness(machine: Machine): number {
    let score = 0;
    
    // Essential fields
    if (machine.codigo?.trim()) score += 10;
    if (machine.descripcion?.trim()) score += 5;
    if (machine.estado?.trim()) score += 3;
    if (machine.ubicacion?.trim()) score += 3;
    if (machine.cuadroTfDe?.trim()) score += 3;
    
    // Optional but valuable fields
    if (machine.orderNr?.trim()) score += 2;
    if (machine.chasis?.trim()) score += 2;
    if (machine.po?.trim()) score += 2;
    if (machine.model?.trim()) score += 2;
    if (machine.plant?.trim()) score += 2;
    if (machine.totalAmountUSD && machine.totalAmountUSD > 0) score += 3;
    if (machine.link?.trim()) score += 1;
    
    return score;
  },

  // Auto-remove duplicates on startup
  async autoRemoveDuplicatesOnStartup(): Promise<{ removed: number; kept: number } | null> {
    try {
      const allMachines = await this.getAllMachines();
      
      // Check if there are duplicates
      const codeGroups = new Map<string, number>();
      allMachines.forEach(machine => {
        const count = codeGroups.get(machine.codigo) || 0;
        codeGroups.set(machine.codigo, count + 1);
      });
      
      let duplicateCount = 0;
      codeGroups.forEach(count => {
        if (count > 1) {
          duplicateCount += count - 1;
        }
      });
      
      if (duplicateCount > 0) {
        console.log(`Auto-removing ${duplicateCount} machine duplicates on startup...`);
        return await this.removeDuplicateMachines();
      }
      
      return null;
    } catch (error) {
      console.error('Error in auto-remove machine duplicates:', error);
      return null;
    }
  },

  // Check if collection is empty and needs initial data
  async needsInitialData(): Promise<boolean> {
    try {
      const machines = await this.getAllMachines();
      return machines.length === 0;
    } catch (error) {
      console.error('Error checking if machines collection needs initial data:', error);
      return true; // Assume it needs data if we can't check
    }
  }
};