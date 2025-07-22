import React, { useState } from 'react';
import { MessageCircle, X, Building, Users } from 'lucide-react';
import ChatBox from './ChatBox';
import { Department } from '../types/inventory';

interface ChatToggleProps {
  username?: string;
  department?: Department;
  userRole?: 'admin' | 'user' | 'supervisor';
}

const ChatToggle: React.FC<ChatToggleProps> = ({ username, department, userRole }) => {
  const [showChat, setShowChat] = useState(false);

  if (showChat) {
    return (
      <ChatBox
        username={username}
        department={department}
        userRole={userRole}
        onClose={() => setShowChat(false)}
      />
    );
  }

  return (
    <button
      onClick={() => setShowChat(true)}
      className="fixed bottom-4 right-4 z-40 bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 group relative"
      title="Abrir Chat General"
    >
      <div className="relative">
        <MessageCircle className="w-6 h-6" />
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
      </div>
      
      {/* Tooltip mejorado */}
      <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-black text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
        <div className="flex items-center space-x-2">
          <Building className="w-4 h-4" />
          <span>Chat General - Todos los Departamentos</span>
        </div>
        <div className="text-xs text-gray-300 mt-1">
          Requiere contraseña del departamento
        </div>
        <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black"></div>
      </div>
      
      {/* Indicador de actividad */}
      <div className="absolute -top-2 -left-2 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold animate-bounce">
        <Users className="w-2 h-2" />
      </div>
    </button>
  );
};

export default ChatToggle;