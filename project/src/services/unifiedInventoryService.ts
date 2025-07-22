import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy,
  where,
  getDoc
} from 'firebase/firestore';
import { db } from './firebase';
import { InventoryItem } from '../types/inventory';

const COLLECTION_NAME = 'unified_inventory'; // Nueva colección independiente

export const unifiedInventoryService = {
  async getAllItems(): Promise<InventoryItem[]> {
    try {
      const q = query(collection(db, COLLECTION_NAME), orderBy('codigo'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as InventoryItem[];
    } catch (error) {
      console.error('Error fetching unified inventory items:', error);
      throw error;
    }
  },

  async addItem(item: Omit<InventoryItem, 'id'>): Promise<string> {
    try {
      // Check if item with same codigo already exists
      const existingQuery = query(
        collection(db, COLLECTION_NAME), 
        where('codigo', '==', item.codigo)
      );
      const existingDocs = await getDocs(existingQuery);
      
      if (!existingDocs.empty) {
        // Si existe, actualizar con los nuevos campos
        const existingDoc = existingDocs.docs[0];
        const existingData = existingDoc.data();
        
        // Combinar datos existentes con nuevos campos
        const mergedData = {
          ...existingData,
          ...item,
          updatedAt: new Date()
        };
        
        await updateDoc(existingDoc.ref, mergedData);
        console.log(`Item ${item.codigo} actualizado con nuevos campos`);
        return existingDoc.id;
      }

      const itemWithTimestamp = {
        ...item,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const docRef = await addDoc(collection(db, COLLECTION_NAME), itemWithTimestamp);
      return docRef.id;
    } catch (error) {
      console.error('Error adding unified inventory item:', error);
      throw error;
    }
  },

  async updateItem(id: string, updates: Partial<InventoryItem>): Promise<void> {
    try {
      const itemRef = doc(db, COLLECTION_NAME, id);
      
      // Obtener datos actuales para preservar campos dinámicos
      const currentDoc = await getDoc(itemRef);
      if (currentDoc.exists()) {
        const currentData = currentDoc.data();
        
        // Combinar datos actuales con actualizaciones
        const mergedUpdates = {
          ...currentData,
          ...updates,
          updatedAt: new Date()
        };
        
        await updateDoc(itemRef, mergedUpdates);
      } else {
        await updateDoc(itemRef, {
          ...updates,
          updatedAt: new Date()
        });
      }
    } catch (error) {
      console.error('Error updating unified inventory item:', error);
      throw error;
    }
  },

  async deleteItem(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
    } catch (error) {
      console.error('Error deleting unified inventory item:', error);
      throw error;
    }
  },

  async bulkImportItems(items: Omit<InventoryItem, 'id'>[]): Promise<void> {
    try {
      console.log(`Starting bulk import of ${items.length} items to ${COLLECTION_NAME}...`);
      
      // Get existing items to avoid duplicates
      const existingItems = await this.getAllItems();
      const existingCodes = new Set(existingItems.map(item => item.codigo));
      
      // Filter out items that already exist
      const newItems = items.filter(item => !existingCodes.has(item.codigo));
      
      if (newItems.length === 0) {
        console.log('No new items to import - all items already exist');
        return;
      }

      console.log(`Importing ${newItems.length} new items out of ${items.length} total`);
      
      // Import items one by one to handle errors better
      let successCount = 0;
      let errorCount = 0;
      
      for (const item of newItems) {
        try {
          await this.addItem(item);
          successCount++;
        } catch (error) {
          console.error(`Error importing item ${item.codigo}:`, error);
          errorCount++;
        }
      }
      
      console.log(`Import completed: ${successCount} successful, ${errorCount} errors`);
      
      if (errorCount > 0) {
        throw new Error(`Import completed with ${errorCount} errors out of ${newItems.length} items`);
      }
    } catch (error) {
      console.error('Error bulk importing unified inventory items:', error);
      throw error;
    }
  },

  async clearAllItems(): Promise<void> {
    try {
      const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
      const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      console.log('All unified inventory items cleared from database');
    } catch (error) {
      console.error('Error clearing unified inventory items:', error);
      throw error;
    }
  },

  async removeDuplicateItems(): Promise<{ removed: number; kept: number }> {
    try {
      console.log('Starting automatic duplicate removal process for unified inventory...');
      
      // Get all items
      const allItems = await this.getAllItems();
      console.log(`Found ${allItems.length} total items`);
      
      // Group items by codigo
      const itemGroups = new Map<string, InventoryItem[]>();
      
      allItems.forEach(item => {
        const codigo = item.codigo;
        if (!itemGroups.has(codigo)) {
          itemGroups.set(codigo, []);
        }
        itemGroups.get(codigo)!.push(item);
      });
      
      let duplicatesRemoved = 0;
      let itemsKept = 0;
      
      // Process each group
      for (const [codigo, items] of itemGroups) {
        if (items.length > 1) {
          console.log(`Found ${items.length} duplicates for codigo: ${codigo}`);
          
          // Sort by creation date (keep the oldest one, or the one with most data)
          const sortedItems = items.sort((a, b) => {
            // Prefer items with more complete data
            const aScore = this.getItemCompleteness(a);
            const bScore = this.getItemCompleteness(b);
            
            if (aScore !== bScore) {
              return bScore - aScore; // Higher score first
            }
            
            // If completeness is equal, prefer older items
            const aDate = a.createdAt ? new Date(a.createdAt) : new Date(0);
            const bDate = b.createdAt ? new Date(b.createdAt) : new Date(0);
            return aDate.getTime() - bDate.getTime();
          });
          
          // Keep the first one (best item), delete the rest
          const itemToKeep = sortedItems[0];
          const itemsToDelete = sortedItems.slice(1);
          
          console.log(`Keeping item with ID: ${itemToKeep.id}, deleting ${itemsToDelete.length} duplicates`);
          
          // Delete duplicates
          for (const item of itemsToDelete) {
            await this.deleteItem(item.id!);
            duplicatesRemoved++;
          }
          
          itemsKept++;
        } else {
          // No duplicates for this codigo
          itemsKept++;
        }
      }
      
      console.log(`Duplicate removal completed. Removed: ${duplicatesRemoved}, Kept: ${itemsKept}`);
      
      return {
        removed: duplicatesRemoved,
        kept: itemsKept
      };
    } catch (error) {
      console.error('Error removing duplicates:', error);
      throw error;
    }
  },

  // Helper function to score item completeness
  getItemCompleteness(item: InventoryItem): number {
    let score = 0;
    
    // Essential fields
    if (item.codigo?.trim()) score += 10;
    if (item.descripcion?.trim()) score += 5;
    if (item.estado?.trim()) score += 3;
    if (item.proveedor?.trim()) score += 3;
    if (item.cliente?.trim()) score += 3;
    
    // Optional but valuable fields
    if (item.proforma?.trim()) score += 2;
    if (item.po?.trim()) score += 2;
    if (item.factura?.trim()) score += 2;
    if (item.fechaProduccion?.trim()) score += 2;
    if (item.fechaEmbarque?.trim()) score += 2;
    if (item.fechaLlegada?.trim()) score += 2;
    if (item.fechaEntrega?.trim()) score += 2;
    if (item.lugar?.trim()) score += 2;
    if (item.chassis?.trim()) score += 2;
    if (item.orderNr?.trim()) score += 2;
    if (item.cr && item.cr > 0) score += 3;
    if (item.link?.trim()) score += 1;
    
    return score;
  },

  // Auto-remove duplicates on startup
  async autoRemoveDuplicatesOnStartup(): Promise<{ removed: number; kept: number } | null> {
    try {
      const allItems = await this.getAllItems();
      
      // Check if there are duplicates
      const codeGroups = new Map<string, number>();
      allItems.forEach(item => {
        const count = codeGroups.get(item.codigo) || 0;
        codeGroups.set(item.codigo, count + 1);
      });
      
      let duplicateCount = 0;
      codeGroups.forEach(count => {
        if (count > 1) {
          duplicateCount += count - 1;
        }
      });
      
      if (duplicateCount > 0) {
        console.log(`Auto-removing ${duplicateCount} unified inventory duplicates on startup...`);
        return await this.removeDuplicateItems();
      }
      
      return null;
    } catch (error) {
      console.error('Error in auto-remove unified inventory duplicates:', error);
      return null;
    }
  },

  // Check if collection is empty and needs initial data
  async needsInitialData(): Promise<boolean> {
    try {
      const items = await this.getAllItems();
      return items.length === 0;
    } catch (error) {
      console.error('Error checking if unified inventory collection needs initial data:', error);
      return true; // Assume it needs data if we can't check
    }
  }
};