import React, { useState, useMemo } from 'react';
import { X, Download, FileText, Eye, EyeOff, Palette, Layout } from 'lucide-react';
import { Product } from '../types/product';
import { useProductTableSettings } from '../hooks/useTableSettings';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { reportService } from '../services/reportService';
import Swal from 'sweetalert2';

interface PDFExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  filteredProducts: Product[];
}

const PDFExportModal: React.FC<PDFExportModalProps> = ({
  isOpen,
  onClose,
  products,
  filteredProducts
}) => {
  const { settings } = useProductTableSettings();
  const [selectedColumns, setSelectedColumns] = useState<string[]>(() => 
    settings.columns.filter(col => col.visible).map(col => col.key)
  );
  const [exportFiltered, setExportFiltered] = useState(false);
  const [includeStats, setIncludeStats] = useState(true);
  const [filename, setFilename] = useState('implementos');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('landscape');
  const [pageSize, setPageSize] = useState<'a4' | 'letter' | 'legal'>('a4');
  const [colorTheme, setColorTheme] = useState<'blue' | 'green' | 'purple' | 'gray'>('blue');
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');

  // Get all available columns from actual data + configured columns
  const availableColumns = useMemo(() => {
    const configuredColumns = settings.columns.sort((a, b) => a.order - b.order);
    const allFieldsInData = new Set<string>();
    
    [...products, ...filteredProducts].forEach(product => {
      Object.keys(product).forEach(key => {
        if (!['id', 'createdAt', 'updatedAt'].includes(key)) {
          allFieldsInData.add(key);
        }
      });
    });
    
    const dynamicColumns = Array.from(allFieldsInData)
      .filter(field => !configuredColumns.some(col => col.key === field))
      .map((field, index) => ({
        key: field,
        label: field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1'),
        type: 'text' as const,
        visible: false,
        order: configuredColumns.length + index + 1,
        required: false
      }));
    
    return [...configuredColumns, ...dynamicColumns].sort((a, b) => a.order - b.order);
  }, [settings.columns, products, filteredProducts]);

  const dataToExport = exportFiltered ? filteredProducts : products;

  React.useEffect(() => {
    if (isOpen) {
      setSelectedColumns(availableColumns.filter(col => col.visible).map(col => col.key));
    }
  }, [isOpen, availableColumns]);

  const toggleColumn = (columnKey: string) => {
    setSelectedColumns(prev => 
      prev.includes(columnKey)
        ? prev.filter(key => key !== columnKey)
        : [...prev, columnKey]
    );
  };

  const selectAllColumns = () => {
    setSelectedColumns(availableColumns.map(col => col.key));
  };

  const selectVisibleColumns = () => {
    setSelectedColumns(availableColumns.filter(col => col.visible).map(col => col.key));
  };

  const clearSelection = () => {
    setSelectedColumns([]);
  };

  const getColumnLabel = (key: string) => {
    const column = availableColumns.find(col => col.key === key);
    return column?.label || key.toUpperCase();
  };

  const formatCellValue = (value: any, columnKey: string) => {
    if (!value) return '';
    
    const column = availableColumns.find(col => col.key === columnKey);
    
    switch (column?.type) {
      case 'number':
        return typeof value === 'number' ? value.toLocaleString() : value.toString();
      case 'date':
        return value instanceof Date ? value.toLocaleDateString('es-ES') : value.toString();
      case 'url':
        return value.toString().length > 30 ? value.toString().substring(0, 30) + '...' : value.toString();
      default:
        const str = value.toString();
        return str.length > 40 ? str.substring(0, 40) + '...' : str;
    }
  };

  const getThemeColors = (theme: string) => {
    switch (theme) {
      case 'blue':
        return { primary: [79, 70, 229], secondary: [147, 197, 253], text: [30, 58, 138] };
      case 'green':
        return { primary: [5, 150, 105], secondary: [134, 239, 172], text: [6, 78, 59] };
      case 'purple':
        return { primary: [124, 58, 237], secondary: [196, 181, 253], text: [76, 29, 149] };
      case 'gray':
        return { primary: [75, 85, 99], secondary: [209, 213, 219], text: [31, 41, 55] };
      default:
        return { primary: [79, 70, 229], secondary: [147, 197, 253], text: [30, 58, 138] };
    }
  };

  const getFontSize = (size: string) => {
    switch (size) {
      case 'small': return { header: 8, body: 7, title: 16 };
      case 'medium': return { header: 10, body: 8, title: 18 };
      case 'large': return { header: 12, body: 10, title: 20 };
      default: return { header: 10, body: 8, title: 18 };
    }
  };

  const generatePDF = async () => {
    if (selectedColumns.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Selecciona columnas',
        text: 'Debes seleccionar al menos una columna para exportar',
        confirmButtonColor: '#dc2626'
      });
      return;
    }

    try {
      const colors = getThemeColors(colorTheme);
      const fontSizes = getFontSize(fontSize);
      
      // Create PDF document
      const doc = new jsPDF({
        orientation: orientation,
        unit: 'mm',
        format: pageSize
      });

      // Set up fonts
      doc.setFont('helvetica');

      // Add title
      doc.setFontSize(fontSizes.title);
      doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
      const title = 'Reporte de Implementos';
      const pageWidth = doc.internal.pageSize.getWidth();
      const titleWidth = doc.getTextWidth(title);
      doc.text(title, (pageWidth - titleWidth) / 2, 20);

      // Add subtitle with date and filters info
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      const subtitle = `Generado el ${new Date().toLocaleDateString('es-ES')} - ${dataToExport.length} registros`;
      const subtitleWidth = doc.getTextWidth(subtitle);
      doc.text(subtitle, (pageWidth - subtitleWidth) / 2, 30);

      // Add export type info
      if (exportFiltered) {
        doc.setFontSize(10);
        doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
        const filterInfo = `Datos filtrados (${filteredProducts.length} de ${products.length} registros)`;
        const filterWidth = doc.getTextWidth(filterInfo);
        doc.text(filterInfo, (pageWidth - filterWidth) / 2, 38);
      }

      // Prepare table data
      const headers = selectedColumns.map(key => getColumnLabel(key));
      const tableData = dataToExport.map(product => 
        selectedColumns.map(key => formatCellValue(product[key], key))
      );

      // Add main table
      autoTable(doc, {
        head: [headers],
        body: tableData,
        startY: exportFiltered ? 45 : 40,
        theme: 'grid',
        headStyles: {
          fillColor: colors.primary,
          textColor: [255, 255, 255],
          fontSize: fontSizes.header,
          fontStyle: 'bold',
          halign: 'center'
        },
        bodyStyles: {
          fontSize: fontSizes.body,
          textColor: [50, 50, 50]
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        },
        styles: {
          cellPadding: 3,
          lineColor: [200, 200, 200],
          lineWidth: 0.1
        },
        columnStyles: selectedColumns.reduce((acc, key, index) => {
          const column = availableColumns.find(col => col.key === key);
          if (column?.type === 'number') {
            acc[index] = { halign: 'right' };
          } else if (column?.type === 'date') {
            acc[index] = { halign: 'center' };
          }
          return acc;
        }, {} as any),
        margin: { top: 10, right: 10, bottom: 10, left: 10 },
        didDrawPage: (data) => {
          // Add page numbers
          const pageCount = doc.getNumberOfPages();
          const currentPage = doc.getCurrentPageInfo().pageNumber;
          
          doc.setFontSize(8);
          doc.setTextColor(150, 150, 150);
          doc.text(
            `Página ${currentPage} de ${pageCount}`,
            pageWidth - 30,
            doc.internal.pageSize.getHeight() - 10
          );
          
          // Add footer
          doc.text(
            'Sistema de Gestión de Implementos',
            10,
            doc.internal.pageSize.getHeight() - 10
          );
        }
      });

      // Add statistics page if requested
      if (includeStats) {
        doc.addPage();
        
        // Stats page title
        doc.setFontSize(fontSizes.title);
        doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
        const statsTitle = 'Estadísticas del Reporte';
        const statsTitleWidth = doc.getTextWidth(statsTitle);
        doc.text(statsTitle, (pageWidth - statsTitleWidth) / 2, 20);

        // General statistics
        const generalStats = [
          ['Total de Implementos', products.length.toString()],
          ['Implementos Exportados', dataToExport.length.toString()],
          ['Columnas Incluidas', selectedColumns.length.toString()],
          ['Fecha de Exportación', new Date().toLocaleString('es-ES')],
          ['Tipo de Exportación', exportFiltered ? 'Filtrados' : 'Todos'],
          ['Formato', `PDF ${orientation} (${pageSize.toUpperCase()})`]
        ];

        autoTable(doc, {
          head: [['Métrica', 'Valor']],
          body: generalStats,
          startY: 35,
          theme: 'striped',
          headStyles: {
            fillColor: colors.primary,
            textColor: [255, 255, 255],
            fontSize: fontSizes.header,
            fontStyle: 'bold'
          },
          bodyStyles: {
            fontSize: fontSizes.body
          },
          columnStyles: {
            0: { cellWidth: 60, fontStyle: 'bold' },
            1: { cellWidth: 40 }
          }
        });

        // Status breakdown
        const statusCounts: Record<string, number> = {};
        dataToExport.forEach(product => {
          if (product.disponibilidad) {
            statusCounts[product.disponibilidad] = (statusCounts[product.disponibilidad] || 0) + 1;
          }
        });

        if (Object.keys(statusCounts).length > 0) {
          const statusStats = Object.entries(statusCounts).map(([status, count]) => [
            `Estado: ${status}`,
            count.toString()
          ]);

          autoTable(doc, {
            head: [['Estado', 'Cantidad']],
            body: statusStats,
            startY: (doc as any).lastAutoTable.finalY + 15,
            theme: 'striped',
            headStyles: {
              fillColor: colors.secondary,
              textColor: colors.text,
              fontSize: fontSizes.header,
              fontStyle: 'bold'
            },
            bodyStyles: {
              fontSize: fontSizes.body
            },
            columnStyles: {
              0: { cellWidth: 60 },
              1: { cellWidth: 40, halign: 'center' }
            }
          });
        }

        // Branch breakdown if sucursal column is selected
        if (selectedColumns.includes('sucursal')) {
          const branchCounts: Record<string, number> = {};
          dataToExport.forEach(product => {
            if (product.sucursal) {
              branchCounts[product.sucursal] = (branchCounts[product.sucursal] || 0) + 1;
            }
          });

          if (Object.keys(branchCounts).length > 0) {
            const branchStats = Object.entries(branchCounts).map(([branch, count]) => [
              `Sucursal: ${branch}`,
              count.toString()
            ]);

            autoTable(doc, {
              head: [['Sucursal', 'Cantidad']],
              body: branchStats,
              startY: (doc as any).lastAutoTable.finalY + 15,
              theme: 'striped',
              headStyles: {
                fillColor: colors.secondary,
                textColor: colors.text,
                fontSize: fontSizes.header,
                fontStyle: 'bold'
              },
              bodyStyles: {
                fontSize: fontSizes.body
              },
              columnStyles: {
                0: { cellWidth: 60 },
                1: { cellWidth: 40, halign: 'center' }
              }
            });
          }
        }
      }

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const finalFilename = `${filename}_${timestamp}.pdf`;

      // Save PDF
      doc.save(finalFilename);

      // Create report entry
      await reportService.createDataExportReport('PRODUCT', dataToExport, 'PDF');

      // Success notification
      await Swal.fire({
        icon: 'success',
        title: '¡Exportación exitosa!',
        html: `
          <div class="text-center">
            <p class="mb-2">El archivo PDF se ha descargado correctamente</p>
            <div class="bg-red-50 p-3 rounded-lg text-sm text-red-800">
              <strong>Archivo:</strong> ${finalFilename}<br>
              <strong>Registros:</strong> ${dataToExport.length}<br>
              <strong>Columnas:</strong> ${selectedColumns.length}<br>
              <strong>Formato:</strong> ${orientation} (${pageSize.toUpperCase()})
            </div>
          </div>
        `,
        timer: 4000,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });

      onClose();
    } catch (error) {
      console.error('Error generating PDF:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error en la exportación',
        text: 'No se pudo generar el archivo PDF',
        confirmButtonColor: '#dc2626'
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col border border-gray-100">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Exportar a PDF</h2>
              <p className="text-sm text-gray-500">Genera un reporte profesional en PDF</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
          {/* Export Options */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Basic Options */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Opciones Básicas</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del archivo
                  </label>
                  <input
                    type="text"
                    value={filename}
                    onChange={(e) => setFilename(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="implementos"
                  />
                </div>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={exportFiltered}
                      onChange={(e) => setExportFiltered(e.target.checked)}
                      className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Solo exportar productos filtrados ({filteredProducts.length} registros)
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={includeStats}
                      onChange={(e) => setIncludeStats(e.target.checked)}
                      className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Incluir página de estadísticas
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Format Options */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Layout className="w-5 h-5 mr-2" />
                Formato y Diseño
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Orientación
                  </label>
                  <div className="flex space-x-3">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="orientation"
                        value="portrait"
                        checked={orientation === 'portrait'}
                        onChange={(e) => setOrientation(e.target.value as 'portrait')}
                        className="text-red-600 focus:ring-red-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Vertical</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="orientation"
                        value="landscape"
                        checked={orientation === 'landscape'}
                        onChange={(e) => setOrientation(e.target.value as 'landscape')}
                        className="text-red-600 focus:ring-red-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Horizontal</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tamaño de página
                  </label>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(e.target.value as 'a4' | 'letter' | 'legal')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="a4">A4</option>
                    <option value="letter">Carta</option>
                    <option value="legal">Legal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <Palette className="w-4 h-4 mr-1" />
                    Tema de color
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'blue', label: 'Azul', color: 'bg-blue-500' },
                      { value: 'green', label: 'Verde', color: 'bg-green-500' },
                      { value: 'purple', label: 'Morado', color: 'bg-purple-500' },
                      { value: 'gray', label: 'Gris', color: 'bg-gray-500' }
                    ].map((theme) => (
                      <label key={theme.value} className="flex items-center">
                        <input
                          type="radio"
                          name="colorTheme"
                          value={theme.value}
                          checked={colorTheme === theme.value}
                          onChange={(e) => setColorTheme(e.target.value as any)}
                          className="text-red-600 focus:ring-red-500"
                        />
                        <div className={`w-4 h-4 ${theme.color} rounded ml-2 mr-1`}></div>
                        <span className="text-sm text-gray-700">{theme.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tamaño de fuente
                  </label>
                  <select
                    value={fontSize}
                    onChange={(e) => setFontSize(e.target.value as 'small' | 'medium' | 'large')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="small">Pequeña</option>
                    <option value="medium">Mediana</option>
                    <option value="large">Grande</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Column Selection */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Seleccionar Columnas ({selectedColumns.length}/{availableColumns.length})
              </h3>
              <div className="flex space-x-2">
                <button
                  onClick={selectVisibleColumns}
                  className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                >
                  Visibles
                </button>
                <button
                  onClick={selectAllColumns}
                  className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
                >
                  Todas
                </button>
                <button
                  onClick={clearSelection}
                  className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                >
                  Ninguna
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-4">
              {availableColumns.map((column) => (
                <label
                  key={column.key}
                  className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedColumns.includes(column.key)
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedColumns.includes(column.key)}
                    onChange={() => toggleColumn(column.key)}
                    className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <div className="ml-3 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900">
                        {column.label}
                      </span>
                      {column.visible ? (
                        <Eye className="w-3 h-3 text-blue-500" />
                      ) : (
                        <EyeOff className="w-3 h-3 text-gray-400" />
                      )}
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {column.type}
                      </span>
                      {column.required && (
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                          Requerido
                        </span>
                      )}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Vista Previa</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Registros a exportar:</strong> {dataToExport.length}</p>
                <p><strong>Columnas seleccionadas:</strong> {selectedColumns.length}</p>
                <p><strong>Formato:</strong> PDF {orientation} ({pageSize.toUpperCase()})</p>
                <p><strong>Tema:</strong> {colorTheme} - Fuente {fontSize}</p>
                <p><strong>Páginas estimadas:</strong> {includeStats ? 'Datos + Estadísticas' : 'Solo datos'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-100 bg-gray-50 flex-shrink-0">
          <div className="text-sm text-gray-500">
            Se exportarán {dataToExport.length} registros con {selectedColumns.length} columnas
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={generatePDF}
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-lg hover:from-red-700 hover:to-pink-700 transition-all duration-200 space-x-2 font-medium shadow-lg hover:shadow-xl"
            >
              <Download className="w-4 h-4" />
              <span>Exportar PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFExportModal;