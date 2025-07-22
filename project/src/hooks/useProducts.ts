import { useState, useEffect } from 'react';
import { Product } from '../types/product';
import { productService } from '../services/productService';

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRemovalResult, setAutoRemovalResult] = useState<{ removed: number; kept: number } | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // First, auto-remove duplicates if any exist
      const removalResult = await productService.autoRemoveDuplicatesOnStartup();
      if (removalResult) {
        setAutoRemovalResult(removalResult);
        console.log(`Auto-removed ${removalResult.removed} duplicates, kept ${removalResult.kept} products`);
      }
      
      // Then fetch the clean product list
      const fetchedProducts = await productService.getAllProducts();
      setProducts(fetchedProducts);
    } catch (err) {
      setError('Error al cargar productos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addProduct = async (product: Omit<Product, 'id'>) => {
    try {
      await productService.addProduct(product);
      await fetchProducts(); // Refresh list
    } catch (err: any) {
      setError(err.message || 'Error al agregar producto');
      throw err;
    }
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    try {
      await productService.updateProduct(id, updates);
      await fetchProducts(); // Refresh list
    } catch (err) {
      setError('Error al actualizar producto');
      throw err;
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      await productService.deleteProduct(id);
      await fetchProducts(); // Refresh list
    } catch (err) {
      setError('Error al eliminar producto');
      throw err;
    }
  };

  const importProducts = async (products: Omit<Product, 'id'>[]) => {
    try {
      setLoading(true);
      await productService.bulkImportProducts(products);
      await fetchProducts(); // Refresh list
    } catch (err) {
      setError('Error al importar productos');
      throw err;
    }
  };

  const clearAllProducts = async () => {
    try {
      setLoading(true);
      await productService.clearAllProducts();
      await fetchProducts(); // Refresh list
    } catch (err) {
      setError('Error al limpiar productos');
      throw err;
    }
  };

  const removeDuplicates = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await productService.removeDuplicateProducts();
      await fetchProducts(); // Refresh list
      return result;
    } catch (err) {
      setError('Error al eliminar duplicados');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return {
    products,
    loading,
    error,
    autoRemovalResult,
    addProduct,
    updateProduct,
    deleteProduct,
    importProducts,
    clearAllProducts,
    removeDuplicates,
    refetch: fetchProducts
  };
};