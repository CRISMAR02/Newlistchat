import React, { useState } from 'react';
import { X, FileSpreadsheet, FileText, Download } from 'lucide-react';

interface ExportOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectExcel: () => void;
  onSelectPDF: () => void;
  title: string;
}

const ExportOptionsModal: React.FC<ExportOptionsModalProps> = ({
  isOpen,
  onClose,
  onSelectExcel,
  onSelectPDF,
  title
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-gray-100">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <Download className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Exportar Datos</h2>
              <p className="text-sm text-gray-500">{title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-gray-600 mb-6 text-center">
            Selecciona el formato de exportación que prefieras
          </p>

          <div className="space-y-3">
            {/* Excel Option */}
            <button
              onClick={onSelectExcel}
              className="w-full flex items-center p-4 border-2 border-gray-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all duration-200 group"
            >
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                <FileSpreadsheet className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4 text-left">
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-green-800">
                  Exportar a Excel
                </h3>
                <p className="text-sm text-gray-500 group-hover:text-green-600">
                  Archivo .xlsx con múltiples hojas y formato profesional
                </p>
              </div>
              <div className="ml-auto">
                <div className="w-8 h-8 border-2 border-gray-300 rounded-full flex items-center justify-center group-hover:border-green-500 group-hover:bg-green-500 transition-all">
                  <div className="w-3 h-3 bg-transparent rounded-full group-hover:bg-white transition-all"></div>
                </div>
              </div>
            </button>

            {/* PDF Option */}
            <button
              onClick={onSelectPDF}
              className="w-full flex items-center p-4 border-2 border-gray-200 rounded-xl hover:border-red-500 hover:bg-red-50 transition-all duration-200 group"
            >
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center group-hover:bg-red-200 transition-colors">
                <FileText className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4 text-left">
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-red-800">
                  Exportar a PDF
                </h3>
                <p className="text-sm text-gray-500 group-hover:text-red-600">
                  Reporte profesional con estadísticas y diseño personalizable
                </p>
              </div>
              <div className="ml-auto">
                <div className="w-8 h-8 border-2 border-gray-300 rounded-full flex items-center justify-center group-hover:border-red-500 group-hover:bg-red-500 transition-all">
                  <div className="w-3 h-3 bg-transparent rounded-full group-hover:bg-white transition-all"></div>
                </div>
              </div>
            </button>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100">
            <div className="text-xs text-gray-500 space-y-1">
              <p><strong>Excel:</strong> Ideal para análisis de datos y manipulación</p>
              <p><strong>PDF:</strong> Perfecto para reportes formales y presentaciones</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportOptionsModal;