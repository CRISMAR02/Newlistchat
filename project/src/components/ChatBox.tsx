import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, Users, X, Minimize2, Maximize2, Wifi, WifiOff, Building, Shield, UserCheck, Lock, Eye, EyeOff } from 'lucide-react';
import { useWebSocketChat, ChatMessage } from '../hooks/useWebSocketChat';
import { Department } from '../types/inventory';

interface ChatBoxProps {
  username?: string;
  department?: Department;
  userRole?: 'admin' | 'user' | 'supervisor';
  onClose?: () => void;
}

const ChatBox: React.FC<ChatBoxProps> = ({ 
  username: initialUsername, 
  department,
  userRole = 'user',
  onClose 
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [username, setUsername] = useState(initialUsername || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [currentMessage, setCurrentMessage] = useState('');
  const [showUserList, setShowUserList] = useState(false);
  const [userDepartment, setUserDepartment] = useState<string>('');
  const [departmentColor, setDepartmentColor] = useState('from-gray-500 to-gray-600');
  const [error, setError] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);
  
  const {
    connected,
    connecting,
    lastError,
    connectionAttempts,
    messages,
    users,
    typingUsers,
    sendMessage,
    joinRoom,
    sendTyping,
    disconnect,
    reconnect,
    isReady
  } = useWebSocketChat();

  // Actualizar estado de conexión
  useEffect(() => {
    if (connecting) {
      setConnectionStatus('connecting');
    } else if (connected) {
      setConnectionStatus('connected');
      setError(''); // Limpiar errores cuando se conecta
    } else if (lastError) {
      setConnectionStatus('error');
      setError(lastError);
    } else {
      setConnectionStatus('disconnected');
    }
  }, [connected, connecting, lastError]);

  // Contraseñas de departamentos
  const departmentPasswords: Record<string, { name: string; color: string; icon: string }> = {
    'FAC20': { 
      name: 'Facturación', 
      color: 'from-green-500 to-green-600',
      icon: '💰'
    },
    'Logx25': { 
      name: 'Logística', 
      color: 'from-blue-500 to-blue-600',
      icon: '🚛'
    },
    'ST0CK25': { 
      name: 'Stock', 
      color: 'from-emerald-500 to-emerald-600',
      icon: '📦'
    },
    'Admi.25': { 
      name: 'Administrativo', 
      color: 'from-purple-500 to-purple-600',
      icon: '⚙️'
    },
    'Crismar002': { 
      name: 'Administrador', 
      color: 'from-red-500 to-red-600',
      icon: '👑'
    }
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const validateDepartmentAccess = (inputPassword: string): boolean => {
    const departmentInfo = departmentPasswords[inputPassword];
    if (departmentInfo) {
      setUserDepartment(departmentInfo.name);
      setDepartmentColor(departmentInfo.color);
      return true;
    }
    return false;
  };

  const handleJoin = () => {
    if (!username.trim()) {
      setError('El nombre de usuario es requerido');
      return;
    }


    // Verificar que esté conectado antes de unirse
    if (!isReady) {
      setError('Conectando al servidor... Intenta nuevamente en un momento');
      return;
    }

    try {
      // Unirse al chat general con información del departamento
      const roomName = 'general-chat';
      const userWithDepartment = `General - ${username.trim()}`;
      
      const success = joinRoom(userWithDepartment, roomName);
      if (success) {
        setIsJoined(true);
        setError('');
      } else {
        setError('Error al unirse al chat. Intenta nuevamente.');
      }
    } catch (error) {
      setError('Error de conexión. Intenta nuevamente.');
    }
  };

  const handleSendMessage = () => {
    if (currentMessage.trim() && isJoined && isReady) {
      const success = sendMessage(currentMessage.trim());
      if (success) {
        setCurrentMessage('');
        sendTyping(false);
      } else {
        setError('Error enviando mensaje. Verifica tu conexión.');
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isJoined) {
        handleJoin();
      } else {
        handleSendMessage();
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentMessage(e.target.value);
    
    // Send typing indicator solo si está conectado
    if (isReady) {
      if (e.target.value.length > 0) {
        sendTyping(true);
      } else {
        sendTyping(false);
      }
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMessageStyle = (message: ChatMessage) => {
    switch (message.type) {
      case 'user_joined':
        return 'bg-green-50 text-green-800 border-green-200';
      case 'user_left':
        return 'bg-red-50 text-red-800 border-red-200';
      case 'system':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      default:
        return 'bg-white border-gray-200';
    }
  };

  const getDepartmentFromUsername = (fullUsername: string): { department: string; name: string; icon: string } => {
    const parts = fullUsername.split(' - ');
    if (parts.length >= 2) {
      const dept = parts[0];
      const name = parts.slice(1).join(' - ');
      
      // Buscar el icono del departamento
      const deptInfo = Object.values(departmentPasswords).find(d => d.name === dept);
      const icon = deptInfo?.icon || '👤';
      
      return { department: dept, name, icon };
    }
    return { department: 'General', name: fullUsername, icon: '👤' };
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="w-3 h-3 text-red-400" />;
      case 'supervisor': return <UserCheck className="w-3 h-3 text-yellow-400" />;
      default: return <Users className="w-3 h-3 text-blue-400" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'text-red-400';
      case 'supervisor': return 'text-yellow-400';
      default: return 'text-blue-400';
    }
  };

  const getConnectionStatusInfo = () => {
    switch (connectionStatus) {
      case 'connecting':
        return {
          icon: <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />,
          text: 'Conectando...',
          color: 'text-yellow-300'
        };
      case 'connected':
        return {
          icon: <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />,
          text: 'Conectado',
          color: 'text-green-300'
        };
      case 'error':
        return {
          icon: <div className="w-3 h-3 bg-red-400 rounded-full" />,
          text: `Error${connectionAttempts > 0 ? ` (${connectionAttempts}/10)` : ''}`,
          color: 'text-red-300'
        };
      default:
        return {
          icon: <div className="w-3 h-3 bg-gray-400 rounded-full" />,
          text: 'Desconectado',
          color: 'text-gray-300'
        };
    }
  };

  const connectionInfo = getConnectionStatusInfo();

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsMinimized(false)}
          className={`flex items-center space-x-2 bg-gradient-to-r ${departmentColor} text-white px-4 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 relative`}
        >
          <Building className="w-5 h-5" />
          <div className="text-left">
            <div className="font-medium text-sm">Chat General</div>
            <div className="text-xs opacity-90">{userDepartment || 'Todos los departamentos'}</div>
          </div>
          {messages.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {messages.length}
            </span>
          )}
          {connected && (
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 h-[32rem] bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col">
      {/* Header */}
      <div className={`flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r ${departmentColor} text-white rounded-t-lg`}>
        <div className="flex items-center space-x-2">
          <Building className="w-5 h-5" />
          <div>
            <h3 className="font-semibold text-sm">Chat General</h3>
            <div className="flex items-center space-x-1 text-xs">
              {connectionInfo.icon}
              <span className={connectionInfo.color}>{connectionInfo.text}</span>
              {isJoined && (
                <>
                  <span>•</span>
                  <span>{users.length} usuario{users.length !== 1 ? 's' : ''}</span>
                  {connectionStatus === 'error' && (
                    <button
                      onClick={() => {
                        setError('');
                        reconnect();
                      }}
                      className="mt-2 px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Reintentar Conexión
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setShowUserList(!showUserList)}
            className="p-1 hover:bg-black/20 rounded transition-colors"
            title="Ver usuarios"
          >
            <Users className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1 hover:bg-black/20 rounded transition-colors"
            title="Minimizar"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 hover:bg-black/20 rounded transition-colors"
              title="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Join Form */}
      {!isJoined && (
        <div className="flex-1 p-4 flex flex-col justify-center">
          <div className="space-y-4">
            <div className="text-center mb-4">
              <div className={`w-16 h-16 bg-gradient-to-r ${departmentColor} rounded-xl flex items-center justify-center mx-auto mb-3`}>
                <MessageCircle className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900">Chat General</h4>
              <p className="text-sm text-gray-600">Todos los departamentos en un solo lugar</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tu nombre de usuario
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (error) setError('');
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ingresa tu nombre"
                onKeyPress={handleKeyPress}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <Lock className="w-4 h-4 text-red-500" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <h5 className="text-sm font-medium text-blue-900 mb-2">Chat General:</h5>
              <p className="text-xs text-blue-700">
                Únete al chat general donde todos los departamentos pueden comunicarse libremente.
              </p>
            </div>
            
            <button
              onClick={handleJoin}
              disabled={!isReady || !username.trim()}
              className={`w-full bg-gradient-to-r ${departmentColor} text-white py-2 px-4 rounded-lg hover:shadow-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isReady ? 'Unirse al Chat General' : connectionInfo.text}
            </button>
          </div>
        </div>
      )}

      {/* Chat Interface */}
      {isJoined && (
        <>
          {/* User List Sidebar */}
          {showUserList && (
            <div className="absolute top-0 left-0 w-full h-full bg-white rounded-lg border border-gray-200 z-10">
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <div>
                  <h4 className="font-semibold text-gray-900">Usuarios Conectados</h4>
                  <p className="text-xs text-gray-500">{users.length} usuario{users.length !== 1 ? 's' : ''} en línea</p>
                </div>
                <button
                  onClick={() => setShowUserList(false)}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
                {users.map((user) => {
                  const userInfo = getDepartmentFromUsername(user.username);
                  return (
                    <div key={user.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <div className="flex items-center space-x-1">
                          <span className="text-sm">{userInfo.icon}</span>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{userInfo.name}</div>
                            <div className="text-xs text-gray-500">{userInfo.department}</div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        {getRoleIcon(user.role || 'user')}
                      </div>
                    </div>
                  );
                })}
                {users.length === 0 && (
                  <div className="text-center py-8">
                    <Building className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No hay usuarios conectados</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((message) => {
              const messageUserInfo = getDepartmentFromUsername(message.username);
              
              return (
                <div
                  key={message.id || `${message.timestamp}-${message.username}`}
                  className={`p-3 rounded-lg border text-sm ${getMessageStyle(message)}`}
                >
                  {message.type === 'chat' ? (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm">{messageUserInfo.icon}</span>
                          <span className="font-semibold text-gray-900">{messageUserInfo.name}</span>
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                            {messageUserInfo.department}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">{formatTime(message.timestamp)}</span>
                      </div>
                      <p className="text-gray-700">{message.message}</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <span className="text-xs">{message.message}</span>
                      <span className="text-xs ml-2">{formatTime(message.timestamp)}</span>
                    </div>
                  )}
                </div>
              );
            })}
            
            {/* Typing Indicators */}
            {typingUsers.length > 0 && (
              <div className="text-xs text-gray-500 italic">
                {typingUsers.map(user => {
                  const userInfo = getDepartmentFromUsername(user);
                  return `${userInfo.name} (${userInfo.department})`;
                }).join(', ')} {typingUsers.length === 1 ? 'está' : 'están'} escribiendo...
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-xs text-gray-500">Escribiendo como:</span>
              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full font-medium">
                General - {username}
              </span>
            </div>
            <div className="flex space-x-2">
              <input
                ref={messageInputRef}
                type="text"
                value={currentMessage}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                style={{ focusRingColor: departmentColor }}
                placeholder="Mensaje para el chat general..."
                disabled={!isReady}
              />
              <button
                onClick={handleSendMessage}
                disabled={!isReady || !currentMessage.trim()}
                className={`bg-gradient-to-r ${departmentColor} text-white p-2 rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            
            {/* Indicador de estado de conexión en el input */}
            {!isReady && (
              <div className="mt-2 text-xs text-center">
                <span className={`${connectionInfo.color} flex items-center justify-center space-x-1`}>
                  {connectionInfo.icon}
                  <span>{connectionInfo.text}</span>
                  {connectionStatus === 'error' && (
                    <button
                      onClick={reconnect}
                      className="ml-2 text-blue-600 hover:text-blue-800 underline"
                    >
                      Reconectar
                    </button>
                  )}
                </span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ChatBox;