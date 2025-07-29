import { useState, useEffect, useRef, useCallback } from 'react';

// Función mejorada para obtener la URL del WebSocket
const getWebSocketUrl = (): string => {
  if (typeof window !== 'undefined') {
    // Usar variable de entorno si está disponible
    if (import.meta.env.VITE_WEBSOCKET_URL) {
      return import.meta.env.VITE_WEBSOCKET_URL;
    }
    
    // En producción, usar la URL de Railway
    if (import.meta.env.PROD) {
      // URL por defecto para producción (cambiar por tu URL real)
      return 'wss://tu-proyecto.up.railway.app';
    }
    
    // En desarrollo, usar localhost
    return 'ws://localhost:8080';
  }
  return 'ws://localhost:8080';
};

export interface ChatMessage {
  id: string;
  type: 'chat' | 'user_joined' | 'user_left' | 'system';
  username: string;
  message: string;
  timestamp: string;
  clientId?: string;
  department?: string;
  role?: string;
}

export interface ChatUser {
  id: string;
  username: string;
  displayName?: string;
  joinedAt: string;
  department?: string;
  role?: string;
}

export interface ChatState {
  connected: boolean;
  connecting: boolean;
  messages: ChatMessage[];
  users: ChatUser[];
  typingUsers: string[];
  clientId: string | null;
  currentRoom: string | null;
  connectionAttempts: number;
  lastError: string | null;
}

export const useWebSocketChat = (serverUrl: string = getWebSocketUrl()) => {
  const [state, setState] = useState<ChatState>({
    connected: false,
    connecting: false,
    messages: [],
    users: [],
    typingUsers: [],
    clientId: null,
    currentRoom: null,
    connectionAttempts: 0,
    lastError: null
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const maxReconnectAttempts = 10;
  const heartbeatInterval = 30000; // 30 segundos

  const clearTimeouts = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }, []);

  const startHeartbeat = useCallback(() => {
    clearTimeouts();
    heartbeatIntervalRef.current = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        try {
          wsRef.current.send(JSON.stringify({ type: 'ping' }));
        } catch (error) {
          console.error('Error sending heartbeat:', error);
        }
      }
    }, heartbeatInterval);
  }, [clearTimeouts]);

  const connect = useCallback(() => {
    // Evitar múltiples conexiones simultáneas
    if (state.connecting || (wsRef.current && wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    setState(prev => ({ 
      ...prev, 
      connecting: true, 
      lastError: null 
    }));

    try {
      console.log(`Conectando a: ${serverUrl}`);
      const ws = new WebSocket(serverUrl);
      wsRef.current = ws;

      // Timeout para la conexión
      const connectionTimeout = setTimeout(() => {
        if (ws.readyState === WebSocket.CONNECTING) {
          ws.close();
          setState(prev => ({ 
            ...prev, 
            connecting: false,
            lastError: 'Timeout de conexión'
          }));
        }
      }, 10000); // 10 segundos

      ws.onopen = () => {
        clearTimeout(connectionTimeout);
        console.log('✅ Conectado al servidor de chat');
        setState(prev => ({ 
          ...prev, 
          connected: true, 
          connecting: false,
          connectionAttempts: 0,
          lastError: null
        }));
        startHeartbeat();
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleMessage(data);
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      };

      ws.onclose = (event) => {
        clearTimeout(connectionTimeout);
        clearTimeouts();
        
        console.log('🔌 Conexión cerrada:', event.code, event.reason);
        setState(prev => ({ 
          ...prev, 
          connected: false, 
          connecting: false,
          lastError: event.reason || 'Conexión cerrada'
        }));
        
        // Intentar reconectar si no fue un cierre intencional
        if (event.code !== 1000 && state.connectionAttempts < maxReconnectAttempts) {
          const timeout = Math.min(1000 * Math.pow(2, state.connectionAttempts), 30000);
          console.log(`🔄 Reintentando conexión en ${timeout}ms... (intento ${state.connectionAttempts + 1}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            setState(prev => ({ 
              ...prev, 
              connectionAttempts: prev.connectionAttempts + 1 
            }));
            connect();
          }, timeout);
        } else if (state.connectionAttempts >= maxReconnectAttempts) {
          setState(prev => ({ 
            ...prev, 
            lastError: 'Máximo de intentos de reconexión alcanzado'
          }));
        }
      };

      ws.onerror = (error) => {
        clearTimeout(connectionTimeout);
        console.error('❌ Error de WebSocket:', error);
        setState(prev => ({ 
          ...prev, 
          connecting: false,
          lastError: 'Error de conexión'
        }));
      };

    } catch (error) {
      console.error('❌ Error creando WebSocket:', error);
      setState(prev => ({ 
        ...prev, 
        connecting: false,
        lastError: 'Error al crear conexión'
      }));
    }
  }, [serverUrl, state.connectionAttempts, state.connecting, startHeartbeat]);

  const handleMessage = useCallback((data: any) => {
    switch (data.type) {
      case 'connection':
        setState(prev => ({ ...prev, clientId: data.clientId }));
        break;

      case 'chat':
      case 'user_joined':
      case 'user_left':
        setState(prev => ({
          ...prev,
          messages: [...prev.messages, data].slice(-100) // Mantener últimos 100 mensajes
        }));
        break;

      case 'history':
        setState(prev => ({ ...prev, messages: data.messages || [] }));
        break;

      case 'user_list':
        setState(prev => ({ ...prev, users: data.users || [] }));
        break;

      case 'room_changed':
        setState(prev => ({ ...prev, currentRoom: data.room }));
        break;

      case 'typing':
        setState(prev => {
          const typingUsers = prev.typingUsers.filter(user => user !== data.username);
          if (data.isTyping && data.username) {
            typingUsers.push(data.username);
          }
          return { ...prev, typingUsers };
        });
        break;

      case 'pong':
        // Respuesta al heartbeat
        break;

      case 'error':
        console.error('Error del servidor:', data.message);
        setState(prev => ({ ...prev, lastError: data.message }));
        break;

      default:
        console.log('Mensaje no manejado:', data);
    }
  }, []);

  const sendMessage = useCallback((message: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && message.trim()) {
      try {
        wsRef.current.send(JSON.stringify({
          type: 'chat',
          message: message.trim()
        }));
        return true;
      } catch (error) {
        console.error('Error enviando mensaje:', error);
        setState(prev => ({ ...prev, lastError: 'Error enviando mensaje' }));
        return false;
      }
    }
    return false;
  }, []);

  const joinRoom = useCallback((username: string, room: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && username.trim() && room.trim()) {
      try {
        wsRef.current.send(JSON.stringify({
          type: 'join',
          username: username.trim(),
          room: room.trim()
        }));
        setState(prev => ({ ...prev, currentRoom: room.trim() }));
        return true;
      } catch (error) {
        console.error('Error uniéndose a sala:', error);
        setState(prev => ({ ...prev, lastError: 'Error uniéndose a sala' }));
        return false;
      }
    }
    return false;
  }, []);

  const sendTyping = useCallback((isTyping: boolean) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify({
          type: 'typing',
          isTyping: isTyping
        }));

        // Auto-stop typing después de 3 segundos
        if (isTyping) {
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
          }
          typingTimeoutRef.current = setTimeout(() => {
            sendTyping(false);
          }, 3000);
        }
        return true;
      } catch (error) {
        console.error('Error enviando indicador de escritura:', error);
        return false;
      }
    }
    return false;
  }, []);

  const disconnect = useCallback(() => {
    clearTimeouts();
    if (wsRef.current) {
      wsRef.current.close(1000, 'User disconnected');
      wsRef.current = null;
    }
    setState({
      connected: false,
      connecting: false,
      messages: [],
      users: [],
      typingUsers: [],
      clientId: null,
      currentRoom: null,
      connectionAttempts: 0,
      lastError: null
    });
  }, [clearTimeouts]);

  const forceReconnect = useCallback(() => {
    setState(prev => ({ ...prev, connectionAttempts: 0 }));
    disconnect();
    setTimeout(() => connect(), 1000);
  }, [disconnect, connect]);

  // Efecto principal para inicializar la conexión
  useEffect(() => {
    connect();

    // Cleanup al desmontar
    return () => {
      clearTimeouts();
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounted');
      }
    };
  }, []);

  // Efecto para manejar visibilidad de la página
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !state.connected && !state.connecting) {
        console.log('🔄 Página visible, reintentando conexión...');
        forceReconnect();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [state.connected, state.connecting, forceReconnect]);

  return {
    ...state,
    sendMessage,
    joinRoom,
    sendTyping,
    disconnect,
    reconnect: forceReconnect,
    isReady: state.connected && !state.connecting
  };
};