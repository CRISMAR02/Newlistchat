import * as XLSX from 'xlsx';
import { Machine } from '../types/machine';
import { reportService } from '../services/reportService';

export const exportMachinesToExcel = (machines: Machine[], filename: string = 'maquinas') => {
  // Prepare data for Excel export
  const excelData = machines.map(machine => ({
    'ORDER NR.': machine.orderNr || '',
    'CÓDIGO': machine.codigo || '',
    'DESCRIPCIÓN': machine.descripcion || '',
    'CHASIS': machine.chasis || '',
    'P.O': machine.po || '',
    'MODEL': machine.model || '',
    'PLANT': machine.plant || '',
    'ORDER PRICE': machine.orderPrice || 0,
    'TOTAL PER UNIT': machine.totalPerUnit || 0,
    'TOTAL AMOUNT USD': machine.totalAmountUSD || 0,
    'NC': machine.nc || 0,
    'CUADRO TF DE': machine.cuadroTfDe || '',
    'ESTADO': machine.estado || '',
    'LLEGADA': machine.llegada || '',
    'UBICACIÓN': machine.ubicacion || '',
    'ENLACE': machine.link || ''
  }));

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(excelData);

  // Set column widths
  const colWidths = [
    { wch: 12 }, // ORDER NR.
    { wch: 15 }, // CÓDIGO
    { wch: 50 }, // DESCRIPCIÓN
    { wch: 20 }, // CHASIS
    { wch: 10 }, // P.O
    { wch: 15 }, // MODEL
    { wch: 12 }, // PLANT
    { wch: 15 }, // ORDER PRICE
    { wch: 15 }, // TOTAL PER UNIT
    { wch: 18 }, // TOTAL AMOUNT USD
    { wch: 12 }, // NC
    { wch: 12 }, // CUADRO TF DE
    { wch: 25 }, // ESTADO
    { wch: 15 }, // LLEGADA
    { wch: 15 }, // UBICACIÓN
    { wch: 30 }  // ENLACE
  ];
  ws['!cols'] = colWidths;

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Máquinas');

  // Generate filename with timestamp
  const timestamp = new Date().toISOString().split('T')[0];
  const finalFilename = `${filename}_${timestamp}.xlsx`;

  // Save file
  XLSX.writeFile(wb, finalFilename);
  
  // Create report entry
  reportService.createDataExportReport('MACHINE', machines, 'XLSX').catch(console.error);
};