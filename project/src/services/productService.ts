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
import { Product } from '../types/product';

const COLLECTION_NAME = 'products'; // Volver a la colección original

export const productService = {
  async getAllProducts(): Promise<Product[]> {
    try {
      const q = query(collection(db, COLLECTION_NAME), orderBy('codigo'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  },

  async addProduct(product: Omit<Product, 'id'>): Promise<string> {
    try {
      // Check if product with same codigo already exists
      const existingQuery = query(
        collection(db, COLLECTION_NAME), 
        where('codigo', '==', product.codigo)
      );
      const existingDocs = await getDocs(existingQuery);
      
      if (!existingDocs.empty) {
        throw new Error(`Ya existe un implemento con el código ${product.codigo}`);
      }

      const productWithTimestamp = {
        ...product,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const docRef = await addDoc(collection(db, COLLECTION_NAME), productWithTimestamp);
      return docRef.id;
    } catch (error) {
      console.error('Error adding product:', error);
      throw error;
    }
  },

  async updateProduct(id: string, updates: Partial<Product>): Promise<void> {
    try {
      const productRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(productRef, {
        ...updates,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  },

  async deleteProduct(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  },

  async bulkImportProducts(products: Omit<Product, 'id'>[]): Promise<void> {
    try {
      // Get existing products to avoid duplicates
      const existingProducts = await this.getAllProducts();
      const existingCodes = new Set(existingProducts.map(p => p.codigo));
      
      // Filter out products that already exist
      const newProducts = products.filter(product => !existingCodes.has(product.codigo));
      
      if (newProducts.length === 0) {
        console.log('No new products to import - all products already exist');
        return;
      }

      console.log(`Importing ${newProducts.length} new products out of ${products.length} total`);
      
      const promises = newProducts.map(product => 
        this.addProduct(product)
      );
      await Promise.all(promises);
    } catch (error) {
      console.error('Error bulk importing products:', error);
      throw error;
    }
  },

  async clearAllProducts(): Promise<void> {
    try {
      const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
      const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      console.log('All products cleared from database');
    } catch (error) {
      console.error('Error clearing products:', error);
      throw error;
    }
  },

  async removeDuplicateProducts(): Promise<{ removed: number; kept: number }> {
    try {
      console.log('Starting automatic duplicate removal process...');
      
      // Get all products
      const allProducts = await this.getAllProducts();
      console.log(`Found ${allProducts.length} total products`);
      
      // Group products by codigo
      const productGroups = new Map<string, Product[]>();
      
      allProducts.forEach(product => {
        const codigo = product.codigo;
        if (!productGroups.has(codigo)) {
          productGroups.set(codigo, []);
        }
        productGroups.get(codigo)!.push(product);
      });
      
      let duplicatesRemoved = 0;
      let productsKept = 0;
      
      // Process each group
      for (const [codigo, products] of productGroups) {
        if (products.length > 1) {
          console.log(`Found ${products.length} duplicates for codigo: ${codigo}`);
          
          // Sort by creation date (keep the oldest one, or the one with most data)
          const sortedProducts = products.sort((a, b) => {
            // Prefer products with more complete data
            const aScore = this.getProductCompleteness(a);
            const bScore = this.getProductCompleteness(b);
            
            if (aScore !== bScore) {
              return bScore - aScore; // Higher score first
            }
            
            // If completeness is equal, prefer older products
            const aDate = a.createdAt ? new Date(a.createdAt) : new Date(0);
            const bDate = b.createdAt ? new Date(b.createdAt) : new Date(0);
            return aDate.getTime() - bDate.getTime();
          });
          
          // Keep the first one (best product), delete the rest
          const productToKeep = sortedProducts[0];
          const productsToDelete = sortedProducts.slice(1);
          
          console.log(`Keeping product with ID: ${productToKeep.id}, deleting ${productsToDelete.length} duplicates`);
          
          // Delete duplicates
          for (const product of productsToDelete) {
            await this.deleteProduct(product.id!);
            duplicatesRemoved++;
          }
          
          productsKept++;
        } else {
          // No duplicates for this codigo
          productsKept++;
        }
      }
      
      console.log(`Duplicate removal completed. Removed: ${duplicatesRemoved}, Kept: ${productsKept}`);
      
      return {
        removed: duplicatesRemoved,
        kept: productsKept
      };
    } catch (error) {
      console.error('Error removing duplicates:', error);
      throw error;
    }
  },

  // Helper function to score product completeness
  getProductCompleteness(product: Product): number {
    let score = 0;
    
    // Essential fields
    if (product.codigo?.trim()) score += 10;
    if (product.descripcion?.trim()) score += 5;
    if (product.disponibilidad?.trim()) score += 3;
    if (product.lugar?.trim()) score += 3;
    if (product.llegada?.trim()) score += 3;
    
    // Optional but valuable fields
    if (product.proforma?.trim()) score += 2;
    if (product.factura?.trim()) score += 2;
    if (product.sucursal?.trim()) score += 2;
    if (product.cliente?.trim()) score += 2;
    
    return score;
  },

  // Auto-remove duplicates on startup
  async autoRemoveDuplicatesOnStartup(): Promise<{ removed: number; kept: number } | null> {
    try {
      const allProducts = await this.getAllProducts();
      
      // Check if there are duplicates
      const codeGroups = new Map<string, number>();
      allProducts.forEach(product => {
        const count = codeGroups.get(product.codigo) || 0;
        codeGroups.set(product.codigo, count + 1);
      });
      
      let duplicateCount = 0;
      codeGroups.forEach(count => {
        if (count > 1) {
          duplicateCount += count - 1;
        }
      });
      
      if (duplicateCount > 0) {
        console.log(`Auto-removing ${duplicateCount} duplicates on startup...`);
        return await this.removeDuplicateProducts();
      }
      
      return null;
    } catch (error) {
      console.error('Error in auto-remove duplicates:', error);
      return null;
    }
  }
};