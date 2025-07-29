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
      className="fixed bottom-6 right-6 z-40 bg-gray-700 text-white p-6 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 group relative"
      title="Abrir Chat General"
    >
      <div className="relative">
        <MessageCircle className="w-8 h-8" />
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
      </div>
      
      {/* Tooltip mejorado */}
      <div className="absolute bottom-full right-0 mb-3 px-4 py-3 bg-gray-800 text-white text-base rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
        <div className="flex items-center space-x-2">
          <Building className="w-5 h-5" />
          <span>Chat General - Acceso Libre</span>
        </div>
        <div className="text-sm text-gray-300 mt-1">
          Sin restricciones de acceso
        </div>
        <div className="absolute top-full right-6 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
      </div>
      
      {/* Indicador de actividad */}
      <div className="absolute -top-3 -left-3 w-6 h-6 bg-gray-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
        <Users className="w-3 h-3" />
      </div>
    </button>
  );
};

export default ChatToggle;