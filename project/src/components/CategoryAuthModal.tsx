import React, { useState } from 'react';
import { X, Lock, Shield } from 'lucide-react';

interface CategoryAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticate: (password: string) => Promise<boolean>;
  categoryTitle: string;
}

const CategoryAuthModal: React.FC<CategoryAuthModalProps> = ({ 
  isOpen, 
  onClose, 
  onAuthenticate,
  categoryTitle 
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Por favor ingrese la contraseña');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const isValid = await onAuthenticate(password);
      if (isValid) {
        setPassword('');
        setError('');
        onClose();
      } else {
        setError('Contraseña incorrecta. Intente nuevamente.');
        setPassword('');
        
        // Focus back to password input
        setTimeout(() => {
          const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement;
          if (passwordInput) {
            passwordInput.focus();
          }
        }, 100);
      }
    } catch (error) {
      setError('Error de autenticación. Intente nuevamente.');
      setPassword('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setPassword('');
    setError('');
    setIsLoading(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Acceso Restringido</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Categoría: {categoryTitle}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Contraseña de Acceso
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError(''); // Clear error when user starts typing
              }}
              disabled={isLoading}
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:border-transparent bg-gray-50 dark:bg-gray-700 transition-all duration-200 disabled:opacity-50 text-gray-900 dark:text-white ${
                error 
                  ? 'border-red-300 focus:ring-red-500' 
                  : 'border-gray-200 dark:border-gray-600 focus:ring-purple-500'
              }`}
              placeholder="Ingrese la contraseña para esta categoría"
              autoFocus
            />
            {error && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center animate-shake">
                <span className="w-4 h-4 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mr-2 text-xs">!</span>
                {error}
              </p>
            )}
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Cada categoría requiere una contraseña específica para acceder a los detalles
            </p>
          </div>
          
          <div className="flex space-x-3">
            <button
              type="submit"
              disabled={isLoading || !password.trim()}
              className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 px-4 rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <Shield className="w-4 h-4" />
              <span>{isLoading ? 'Verificando...' : 'Acceder'}</span>
            </button>
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 px-4 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 font-semibold disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoryAuthModal;