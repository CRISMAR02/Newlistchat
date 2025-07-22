import { useState, useEffect } from 'react';
import { ColumnConfig, TableSettings } from '../types/product';
import { MachineColumnConfig, MachineTableSettings } from '../types/machine';

const PRODUCT_SETTINGS_KEY = 'product-table-settings';
const MACHINE_SETTINGS_KEY = 'machine-table-settings';

const defaultProductColumns: ColumnConfig[] = [
  { key: 'codigo', label: 'Código', type: 'text', required: true, visible: true, order: 1 },
  { key: 'proforma', label: 'Proforma', type: 'text', visible: true, order: 2 },
  { key: 'factura', label: 'Factura', type: 'text', visible: true, order: 3 },
  { key: 'disponibilidad', label: 'Estado', type: 'select', visible: true, order: 4, options: ['STOCK', 'FACTURADO', 'VENDIDO', 'ENTREGADO', 'EN CIABAY'] },
  { key: 'descripcion', label: 'Descripción', type: 'text', visible: true, order: 5 },
  { key: 'llegada', label: 'Ubicación/Llegada', type: 'text', visible: true, order: 6 },
  { key: 'sucursal', label: 'Sucursal', type: 'select', visible: true, order: 7, options: ['SAN ALBERTO', 'SANTA RITA', 'BELLA VISTA', 'CAMPO 9', 'PACTUS', 'SANTA ROSA', 'KATUETE'] },
  { key: 'cliente', label: 'Cliente', type: 'text', visible: true, order: 8 },
  { key: 'lugar', label: 'Lugar', type: 'select', visible: true, order: 9, options: ['CIABAY', 'PACTUS', 'CIABAY/PACTUS'] },
  { key: 'link', label: 'Enlace', type: 'url', visible: false, order: 10 }
];

const defaultMachineColumns: MachineColumnConfig[] = [
  { key: 'orderNr', label: 'Order Nr.', type: 'text', visible: true, order: 1 },
  { key: 'codigo', label: 'Código', type: 'text', required: true, visible: true, order: 2 },
  { key: 'descripcion', label: 'Descripción', type: 'text', required: true, visible: true, order: 3 },
  { key: 'totalAmountUSD', label: 'Total USD', type: 'number', visible: true, order: 4 },
  { key: 'cuadroTfDe', label: 'Cuadro TF DE', type: 'text', visible: true, order: 5 },
  { key: 'estado', label: 'Estado', type: 'select', visible: true, order: 6, options: ['En Stock - Libre', 'Facturado', 'Entregado', 'IDA3 - En Conferencia - Libre', 'Disponible Embarque - Libre', 'P. C. Importacion - Libre'] },
  { key: 'ubicacion', label: 'Ubicación', type: 'select', visible: true, order: 7, options: ['MATRIZ', 'KATUETE', 'SAN ALBERTO', 'SANTA RITA', 'BELLA VISTA', 'CAMPO 9', 'PACTUS'] },
  { key: 'chasis', label: 'Chasis', type: 'text', visible: false, order: 8 },
  { key: 'po', label: 'P.O', type: 'text', visible: false, order: 9 },
  { key: 'model', label: 'Model', type: 'text', visible: false, order: 10 },
  { key: 'plant', label: 'Plant', type: 'text', visible: false, order: 11 },
  { key: 'orderPrice', label: 'Order Price', type: 'number', visible: false, order: 12 },
  { key: 'totalPerUnit', label: 'Total per Unit', type: 'number', visible: false, order: 13 },
  { key: 'nc', label: 'NC', type: 'number', visible: false, order: 14 },
  { key: 'llegada', label: 'Llegada', type: 'text', visible: false, order: 15 },
  { key: 'link', label: 'Enlace', type: 'url', visible: false, order: 16 }
];

export const useProductTableSettings = () => {
  const [settings, setSettings] = useState<TableSettings>(() => {
    const saved = localStorage.getItem(PRODUCT_SETTINGS_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (error) {
        console.error('Error parsing saved product settings:', error);
      }
    }
    return {
      columns: defaultProductColumns,
      defaultColumns: defaultProductColumns.map(col => col.key)
    };
  });

  const saveSettings = (newSettings: TableSettings) => {
    setSettings(newSettings);
    localStorage.setItem(PRODUCT_SETTINGS_KEY, JSON.stringify(newSettings));
  };

  const addColumn = (column: Omit<ColumnConfig, 'order'>) => {
    const maxOrder = Math.max(...settings.columns.map(col => col.order));
    const newColumn: ColumnConfig = {
      ...column,
      order: maxOrder + 1
    };
    
    const newSettings = {
      ...settings,
      columns: [...settings.columns, newColumn]
    };
    saveSettings(newSettings);
  };

  const removeColumn = (key: string) => {
    if (settings.defaultColumns.includes(key)) {
      throw new Error('No se puede eliminar una columna por defecto');
    }
    
    const newSettings = {
      ...settings,
      columns: settings.columns.filter(col => col.key !== key)
    };
    saveSettings(newSettings);
  };

  const updateColumn = (key: string, updates: Partial<ColumnConfig>) => {
    const newSettings = {
      ...settings,
      columns: settings.columns.map(col => 
        col.key === key ? { ...col, ...updates } : col
      )
    };
    saveSettings(newSettings);
  };

  const resetToDefault = () => {
    const defaultSettings = {
      columns: defaultProductColumns,
      defaultColumns: defaultProductColumns.map(col => col.key)
    };
    saveSettings(defaultSettings);
  };

  return {
    settings,
    addColumn,
    removeColumn,
    updateColumn,
    resetToDefault,
    saveSettings
  };
};

export const useMachineTableSettings = () => {
  const [settings, setSettings] = useState<MachineTableSettings>(() => {
    const saved = localStorage.getItem(MACHINE_SETTINGS_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (error) {
        console.error('Error parsing saved machine settings:', error);
      }
    }
    return {
      columns: defaultMachineColumns,
      defaultColumns: defaultMachineColumns.filter(col => col.visible).map(col => col.key)
    };
  });

  const saveSettings = (newSettings: MachineTableSettings) => {
    setSettings(newSettings);
    localStorage.setItem(MACHINE_SETTINGS_KEY, JSON.stringify(newSettings));
  };

  const addColumn = (column: Omit<MachineColumnConfig, 'order'>) => {
    const maxOrder = Math.max(...settings.columns.map(col => col.order));
    const newColumn: MachineColumnConfig = {
      ...column,
      order: maxOrder + 1
    };
    
    const newSettings = {
      ...settings,
      columns: [...settings.columns, newColumn]
    };
    saveSettings(newSettings);
  };

  const removeColumn = (key: string) => {
    if (settings.defaultColumns.includes(key)) {
      throw new Error('No se puede eliminar una columna por defecto');
    }
    
    const newSettings = {
      ...settings,
      columns: settings.columns.filter(col => col.key !== key)
    };
    saveSettings(newSettings);
  };

  const updateColumn = (key: string, updates: Partial<MachineColumnConfig>) => {
    const newSettings = {
      ...settings,
      columns: settings.columns.map(col => 
        col.key === key ? { ...col, ...updates } : col
      )
    };
    saveSettings(newSettings);
  };

  const resetToDefault = () => {
    const defaultSettings = {
      columns: defaultMachineColumns,
      defaultColumns: defaultMachineColumns.filter(col => col.visible).map(col => col.key)
    };
    saveSettings(defaultSettings);
  };

  return {
    settings,
    addColumn,
    removeColumn,
    updateColumn,
    resetToDefault,
    saveSettings
  };
};