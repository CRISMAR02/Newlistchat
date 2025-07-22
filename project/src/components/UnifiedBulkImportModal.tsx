import React, { useState, useRef } from 'react';
import { X, Upload, FileSpreadsheet, Download, AlertCircle, CheckCircle, RefreshCw, FileText, Database } from 'lucide-react';
import { parseUnifiedInventoryCSV, generateInventoryTemplate, generateQuickTestData } from '../utils/unifiedInventoryParser';
import { InventoryItem } from '../types/inventory';
import Swal from 'sweetalert2';

interface UnifiedBulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (items: Omit<InventoryItem, 'id'>[]) => Promise<void>;
}

const UnifiedBulkImportModal: React.FC<UnifiedBulkImportModalProps> = ({
  isOpen,
  onClose,
  onImport
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<Omit<InventoryItem, 'id'>[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [step, setStep] = useState<'upload' | 'preview' | 'importing'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (selectedFile: File) => {
    const validTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (!validTypes.includes(selectedFile.type) && !selectedFile.name.endsWith('.csv')) {
      Swal.fire({
        icon: 'error',
        title: 'Formato no válido',
        text: 'Solo se permiten archivos CSV y Excel (.xlsx, .xls)',
        confirmButtonColor: '#dc2626'
      });
      return;
    }

    setFile(selectedFile);
    setLoading(true);
    setErrors([]);

    try {
      let csvText = '';
      
      if (selectedFile.type.includes('sheet') || selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls')) {
        // Handle Excel files
        const XLSX = await import('xlsx');
        const arrayBuffer = await selectedFile.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        csvText = XLSX.utils.sheet_to_csv(worksheet);
      } else {
        // Handle CSV files
        csvText = await selectedFile.text();
      }

      const parsed = parseUnifiedInventoryCSV(csvText);
      setParsedData(parsed);
      setStep('preview');
      
      Swal.fire({
        icon: 'success',
        title: '¡Archivo procesado!',
        text: `Se encontraron ${parsed.length} registros válidos`,
        timer: 2000,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
    } catch (error: any) {
      console.error('Error parsing file:', error);
      setErrors([error.message || 'Error al procesar el archivo']);
      Swal.fire({
        icon: 'error',
        title: 'Error al procesar archivo',
        text: error.message || 'No se pudo procesar el archivo',
        confirmButtonColor: '#dc2626'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (parsedData.length === 0) return;

    const result = await Swal.fire({
      title: '¿Confirmar importación?',
      html: `
        <div class="text-left">
          <p class="mb-3">Se importarán <strong>${parsedData.length}</strong> registros al inventario unificado:</p>
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div class="bg-blue-50 p-3 rounded-lg">
              <div class="font-semibold text-blue-800">Implementos</div>
              <div class="text-blue-600">${parsedData.filter(item => item.type === 'IMPLEMENTO').length} registros</div>
            </div>
            <div class="bg-green-50 p-3 rounded-lg">
              <div class="font-semibold text-green-800">Máquinas</div>
              <div class="text-green-600">${parsedData.filter(item => item.type === 'MAQUINA').length} registros</div>
            </div>
          </div>
          <p class="mt-3 text-sm text-gray-600">Los registros duplicados serán omitidos automáticamente.</p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#059669',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, importar',
      cancelButtonText: 'Cancelar',
      width: '500px'
    });

    if (result.isConfirmed) {
      setImporting(true);
      setStep('importing');
      
      try {
        await onImport(parsedData);
        
        await Swal.fire({
          icon: 'success',
          title: '¡Importación completada!',
          html: `
            <div class="text-center">
              <p class="mb-4">Se importaron exitosamente <strong>${parsedData.length}</strong> registros</p>
              <div class="bg-green-50 p-4 rounded-lg">
                <div class="text-green-800 font-semibold">✅ Proceso completado</div>
                <div class="text-green-600 text-sm mt-1">Los datos están ahora disponibles en el inventario</div>
              </div>
            </div>
          `,
          confirmButtonColor: '#059669',
          timer: 4000
        });
        
        handleClose();
      } catch (error: any) {
        console.error('Import error:', error);
        setStep('preview');
        
        await Swal.fire({
          icon: 'error',
          title: 'Error en la importación',
          text: error.message || 'No se pudo completar la importación',
          confirmButtonColor: '#dc2626'
        });
      } finally {
        setImporting(false);
      }
    }
  };

  const generateTestData = async () => {
    const result = await Swal.fire({
      title: '¿Generar datos de prueba?',
      html: `
        <div class="text-left">
          <p class="mb-3">Se generarán datos de prueba para testing:</p>
          <div class="bg-blue-50 p-3 rounded-lg text-sm">
            <div class="font-semibold text-blue-800 mb-2">Incluye:</div>
            <ul class="text-blue-700 space-y-1">
              <li>• 50 registros de ejemplo</li>
              <li>• Mezcla de implementos y máquinas</li>
              <li>• Datos realistas con fechas y proveedores</li>
              <li>• Estados variados del proceso</li>
            </ul>
          </div>
          <p class="mt-3 text-sm text-gray-600">Perfecto para probar el sistema sin preparar archivos.</p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#059669',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Generar Datos',
      cancelButtonText: 'Cancelar',
      width: '500px'
    });

    if (result.isConfirmed) {
      setLoading(true);
      try {
        const testData = generateQuickTestData(50);
        setParsedData(testData);
        setStep('preview');
        
        await Swal.fire({
          icon: 'success',
          title: '¡Datos generados!',
          text: `Se crearon ${testData.length} registros de prueba`,
          timer: 2000,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
      } catch (error) {
        console.error('Error generating test data:', error);
        await Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron generar los datos de prueba',
          confirmButtonColor: '#dc2626'
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const downloadTemplate = () => {
    const template = generateInventoryTemplate();
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'plantilla_inventario_unificado.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    Swal.fire({
      icon: 'success',
      title: 'Plantilla descargada',
      text: 'Usa esta plantilla para preparar tus datos',
      timer: 2000,
      showConfirmButton: false,
      toast: true,
      position: 'top-end'
    });
  };

  const handleClose = () => {
    setFile(null);
    setParsedData([]);
    setErrors([]);
    setStep('upload');
    setLoading(false);
    setImporting(false);
    onClose();
  };

  const resetUpload = () => {
    setFile(null);
    setParsedData([]);
    setErrors([]);
    setStep('upload');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col border border-gray-100">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Carga Rápida de Inventario</h2>
              <p className="text-sm text-gray-500">Importa múltiples registros desde CSV o Excel</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {step === 'upload' && (
            <div className="p-6">
              {/* Template Download */}
              <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-blue-900 mb-1">¿Primera vez usando la carga masiva?</h3>
                    <p className="text-sm text-blue-700 mb-3">
                      Descarga nuestra plantilla con el formato correcto y ejemplos de datos.
                    </p>
                    <button
                      onClick={downloadTemplate}
                      className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors space-x-2 text-sm font-medium"
                    >
                      <Download className="w-4 h-4" />
                      <span>Descargar Plantilla CSV</span>
                    </button>
                    <button
                      onClick={generateTestData}
                      className="inline-flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors space-x-2 text-sm font-medium ml-2"
                    >
                      <Database className="w-4 h-4" />
                      <span>Generar Datos de Prueba</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* File Upload Area */}
              <div
                className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
                  dragActive 
                    ? 'border-purple-500 bg-purple-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileInput}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                    <Upload className="w-8 h-8 text-purple-600" />
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Arrastra tu archivo aquí
                    </h3>
                    <p className="text-gray-600 mb-4">
                      o haz clic para seleccionar un archivo CSV o Excel
                    </p>
                    
                    <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <FileSpreadsheet className="w-4 h-4" />
                        <span>CSV</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <FileSpreadsheet className="w-4 h-4" />
                        <span>Excel (.xlsx, .xls)</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {loading && (
                  <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center rounded-xl">
                    <div className="text-center">
                      <RefreshCw className="w-8 h-8 text-purple-600 animate-spin mx-auto mb-2" />
                      <p className="text-gray-600">Procesando archivo...</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Format Instructions */}
              <div className="mt-6 bg-gray-50 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Formato requerido:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h5 className="font-medium text-gray-800 mb-2">Columnas obligatorias:</h5>
                    <ul className="space-y-1 text-gray-600">
                      <li>• <code className="bg-gray-200 px-1 rounded">TIPO</code> (IMPLEMENTO o MAQUINA)</li>
                      <li>• <code className="bg-gray-200 px-1 rounded">CODIGO</code></li>
                      <li>• <code className="bg-gray-200 px-1 rounded">DESCRIPCION</code></li>
                      <li>• <code className="bg-gray-200 px-1 rounded">ESTADO</code></li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-800 mb-2">Columnas dinámicas:</h5>
                    <ul className="space-y-1 text-gray-600">
                      <li>• <code className="bg-gray-200 px-1 rounded">PROVEEDOR</code></li>
                      <li>• <code className="bg-gray-200 px-1 rounded">CLIENTE</code></li>
                      <li>• <code className="bg-gray-200 px-1 rounded">LUGAR</code></li>
                      <li>• <code className="bg-gray-200 px-1 rounded">CR</code> (Variable numérica)</li>
                      <li>• <strong>Cualquier otra columna</strong> se agregará automáticamente</li>
                    </ul>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <h5 className="font-medium text-blue-800 mb-2">🚀 Funcionalidad Dinámica:</h5>
                  <p className="text-blue-700 text-sm">
                    Puedes agregar <strong>cualquier columna personalizada</strong> en tu archivo CSV. 
                    El sistema creará automáticamente los campos y los asociará al código del item.
                  </p>
                  <p className="text-blue-600 text-xs mt-2">
                    Ejemplo: PESO, DIMENSIONES, MARCA, MODELO, etc. - ¡Todo se importa automáticamente!
                  </p>
                </div>
              </div>

              {errors.length > 0 && (
                <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold text-red-900 mb-2">Errores encontrados:</h4>
                      <ul className="space-y-1 text-sm text-red-700">
                        {errors.map((error, index) => (
                          <li key={index}>• {error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 'preview' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Vista Previa de Datos</h3>
                  <p className="text-sm text-gray-600">
                    {parsedData.length} registros listos para importar
                  </p>
                </div>
                <button
                  onClick={resetUpload}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cambiar archivo
                </button>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Database className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-900">{parsedData.length}</div>
                      <div className="text-sm text-blue-700">Total Registros</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-900">
                        {parsedData.filter(item => item.type === 'IMPLEMENTO').length}
                      </div>
                      <div className="text-sm text-green-700">Implementos</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-purple-900">
                        {parsedData.filter(item => item.type === 'MAQUINA').length}
                      </div>
                      <div className="text-sm text-purple-700">Máquinas</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Data Preview Table */}
              <div className="bg-gray-50 rounded-xl p-4 max-h-96 overflow-auto">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Primeros 10 registros:</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-3 font-medium text-gray-700">Tipo</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-700">Código</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-700">Descripción</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-700">Estado</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-700">Proveedor</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-700">Cliente</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedData.slice(0, 10).map((item, index) => (
                        <tr key={index} className="border-b border-gray-100">
                          <td className="py-2 px-3">
                            <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                              item.type === 'IMPLEMENTO' 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {item.type}
                            </span>
                          </td>
                          <td className="py-2 px-3 font-mono text-gray-900">{item.codigo}</td>
                          <td className="py-2 px-3 text-gray-700 max-w-xs truncate" title={item.descripcion}>
                            {item.descripcion}
                          </td>
                          <td className="py-2 px-3">
                            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                              {item.estado}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-gray-600">{item.proveedor || '-'}</td>
                          <td className="py-2 px-3 text-gray-600">{item.cliente || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {parsedData.length > 10 && (
                  <p className="text-xs text-gray-500 mt-2">
                    ... y {parsedData.length - 10} registros más
                  </p>
                )}
              </div>
            </div>
          )}

          {step === 'importing' && (
            <div className="p-6 flex items-center justify-center min-h-96">
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <RefreshCw className="w-8 h-8 text-purple-600 animate-spin" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Importando datos...</h3>
                <p className="text-gray-600 mb-4">
                  Procesando {parsedData.length} registros en el inventario unificado
                </p>
                <div className="w-64 bg-gray-200 rounded-full h-2 mx-auto">
                  <div className="bg-purple-600 h-2 rounded-full animate-pulse" style={{ width: '70%' }}></div>
                </div>
                <p className="text-sm text-gray-500 mt-2">Por favor, no cierres esta ventana</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {step !== 'importing' && (
          <div className="flex items-center justify-between p-6 border-t border-gray-100 bg-gray-50">
            <div className="text-sm text-gray-500">
              {step === 'preview' && `${parsedData.length} registros listos para importar`}
              {step === 'upload' && 'Selecciona un archivo CSV o Excel para comenzar'}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancelar
              </button>
              {step === 'preview' && (
                <button
                  onClick={handleImport}
                  disabled={importing || parsedData.length === 0}
                  className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 space-x-2 font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Upload className="w-4 h-4" />
                  <span>Importar {parsedData.length} Registros</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UnifiedBulkImportModal;