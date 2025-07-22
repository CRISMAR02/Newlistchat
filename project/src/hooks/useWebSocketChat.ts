import { useState, useEffect, useRef, useCallback } from 'react';

// Función para obtener la URL del WebSocket según el entorno
const getWebSocketUrl = (): string => {
  if (typeof window !== 'undefined') {
    // Usar la variable de entorno si está disponible
    const envUrl = import.meta.env.VITE_WEBSOCKET_URL;
    if (envUrl) {
      return envUrl;
    }
    
    // En producción, usar Railway
    if (import.meta.env.PROD) {
      return 'wss://newlistchat-production.up.railway.app';
    }
  }
  // En desarrollo, usar localhost
  return 'ws://localhost:8080';
};

export interface ChatMessage {
  id: string;
  type: 'chat' | 'user_joined' | 'user_left' | 'system';
  username: string;
  message: string;
  timestamp: string;
  clientId?: string;
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
  messages: ChatMessage[];
  users: ChatUser[];
  typingUsers: string[];
  clientId: string | null;
  currentRoom: string | null;
}

export const useWebSocketChat = (serverUrl: string = getWebSocketUrl()) => {
  const [state, setState] = useState<ChatState>({
    connected: false,
    messages: [],
    users: [],
    typingUsers: [],
    clientId: null,
    currentRoom: null
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(serverUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('Conectado al servidor de chat');
        setState(prev => ({ ...prev, connected: true }));
        setReconnectAttempts(0);
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
        console.log('Conexión cerrada:', event.code, event.reason);
        setState(prev => ({ ...prev, connected: false }));
        
        // Intentar reconectar si no fue un cierre intencional
        if (event.code !== 1000 && reconnectAttempts < maxReconnectAttempts) {
          const timeout = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
          console.log(`Intentando reconectar en ${timeout}ms...`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            setReconnectAttempts(prev => prev + 1);
            connect();
          }, timeout);
        }
      };

      ws.onerror = (error) => {
        console.error('Error de WebSocket:', error);
      };

    } catch (error) {
      console.error('Error conectando al WebSocket:', error);
    }
  }, [serverUrl, reconnectAttempts]);

  const handleMessage = (data: any) => {
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
        setState(prev => ({ ...prev, messages: data.messages }));
        break;

      case 'user_list':
        setState(prev => ({ ...prev, users: data.users }));
        break;

      case 'room_changed':
        setState(prev => ({ ...prev, currentRoom: data.room }));
        break;

      case 'typing':
        setState(prev => {
          const typingUsers = prev.typingUsers.filter(user => user !== data.username);
          if (data.isTyping) {
            typingUsers.push(data.username);
          }
          return { ...prev, typingUsers };
        });
        break;

      default:
        console.log('Mensaje no manejado:', data);
    }
  };

  const sendMessage = useCallback((message: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'chat',
        message: message
      }));
    }
  }, []);

  const joinRoom = useCallback((username: string, room: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'join',
        username: username,
        room: room
      }));
      setState(prev => ({ ...prev, currentRoom: room }));
    }
  }, []);

  const sendTyping = useCallback((isTyping: boolean) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
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
    }
  }, []);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close(1000, 'User disconnected');
      wsRef.current = null;
    }
    setState({
      connected: false,
      messages: [],
      users: [],
      typingUsers: [],
      clientId: null,
      currentRoom: null
    });
  }, []);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    ...state,
    sendMessage,
    joinRoom,
    sendTyping,
    disconnect,
    reconnect: connect
  };
};