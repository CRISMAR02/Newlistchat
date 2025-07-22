import { Product, ProductStats } from '../types/product';

export const calculateProductStats = (products: Product[]): ProductStats => {
  const stats: ProductStats = {
    total: products.length,
    byStatus: {},
    bySucursal: {},
    byLugar: {},
    pendingDeliveries: 0,
    recentlyUpdated: 0,
    upcomingArrivals: 0
  };

  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Inicializar contadores de ubicación
  stats.byLugar = {
    'CIABAY': 0,
    'PACTUS': 0,
    'ENTREGADO': 0
  };

  products.forEach(product => {
    // Count by status
    if (product.disponibilidad) {
      stats.byStatus[product.disponibilidad] = (stats.byStatus[product.disponibilidad] || 0) + 1;
    }

    // Count by sucursal
    if (product.sucursal) {
      stats.bySucursal[product.sucursal] = (stats.bySucursal[product.sucursal] || 0) + 1;
    }

    // Count by ubicación actual (basado en la columna LLEGADA)
    if (product.llegada) {
      if (product.llegada.includes('EN CIABAY')) {
        stats.byLugar.CIABAY++;
      } else if (product.llegada.includes('EN PACTUS')) {
        stats.byLugar.PACTUS++;
      } else if (product.llegada.includes('ENTREGADO')) {
        stats.byLugar.ENTREGADO++;
      }
    }

    // Count pending deliveries 
    // FACTURADO = vendido, si no está ENTREGADO entonces está pendiente
    if (product.disponibilidad === 'FACTURADO' && !product.llegada?.includes('ENTREGADO')) {
      stats.pendingDeliveries++;
    }
    // VENDIDO también cuenta como pendiente si no está entregado
    if (product.disponibilidad === 'VENDIDO' && !product.llegada?.includes('ENTREGADO')) {
      stats.pendingDeliveries++;
    }

    // Count recently updated products
    if (product.updatedAt && new Date(product.updatedAt) > oneWeekAgo) {
      stats.recentlyUpdated++;
    }

    // Count upcoming arrivals (productos con fechas que aún no llegaron)
    if (product.llegada && product.llegada.includes('-') && product.llegada.includes('.')) {
      // Solo contar como "próximas llegadas" si tienen fecha pero no están en ubicación física
      if (!product.llegada.includes('EN CIABAY') && !product.llegada.includes('EN PACTUS') && !product.llegada.includes('ENTREGADO')) {
        stats.upcomingArrivals++;
      }
    }
  });

  return stats;
};