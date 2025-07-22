import React, { useState } from 'react';
import { Lock, X } from 'lucide-react';
import Swal from 'sweetalert2';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticate: (password: string) => Promise<void>;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthenticate }) => {
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
      await onAuthenticate(password);
      setPassword('');
      setError('');
    } catch (error) {
      setError('Contraseña incorrecta. Intente nuevamente.');
      setPassword(''); // Clear the password field
      
      // Focus back to password input
      setTimeout(() => {
        const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement;
        if (passwordInput) {
          passwordInput.focus();
        }
      }, 100);
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
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-gray-100">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Acceso Administrativo</h2>
              <p className="text-sm text-gray-500">Ingrese su contraseña</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Contraseña de Administrador
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError(''); // Clear error when user starts typing
              }}
              disabled={isLoading}
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:border-transparent bg-gray-50 transition-all duration-200 disabled:opacity-50 ${
                error 
                  ? 'border-red-300 focus:ring-red-500' 
                  : 'border-gray-200 focus:ring-blue-500'
              }`}
              placeholder="Ingrese la contraseña"
              autoFocus
            />
            {error && (
              <p className="mt-2 text-sm text-red-600 flex items-center animate-shake">
                <span className="w-4 h-4 bg-red-100 rounded-full flex items-center justify-center mr-2 text-xs">!</span>
                {error}
              </p>
            )}
            <p className="mt-2 text-xs text-gray-500">
              Nota: Se requiere autenticación con Firebase para acceder al panel de administración
            </p>
          </div>
          
          <div className="flex space-x-3">
            <button
              type="submit"
              disabled={isLoading || !password.trim()}
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Verificando...' : 'Ingresar'}
            </button>
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-xl hover:bg-gray-200 transition-all duration-200 font-semibold disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AuthModal;