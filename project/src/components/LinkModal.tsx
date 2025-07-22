import React, { useState } from 'react';
import { X, ExternalLink, Globe } from 'lucide-react';

interface LinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  title: string;
}

const LinkModal: React.FC<LinkModalProps> = ({ isOpen, onClose, url, title }) => {
  const [loading, setLoading] = useState(true);

  if (!isOpen) return null;

  const handleIframeLoad = () => {
    setLoading(false);
  };

  const openInNewTab = () => {
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-5/6 flex flex-col border border-gray-100">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Vista Web</h2>
              <p className="text-sm text-gray-500 truncate max-w-md">{title}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={openInNewTab}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors hover:bg-gray-100 rounded-lg"
              title="Abrir en nueva pestaña"
            >
              <ExternalLink className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="flex-1 relative">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Cargando contenido...</p>
              </div>
            </div>
          )}
          <iframe
            src={url}
            className="w-full h-full border-0 rounded-b-2xl"
            onLoad={handleIframeLoad}
            title={title}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        </div>
      </div>
    </div>
  );
};

export default LinkModal;