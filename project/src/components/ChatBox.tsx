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
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);
  
  const {
    connected,
    messages,
    users,
    typingUsers,
    sendMessage,
    joinRoom,
    sendTyping,
    disconnect
  } = useWebSocketChat();

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

    if (!password.trim()) {
      setError('La contraseña del departamento es requerida');
      return;
    }

    if (!validateDepartmentAccess(password)) {
      setError('Contraseña de departamento incorrecta');
      setPassword('');
      return;
    }

    // Unirse al chat general con información del departamento
    const roomName = 'general-chat';
    const userWithDepartment = `${userDepartment} - ${username.trim()}`;
    
    joinRoom(userWithDepartment, roomName);
    setIsJoined(true);
    setError('');
  };

  const handleSendMessage = () => {
    if (currentMessage.trim() && isJoined) {
      sendMessage(currentMessage.trim());
      setCurrentMessage('');
      sendTyping(false);
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
    
    // Send typing indicator
    if (e.target.value.length > 0) {
      sendTyping(true);
    } else {
      sendTyping(false);
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
          {users.length > 0 && (
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
              {connected ? (
                <>
                  <Wifi className="w-3 h-3" />
                  <span>Conectado</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3" />
                  <span>Desconectado</span>
                </>
              )}
              {isJoined && (
                <>
                  <span>•</span>
                  <span>{users.length} usuario{users.length !== 1 ? 's' : ''}</span>
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
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña del departamento
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError('');
                  }}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Contraseña de tu departamento"
                  onKeyPress={handleKeyPress}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
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
              <h5 className="text-sm font-medium text-blue-900 mb-2">Departamentos disponibles:</h5>
              <div className="grid grid-cols-1 gap-2 text-xs">
                {Object.entries(departmentPasswords).map(([pass, info]) => (
                  <div key={pass} className="flex items-center space-x-2 text-blue-700">
                    <span>{info.icon}</span>
                    <span className="font-medium">{info.name}</span>
                    {pass === 'Crismar002' && <span className="text-xs bg-red-100 text-red-600 px-1 rounded">Admin</span>}
                  </div>
                ))}
              </div>
            </div>
            
            <button
              onClick={handleJoin}
              disabled={!connected || !username.trim() || !password.trim()}
              className={`w-full bg-gradient-to-r ${departmentColor} text-white py-2 px-4 rounded-lg hover:shadow-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {connected ? 'Unirse al Chat General' : 'Conectando...'}
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
                {userDepartment} - {username}
              </span>
            </div>
            <div className="flex space-x-2">
              <input
                ref={messageInputRef}
                type="text"
                value={currentMessage}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent text-sm"
                style={{ focusRingColor: departmentColor }}
                placeholder="Mensaje para todos los departamentos..."
                disabled={!connected}
              />
              <button
                onClick={handleSendMessage}
                disabled={!connected || !currentMessage.trim()}
                className={`bg-gradient-to-r ${departmentColor} text-white p-2 rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ChatBox;