import React, { useState, useMemo } from 'react';
import { X, Download, FileSpreadsheet, Check, Eye, EyeOff } from 'lucide-react';
import { Machine } from '../types/machine';
import { useMachineTableSettings } from '../hooks/useTableSettings';
import * as XLSX from 'xlsx';
import { reportService } from '../services/reportService';
import Swal from 'sweetalert2';

interface MachineExcelExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  machines: Machine[];
  filteredMachines: Machine[];
}

const MachineExcelExportModal: React.FC<MachineExcelExportModalProps> = ({
  isOpen,
  onClose,
  machines,
  filteredMachines
}) => {
  const { settings } = useMachineTableSettings();
  const [selectedColumns, setSelectedColumns] = useState<string[]>(() => 
    settings.columns.filter(col => col.visible).map(col => col.key)
  );
  const [exportFiltered, setExportFiltered] = useState(false);
  const [includeStats, setIncludeStats] = useState(true);
  const [filename, setFilename] = useState('maquinas');

  // Get all available columns from actual data + configured columns
  const availableColumns = useMemo(() => {
    const configuredColumns = settings.columns.sort((a, b) => a.order - b.order);
    const allFieldsInData = new Set<string>();
    
    // Get all unique fields from the actual machine data
    [...machines, ...filteredMachines].forEach(machine => {
      Object.keys(machine).forEach(key => {
        if (!['id', 'createdAt', 'updatedAt'].includes(key)) {
          allFieldsInData.add(key);
        }
      });
    });
    
    // Create columns for fields that exist in data but not in configuration
    const dynamicColumns = Array.from(allFieldsInData)
      .filter(field => !configuredColumns.some(col => col.key === field))
      .map((field, index) => ({
        key: field,
        label: field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1'),
        type: 'text' as const,
        visible: false, // New dynamic columns are hidden by default
        order: configuredColumns.length + index + 1,
        required: false
      }));
    
    return [...configuredColumns, ...dynamicColumns].sort((a, b) => a.order - b.order);
  }, [settings.columns, machines, filteredMachines]);

  const dataToExport = exportFiltered ? filteredMachines : machines;

  // Update selected columns when modal opens to include visible columns
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
        return typeof value === 'number' ? value : parseFloat(value) || 0;
      case 'date':
        return value instanceof Date ? value.toLocaleDateString('es-ES') : value;
      case 'url':
        return value.toString();
      default:
        return value.toString();
    }
  };

  const generateExcel = async () => {
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
      // Create workbook
      const wb = XLSX.utils.book_new();

      // Prepare main data
      const excelData = dataToExport.map(machine => {
        const row: any = {};
        selectedColumns.forEach(columnKey => {
          const label = getColumnLabel(columnKey);
          row[label] = formatCellValue(machine[columnKey], columnKey);
        });
        return row;
      });

      // Create main worksheet
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Set column widths based on content
      const colWidths = selectedColumns.map(columnKey => {
        const label = getColumnLabel(columnKey);
        const maxLength = Math.max(
          label.length,
          ...dataToExport.map(machine => {
            const value = formatCellValue(machine[columnKey], columnKey);
            return value.toString().length;
          })
        );
        return { wch: Math.min(Math.max(maxLength + 2, 10), 50) };
      });
      ws['!cols'] = colWidths;

      // Add header styling
      const headerRange = XLSX.utils.decode_range(ws['!ref'] || 'A1');
      for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
        if (!ws[cellAddress]) continue;
        
        ws[cellAddress].s = {
          font: { bold: true, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "059669" } },
          alignment: { horizontal: "center", vertical: "center" },
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } }
          }
        };
      }

      // Add data row styling
      for (let row = 1; row <= headerRange.e.r; row++) {
        for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
          const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
          if (!ws[cellAddress]) continue;
          
          ws[cellAddress].s = {
            alignment: { horizontal: "left", vertical: "center" },
            border: {
              top: { style: "thin", color: { rgb: "E5E7EB" } },
              bottom: { style: "thin", color: { rgb: "E5E7EB" } },
              left: { style: "thin", color: { rgb: "E5E7EB" } },
              right: { style: "thin", color: { rgb: "E5E7EB" } }
            },
            fill: { fgColor: { rgb: row % 2 === 0 ? "F9FAFB" : "FFFFFF" } }
          };
        }
      }

      // Add main sheet
      XLSX.utils.book_append_sheet(wb, ws, 'Máquinas');

      // Add statistics sheet if requested
      if (includeStats) {
        const statsData = [
          { Métrica: 'Total de Máquinas', Valor: machines.length },
          { Métrica: 'Máquinas Exportadas', Valor: dataToExport.length },
          { Métrica: 'Columnas Incluidas', Valor: selectedColumns.length },
          { Métrica: 'Fecha de Exportación', Valor: new Date().toLocaleString('es-ES') },
          { Métrica: 'Tipo de Exportación', Valor: exportFiltered ? 'Filtradas' : 'Todas' }
        ];

        // Add status breakdown
        const statusCounts: Record<string, number> = {};
        dataToExport.forEach(machine => {
          if (machine.estado) {
            statusCounts[machine.estado] = (statusCounts[machine.estado] || 0) + 1;
          }
        });

        Object.entries(statusCounts).forEach(([status, count]) => {
          statsData.push({ Métrica: `Estado: ${status}`, Valor: count });
        });

        // Add location breakdown if ubicacion column is selected
        if (selectedColumns.includes('ubicacion')) {
          const locationCounts: Record<string, number> = {};
          dataToExport.forEach(machine => {
            if (machine.ubicacion) {
              locationCounts[machine.ubicacion] = (locationCounts[machine.ubicacion] || 0) + 1;
            }
          });

          Object.entries(locationCounts).forEach(([location, count]) => {
            statsData.push({ Métrica: `Ubicación: ${location}`, Valor: count });
          });
        }

        // Add value totals if numeric columns are selected
        const numericColumns = ['orderPrice', 'totalPerUnit', 'totalAmountUSD', 'nc'];
        numericColumns.forEach(columnKey => {
          if (selectedColumns.includes(columnKey)) {
            const total = dataToExport.reduce((sum, machine) => {
              return sum + (machine[columnKey] || 0);
            }, 0);
            const label = getColumnLabel(columnKey);
            statsData.push({ Métrica: `Total ${label}`, Valor: `$${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}` });
          }
        });

        const statsWs = XLSX.utils.json_to_sheet(statsData);
        statsWs['!cols'] = [{ wch: 25 }, { wch: 20 }];
        
        // Style stats header
        ['A1', 'B1'].forEach(cell => {
          if (statsWs[cell]) {
            statsWs[cell].s = {
              font: { bold: true, color: { rgb: "FFFFFF" } },
              fill: { fgColor: { rgb: "059669" } },
              alignment: { horizontal: "center", vertical: "center" }
            };
          }
        });

        XLSX.utils.book_append_sheet(wb, statsWs, 'Estadísticas');
      }

      // Add column info sheet
      const columnInfo = selectedColumns.map(columnKey => {
        const column = availableColumns.find(col => col.key === columnKey);
        return {
          'Clave': columnKey,
          'Etiqueta': column?.label || columnKey,
          'Tipo': column?.type || 'text',
          'Requerido': column?.required ? 'Sí' : 'No',
          'Visible por Defecto': column?.visible ? 'Sí' : 'No'
        };
      });

      const columnWs = XLSX.utils.json_to_sheet(columnInfo);
      columnWs['!cols'] = [
        { wch: 20 }, // Clave
        { wch: 25 }, // Etiqueta
        { wch: 10 }, // Tipo
        { wch: 12 }, // Requerido
        { wch: 18 }  // Visible por Defecto
      ];

      // Style column info header
      ['A1', 'B1', 'C1', 'D1', 'E1'].forEach(cell => {
        if (columnWs[cell]) {
          columnWs[cell].s = {
            font: { bold: true, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "7C3AED" } },
            alignment: { horizontal: "center", vertical: "center" }
          };
        }
      });

      XLSX.utils.book_append_sheet(wb, columnWs, 'Información de Columnas');

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const finalFilename = `${filename}_${timestamp}.xlsx`;

      // Save file
      XLSX.writeFile(wb, finalFilename);

      // Create report entry
      await reportService.createDataExportReport('MACHINE', dataToExport, 'XLSX');

      // Success notification
      await Swal.fire({
        icon: 'success',
        title: '¡Exportación exitosa!',
        html: `
          <div class="text-center">
            <p class="mb-2">El archivo Excel se ha descargado correctamente</p>
            <div class="bg-green-50 p-3 rounded-lg text-sm text-green-800">
              <strong>Archivo:</strong> ${finalFilename}<br>
              <strong>Registros:</strong> ${dataToExport.length}<br>
              <strong>Columnas:</strong> ${selectedColumns.length}
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
      console.error('Error generating Excel:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error en la exportación',
        text: 'No se pudo generar el archivo Excel',
        confirmButtonColor: '#dc2626'
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col border border-gray-100">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Exportar Máquinas a Excel</h2>
              <p className="text-sm text-gray-500">Personaliza tu exportación</p>
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
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Opciones de Exportación</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del archivo
                </label>
                <input
                  type="text"
                  value={filename}
                  onChange={(e) => setFilename(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="maquinas"
                />
              </div>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={exportFiltered}
                    onChange={(e) => setExportFiltered(e.target.checked)}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Solo exportar máquinas filtradas ({filteredMachines.length} registros)
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={includeStats}
                    onChange={(e) => setIncludeStats(e.target.checked)}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Incluir hoja de estadísticas
                  </span>
                </label>
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
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedColumns.includes(column.key)}
                    onChange={() => toggleColumn(column.key)}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
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
                <p><strong>Hojas del archivo:</strong> 
                  Máquinas{includeStats ? ', Estadísticas' : ''}, Información de Columnas
                </p>
                <p><strong>Formato:</strong> Excel (.xlsx) con estilos y formato profesional</p>
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
              onClick={generateExcel}
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 space-x-2 font-medium shadow-lg hover:shadow-xl"
            >
              <Download className="w-4 h-4" />
              <span>Exportar Excel</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MachineExcelExportModal;