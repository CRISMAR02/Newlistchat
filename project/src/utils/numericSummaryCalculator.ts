import { Product } from '../types/product';
import { Machine } from '../types/machine';

export interface NumericSummary {
  count: number;
  totals: Record<string, number>;
}

// Define which fields are numeric for products
const PRODUCT_NUMERIC_FIELDS = [
  'precio',
  'costo',
  'cantidad',
  'stock',
  'valor',
  'monto',
  'total',
  'subtotal',
  'descuento',
  'impuesto'
];

// Define which fields are numeric for machines
const MACHINE_NUMERIC_FIELDS = [
  'orderPrice',
  'totalPerUnit', 
  'totalAmountUSD',
  'nc'
];

// Check if a field name suggests it contains numeric values
const isNumericField = (fieldName: string, entityType: 'PRODUCT' | 'MACHINE'): boolean => {
  const numericFields = entityType === 'PRODUCT' ? PRODUCT_NUMERIC_FIELDS : MACHINE_NUMERIC_FIELDS;
  
  // Check exact matches first
  if (numericFields.includes(fieldName)) {
    return true;
  }
  
  // Check if field name contains numeric keywords
  const numericKeywords = ['price', 'cost', 'amount', 'total', 'valor', 'precio', 'costo', 'monto'];
  return numericKeywords.some(keyword => 
    fieldName.toLowerCase().includes(keyword.toLowerCase())
  );
};

// Check if a value is numeric
const isNumericValue = (value: any): boolean => {
  if (value === null || value === undefined || value === '') {
    return false;
  }
  
  // If it's already a number
  if (typeof value === 'number') {
    return !isNaN(value) && isFinite(value);
  }
  
  // If it's a string, try to parse it
  if (typeof value === 'string') {
    // Remove common currency symbols and separators
    const cleanValue = value.replace(/[$,\s]/g, '');
    const parsed = parseFloat(cleanValue);
    return !isNaN(parsed) && isFinite(parsed);
  }
  
  return false;
};

// Convert value to number
const toNumber = (value: any): number => {
  if (typeof value === 'number') {
    return value;
  }
  
  if (typeof value === 'string') {
    // Remove common currency symbols and separators
    const cleanValue = value.replace(/[$,\s]/g, '');
    return parseFloat(cleanValue) || 0;
  }
  
  return 0;
};

export const calculateProductNumericSummary = (
  products: Product[],
  filteredProducts: Product[]
): NumericSummary | null => {
  if (filteredProducts.length === 0) {
    return null;
  }
  
  // Find all numeric fields in the filtered products
  const numericFields = new Set<string>();
  
  filteredProducts.forEach(product => {
    Object.keys(product).forEach(key => {
      // Skip system fields
      if (['id', 'createdAt', 'updatedAt'].includes(key)) {
        return;
      }
      
      // Check if this field has numeric values and is a numeric field
      if (isNumericField(key, 'PRODUCT') && isNumericValue(product[key])) {
        numericFields.add(key);
      }
    });
  });
  
  if (numericFields.size === 0) {
    return null;
  }
  
  // Calculate totals for each numeric field
  const totals: Record<string, number> = {};
  
  numericFields.forEach(field => {
    totals[field] = filteredProducts.reduce((sum, product) => {
      const value = product[field];
      if (isNumericValue(value)) {
        return sum + toNumber(value);
      }
      return sum;
    }, 0);
  });
  
  return {
    count: filteredProducts.length,
    totals
  };
};

export const calculateMachineNumericSummary = (
  machines: Machine[],
  filteredMachines: Machine[]
): NumericSummary | null => {
  if (filteredMachines.length === 0) {
    return null;
  }
  
  // Find all numeric fields in the filtered machines
  const numericFields = new Set<string>();
  
  filteredMachines.forEach(machine => {
    Object.keys(machine).forEach(key => {
      // Skip system fields
      if (['id', 'createdAt', 'updatedAt'].includes(key)) {
        return;
      }
      
      // Check if this field has numeric values and is a numeric field
      if (isNumericField(key, 'MACHINE') && isNumericValue(machine[key])) {
        numericFields.add(key);
      }
    });
  });
  
  if (numericFields.size === 0) {
    return null;
  }
  
  // Calculate totals for each numeric field
  const totals: Record<string, number> = {};
  
  numericFields.forEach(field => {
    totals[field] = filteredMachines.reduce((sum, machine) => {
      const value = machine[field];
      if (isNumericValue(value)) {
        return sum + toNumber(value);
      }
      return sum;
    }, 0);
  });
  
  return {
    count: filteredMachines.length,
    totals
  };
};