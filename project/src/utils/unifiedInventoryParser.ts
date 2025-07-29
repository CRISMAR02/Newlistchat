import Papa from 'papaparse';
import { InventoryItem } from '../types/inventory';

const VALID_STATES = [
  'PEDIDO',
  'APROBACION DE FACTURACION',
  'FACTURACION',
  'EMBARQUE LIBRE',
  'TRANSITO',
  'ADUANA ORIGEN',
  'ADUANA DESTINO',
  'IDA 3',
  'DESPACHO',
  'CONFERENCIA',
  'CONFERIDO',
  'STOCK ALGESA',
  'STOCK',
  'PODER 3RO',
  'CREDITO',
  'PREPARACION',
  'ENVIADO P12',
  'FACTURADO',
  'LOGISTICA ENTREGA',
  'ENTREGA TECNICA',
  'TRAMITE WEB',
  'SIN CREDITO SIN STOCK M',
  'SIN CREDITO SIN SOLICITUD DE PREPARO M',
  'SIN CREDITO EN PREPARACION',
  'SIN STOCK M',
  'SIN SOLICITUD DE PREPARO M',
  'PROGRAMACION DE ENTREGA',
  'CARNEADO',
  'PROCESAMIENTO ESPECIAL',
  'SIN SOLICITUD DE PREPARACION',
  'PREPARACION SOLICITADO',
  'SOLICITUD DE PREPARACION RECIBIDA',
  'PREPARACION CONCLUIDA'
];

export const parseUnifiedInventoryCSV = (csvText: string): Omit<InventoryItem, 'id'>[] => {
  // Detectar el delimitador automáticamente
  const detectDelimiter = (text: string): string => {
    const firstLine = text.split('\n')[0];
    const delimiters = [',', ';', '\t', '|'];
    let maxCount = 0;
    let bestDelimiter = ',';
    
    delimiters.forEach(delimiter => {
      const count = (firstLine.match(new RegExp(`\\${delimiter}`, 'g')) || []).length;
      if (count > maxCount) {
        maxCount = count;
        bestDelimiter = delimiter;
      }
    });
    
    return bestDelimiter;
  };
  
  const delimiter = detectDelimiter(csvText);
  console.log('Detected delimiter:', delimiter);
  
  const results = Papa.parse(csvText, {
    header: true,
    delimiter: delimiter,
    skipEmptyLines: true,
    encoding: 'UTF-8',
    transformHeader: (header: string, index: number) => {
      // Map CSV headers to our inventory fields
      const headerMap: Record<string, string> = {
        'TIPO': 'type',
        'TYPE': 'type',
        'ITEM_TYPE': 'type',
        'PROVEEDOR': 'proveedor',
        'PROVIDER': 'proveedor',
        'SUPPLIER': 'proveedor',
        'CODIGO': 'codigo',
        'CÓDIGO': 'codigo',
        'CODE': 'codigo',
        'ITEM_CODE': 'codigo',
        'SKU': 'codigo',
        'PROFORMA': 'proforma',
        'PO': 'po',
        'P.O': 'po',
        'P.O.': 'po',
        'PURCHASE_ORDER': 'po',
        'FACTURA': 'factura',
        'INVOICE': 'factura',
        'INVOICE_NUMBER': 'factura',
        'ESTADO': 'estado',
        'STATUS': 'estado',
        'STATE': 'estado',
        'CONDITION': 'estado',
        'DESCRIPCION': 'descripcion',
        'DESCRIPCIÓN': 'descripcion',
        'DESCRIPTION': 'descripcion',
        'DESC': 'descripcion',
        'FECHA_PRODUCCION': 'fechaProduccion',
        'FECHA PRODUCCION': 'fechaProduccion',
        'FECHA_EMBARQUE': 'fechaEmbarque',
        'FECHA EMBARQUE': 'fechaEmbarque',
        'FECHA_LLEGADA': 'fechaLlegada',
        'FECHA LLEGADA': 'fechaLlegada',
        'FECHA_ENTREGA': 'fechaEntrega',
        'FECHA ENTREGA': 'fechaEntrega',
        'PRODUCTION_DATE': 'fechaProduccion',
        'SHIPMENT_DATE': 'fechaEmbarque',
        'ARRIVAL_DATE': 'fechaLlegada',
        'DELIVERY_DATE': 'fechaEntrega',
        'CLIENTE': 'cliente',
        'CLIENT': 'cliente',
        'CUSTOMER': 'cliente',
        'LUGAR': 'lugar',
        'UBICACION': 'lugar',
        'UBICACIÓN': 'lugar',
        'LOCATION': 'lugar',
        'PLACE': 'lugar',
        'CHASSIS': 'chassis',
        'CHASIS': 'chassis',
        'CHASIS_NUMBER': 'chassis',
        'CR': 'cr',
        'VARIABLE': 'cr',
        'ORDER_NR': 'orderNr',
        'ORDER NR': 'orderNr',
        'ORDER_NUMBER': 'orderNr',
        'ORDER NUMBER': 'orderNr',
        'ENLACE': 'link',
        'LINK': 'link',
        'URL': 'link'
      };
      
      const normalizedHeader = header.trim().toUpperCase();
      const mappedHeader = headerMap[normalizedHeader];
      if (mappedHeader) {
        console.log(`Mapped header: "${header}" -> "${mappedHeader}"`);
        return mappedHeader;
      }
      
      // Si no se encuentra mapeo, crear un campo dinámico
      const cleanHeader = header.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '_')
        .trim();
      console.log(`Unmapped header: "${header}" -> "${cleanHeader}"`);
      return cleanHeader;
    }
  });

  if (results.errors.length > 0) {
    console.warn('CSV parsing errors:', results.errors);
  }
  
  console.log('Parsed data sample:', results.data.slice(0, 3));
  console.log('Headers found:', Object.keys(results.data[0] || {}));

  const items: Omit<InventoryItem, 'id'>[] = [];
  const errors: string[] = [];

  results.data.forEach((row: any, index: number) => {
    try {
      // Debug: mostrar la fila actual
      if (index < 5) {
        console.log(`Row ${index + 2}:`, row);
      }
      
      // Validate required fields
      const codigo = row.codigo || row.CODIGO || row.Code || row.SKU || '';
      if (!codigo || !codigo.toString().trim()) {
        errors.push(`Fila ${index + 2}: Código es requerido`);
        return;
      }

      const descripcion = row.descripcion || row.DESCRIPCION || row.Description || row.DESC || '';
      if (!descripcion || !descripcion.toString().trim()) {
        errors.push(`Fila ${index + 2}: Descripción es requerida`);
        return;
      }

      // Validate and normalize type
      let type: 'IMPLEMENTO' | 'MAQUINA' = 'IMPLEMENTO';
      const typeValue = row.type || row.TYPE || row.Tipo || row.TIPO || '';
      if (typeValue) {
        const typeStr = typeValue.toString().toUpperCase().trim();
        if (typeStr === 'MAQUINA' || typeStr === 'MACHINE') {
          type = 'MAQUINA';
        } else if (typeStr === 'IMPLEMENTO' || typeStr === 'IMPLEMENT') {
          type = 'IMPLEMENTO';
        } else {
          errors.push(`Fila ${index + 2}: Tipo debe ser 'IMPLEMENTO' o 'MAQUINA', encontrado: '${typeStr}'`);
          return;
        }
      }

      // Validate and normalize state
      let estado = 'PEDIDO';
      const estadoValue = row.estado || row.ESTADO || row.Status || row.STATE || '';
      if (estadoValue) {
        const estadoStr = estadoValue.toString().toUpperCase().trim();
        if (VALID_STATES.includes(estadoStr)) {
          estado = estadoStr;
        } else {
          errors.push(`Fila ${index + 2}: Estado '${estadoStr}' no es válido. Estados válidos: ${VALID_STATES.join(', ')}`);
          return;
        }
      }

      // Parse numeric CR value
      let cr = 0;
      const crValue = row.cr || row.CR || row.Variable || row.VARIABLE || '';
      if (crValue) {
        const crStr = crValue.toString().replace(/[^\d.-]/g, '');
        const crNum = parseFloat(crStr);
        if (!isNaN(crNum)) {
          cr = crNum;
        }
      }

      // Validate and format dates
      const formatDate = (dateValue: any): string => {
        if (!dateValue) return '';
        
        const dateStr = dateValue.toString().trim();
        if (!dateStr) return '';
        
        // Try to parse different date formats
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) {
          return dateStr; // Return original if can't parse
        }
        
        // Return in YYYY-MM-DD format
        return date.toISOString().split('T')[0];
      };
      
      // Helper function to get field value with multiple possible keys
      const getFieldValue = (row: any, ...keys: string[]): string => {
        for (const key of keys) {
          if (row[key] !== undefined && row[key] !== null) {
            return row[key].toString().trim();
          }
        }
        return '';
      };

      // Crear item base con campos requeridos
      const baseItem: Omit<InventoryItem, 'id'> = {
        type,
        proveedor: getFieldValue(row, 'proveedor', 'PROVEEDOR', 'Provider', 'Supplier'),
        codigo: codigo.toString().trim(),
        proforma: getFieldValue(row, 'proforma', 'PROFORMA', 'Proforma'),
        po: getFieldValue(row, 'po', 'PO', 'P.O', 'P.O.', 'Purchase_Order'),
        factura: getFieldValue(row, 'factura', 'FACTURA', 'Invoice', 'Invoice_Number'),
        estado,
        descripcion: descripcion.toString().trim(),
        fechaProduccion: formatDate(getFieldValue(row, 'fechaProduccion', 'FECHA_PRODUCCION', 'Production_Date')),
        fechaEmbarque: formatDate(getFieldValue(row, 'fechaEmbarque', 'FECHA_EMBARQUE', 'Shipment_Date')),
        fechaLlegada: formatDate(getFieldValue(row, 'fechaLlegada', 'FECHA_LLEGADA', 'Arrival_Date')),
        fechaEntrega: formatDate(getFieldValue(row, 'fechaEntrega', 'FECHA_ENTREGA', 'Delivery_Date')),
        cliente: getFieldValue(row, 'cliente', 'CLIENTE', 'Client', 'Customer'),
        lugar: getFieldValue(row, 'lugar', 'LUGAR', 'Location', 'Place', 'ubicacion', 'UBICACION'),
        chassis: getFieldValue(row, 'chassis', 'CHASSIS', 'Chasis', 'CHASIS'),
        cr,
        orderNr: getFieldValue(row, 'orderNr', 'ORDER_NR', 'Order_Number', 'OrderNumber'),
        link: getFieldValue(row, 'link', 'LINK', 'URL', 'Enlace', 'ENLACE')
      };

      // Agregar campos dinámicos (cualquier columna que no esté en los campos base)
      const knownFields = new Set([
        'type', 'proveedor', 'codigo', 'proforma', 'po', 'factura', 'estado', 'descripcion',
        'fechaProduccion', 'fechaEmbarque', 'fechaLlegada', 'fechaEntrega', 'cliente', 'lugar',
        'chassis', 'cr', 'orderNr', 'link'
      ]);

      const dynamicFields: Record<string, any> = {};
      Object.keys(row).forEach(key => {
        if (!knownFields.has(key) && row[key] !== undefined && row[key] !== null && row[key] !== '') {
          dynamicFields[key] = row[key].toString().trim();
        }
      });

      // Combinar item base con campos dinámicos
      const completeItem = {
        ...baseItem,
        ...dynamicFields
      };

      items.push(completeItem);
    } catch (error) {
      errors.push(`Fila ${index + 2}: Error procesando datos - ${error.message}`);
    }
  });

  if (errors.length > 0) {
    console.error('Parsing errors:', errors);
    throw new Error(`Errores encontrados en el archivo:\n${errors.slice(0, 10).join('\n')}${errors.length > 10 ? `\n... y ${errors.length - 10} errores más` : ''}`);
  }
  
  console.log(`Successfully parsed ${items.length} items`);

  return items;
};

export const generateInventoryTemplate = (): string => {
  const headers = [
    'TIPO',
    'PROVEEDOR', 
    'CODIGO',
    'PROFORMA',
    'PO',
    'FACTURA',
    'ESTADO',
    'DESCRIPCION',
    'FECHA_PRODUCCION',
    'FECHA_EMBARQUE',
    'FECHA_LLEGADA',
    'FECHA_ENTREGA',
    'CLIENTE',
    'LUGAR',
    'CHASSIS',
    'CR',
    'ORDER_NR',
    'ENLACE'
  ];

  const exampleRows = [
    [
      'IMPLEMENTO',
      'PROVEEDOR A',
      'IMP001',
      'PRF001',
      'PO001',
      'FAC001',
      'PEDIDO',
      'Implemento de ejemplo',
      '2024-01-15',
      '2024-02-01',
      '2024-02-15',
      '2024-03-01',
      'Cliente A',
      'Almacén Central',
      'CH001',
      '1500.50',
      'ORD001',
      'https://ejemplo.com'
    ],
    [
      'MAQUINA',
      'PROVEEDOR B',
      'MAQ001',
      'PRF002',
      'PO002',
      'FAC002',
      'TRANSITO',
      'Máquina de ejemplo',
      '2024-01-20',
      '2024-02-05',
      '2024-02-20',
      '',
      'Cliente B',
      'Sucursal Norte',
      'CH002',
      '2500.75',
      'ORD002',
      ''
    ]
  ];

  return [headers, ...exampleRows].map(row => row.join(',')).join('\n');
};

// Función para generar datos de prueba rápidos
export const generateQuickTestData = (count: number = 50): Omit<InventoryItem, 'id'>[] => {
  const proveedores = ['PROVEEDOR A', 'PROVEEDOR B', 'PROVEEDOR C', 'PROVEEDOR D'];
  const estados = ['PEDIDO', 'FACTURACIÓN', 'EMBARQUE LIBRE', 'TRANSITO', 'CONFERENCIA', 'STOCK ALGESA', 'FACTURADO'];
  const clientes = ['Cliente Alpha', 'Cliente Beta', 'Cliente Gamma', 'Cliente Delta'];
  const lugares = ['Almacén Central', 'Sucursal Norte', 'Sucursal Sur', 'Depósito Principal'];
  const tipos: ('IMPLEMENTO' | 'MAQUINA')[] = ['IMPLEMENTO', 'MAQUINA'];
  
  const items: Omit<InventoryItem, 'id'>[] = [];
  
  for (let i = 1; i <= count; i++) {
    const tipo = tipos[Math.floor(Math.random() * tipos.length)];
    const proveedor = proveedores[Math.floor(Math.random() * proveedores.length)];
    const estado = estados[Math.floor(Math.random() * estados.length)];
    const cliente = clientes[Math.floor(Math.random() * clientes.length)];
    const lugar = lugares[Math.floor(Math.random() * lugares.length)];
    
    items.push({
      type: tipo,
      proveedor,
      codigo: `${tipo === 'IMPLEMENTO' ? 'IMP' : 'MAQ'}${String(i).padStart(3, '0')}`,
      proforma: `PRF${String(i).padStart(3, '0')}`,
      po: `PO${String(i).padStart(3, '0')}`,
      factura: Math.random() > 0.3 ? `FAC${String(i).padStart(3, '0')}` : '',
      estado,
      descripcion: `${tipo === 'IMPLEMENTO' ? 'Implemento' : 'Máquina'} de prueba número ${i} - ${proveedor}`,
      fechaProduccion: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
      fechaEmbarque: Math.random() > 0.4 ? new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0] : '',
      fechaLlegada: Math.random() > 0.5 ? new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0] : '',
      fechaEntrega: Math.random() > 0.7 ? new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0] : '',
      cliente: Math.random() > 0.2 ? cliente : '',
      lugar,
      chassis: Math.random() > 0.4 ? `CH${String(i).padStart(3, '0')}` : '',
      cr: Math.floor(Math.random() * 5000) + 500,
      orderNr: `ORD${String(i).padStart(3, '0')}`,
      link: Math.random() > 0.7 ? `https://ejemplo.com/item/${i}` : ''
    });
  }
  
  return items;
};