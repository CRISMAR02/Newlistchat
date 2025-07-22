import * as XLSX from 'xlsx';
import { Product } from '../types/product';
import { reportService } from '../services/reportService';

export const exportToExcel = (products: Product[], filename: string = 'productos') => {
  // Prepare data for Excel export
  const excelData = products.map(product => ({
    'CÓDIGO': product.codigo,
    'PROFORMA': product.proforma,
    'FACTURA': product.factura,
    'DISPONIBILIDAD': product.disponibilidad,
    'DESCRIPCIÓN': product.descripcion,
    'LLEGADA': product.llegada,
    'SUCURSAL': product.sucursal,
    'CLIENTE': product.cliente,
    'LUGAR': product.lugar,
    'ENLACE': product.link || ''
  }));

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(excelData);

  // Set column widths
  const colWidths = [
    { wch: 15 }, // CÓDIGO
    { wch: 12 }, // PROFORMA
    { wch: 10 }, // FACTURA
    { wch: 15 }, // DISPONIBILIDAD
    { wch: 50 }, // DESCRIPCIÓN
    { wch: 15 }, // LLEGADA
    { wch: 15 }, // SUCURSAL
    { wch: 25 }, // CLIENTE
    { wch: 12 }, // LUGAR
    { wch: 30 }  // ENLACE
  ];
  ws['!cols'] = colWidths;

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Productos');

  // Generate filename with timestamp
  const timestamp = new Date().toISOString().split('T')[0];
  const finalFilename = `${filename}_${timestamp}.xlsx`;

  // Save file
  XLSX.writeFile(wb, finalFilename);
  
  // Create report entry
  reportService.createDataExportReport('PRODUCT', products, 'XLSX').catch(console.error);
};