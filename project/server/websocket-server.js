const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

class ChatServer {
  constructor(wssOrPort = 8080) {
    this.clients = new Map();
    this.rooms = new Map();
    this.messageHistory = new Map();
    this.heartbeatInterval = 30000; // 30 segundos
    
    if (typeof wssOrPort === 'number') {
      // Modo desarrollo: crear nuevo WebSocket Server
      this.port = wssOrPort;
      this.init();
    } else {
      // Modo producción: usar WebSocket Server existente
      this.wss = wssOrPort;
      this.setupEventHandlers();
    }
    
    // Iniciar limpieza periódica
    this.startCleanupInterval();
  }

  init() {
    const serverOptions = {
      port: this.port,
      host: process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost',
      perMessageDeflate: {
        zlibDeflateOptions: {
          threshold: 1024,
          concurrencyLimit: 10,
        },
        threshold: 1024,
      },
      maxPayload: 16 * 1024, // 16KB max payload
    };

    this.wss = new WebSocket.Server(serverOptions);

    this.wss.on('connection', (ws, req) => {
      this.handleConnection(ws, req);
    });

    this.setupEventHandlers();
    console.log(`🚀 Servidor de chat iniciado en puerto ${this.port}`);
    console.log(`🌍 Host: ${serverOptions.host}`);
    console.log(`📊 Configuración: ${JSON.stringify(serverOptions, null, 2)}`);
  }

  setupEventHandlers() {
    // Manejar errores del servidor
    this.wss.on('error', (error) => {
      console.error('❌ Error del servidor WebSocket:', error);
    });

    this.wss.on('close', () => {
      console.log('🔌 Servidor WebSocket cerrado');
      this.cleanup();
    });
  }

  handleConnection(ws, req) {
    const clientId = uuidv4();
    const clientIP = req.socket.remoteAddress || 'unknown';
    
    const clientInfo = {
      id: clientId,
      ws: ws,
      username: null,
      displayName: null,
      room: null,
      department: null,
      role: 'user',
      joinedAt: new Date(),
      lastPing: new Date(),
      ip: clientIP
    };

    this.clients.set(clientId, clientInfo);
    console.log(`👤 Cliente conectado: ${clientId} desde ${clientIP} (Total: ${this.clients.size})`);

    // Configurar el WebSocket
    ws.binaryType = 'arraybuffer';

    // Enviar confirmación de conexión
    this.sendToClient(clientId, {
      type: 'connection',
      clientId: clientId,
      message: 'Conectado al servidor de chat',
      serverTime: new Date().toISOString()
    });

    // Configurar heartbeat para este cliente
    this.setupClientHeartbeat(clientId);

    ws.on('message', (data) => {
      try {
        // Validar tamaño del mensaje
        if (data.length > 16 * 1024) { // 16KB
          this.sendToClient(clientId, {
            type: 'error',
            message: 'Mensaje demasiado grande'
          });
          return;
        }

        const message = JSON.parse(data.toString());
        this.handleMessage(clientId, message);
      } catch (error) {
        console.error(`❌ Error parsing message from ${clientId}:`, error);
        this.sendToClient(clientId, {
          type: 'error',
          message: 'Formato de mensaje inválido'
        });
      }
    });

    ws.on('close', (code, reason) => {
      console.log(`👋 Cliente desconectado: ${clientId} (Código: ${code}, Razón: ${reason})`);
      this.handleDisconnect(clientId);
    });

    ws.on('error', (error) => {
      console.error(`❌ Error del cliente ${clientId}:`, error);
      this.handleDisconnect(clientId);
    });

    ws.on('pong', () => {
      const client = this.clients.get(clientId);
      if (client) {
        client.lastPing = new Date();
      }
    });
  }

  setupClientHeartbeat(clientId) {
    const client = this.clients.get(clientId);
    if (!client) return;

    // Enviar ping cada 30 segundos
    const pingInterval = setInterval(() => {
      const currentClient = this.clients.get(clientId);
      if (!currentClient || currentClient.ws.readyState !== WebSocket.OPEN) {
        clearInterval(pingInterval);
        return;
      }

      try {
        currentClient.ws.ping();
      } catch (error) {
        console.error(`❌ Error enviando ping a ${clientId}:`, error);
        clearInterval(pingInterval);
        this.handleDisconnect(clientId);
      }
    }, this.heartbeatInterval);

    // Guardar referencia para limpieza
    client.pingInterval = pingInterval;
  }

  sendToClient(clientId, message) {
    const client = this.clients.get(clientId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      try {
        client.ws.send(JSON.stringify(message));
        return true;
      } catch (error) {
        console.error(`❌ Error enviando mensaje a ${clientId}:`, error);
        this.handleDisconnect(clientId);
        return false;
      }
    }
    return false;
  }

  handleMessage(clientId, message) {
    const client = this.clients.get(clientId);
    if (!client) return;

    // Actualizar último ping
    client.lastPing = new Date();

    // Rate limiting básico
    if (!this.checkRateLimit(clientId)) {
      this.sendToClient(clientId, {
        type: 'error',
        message: 'Demasiados mensajes, espera un momento'
      });
      return;
    }

    switch (message.type) {
      case 'join':
        this.handleJoin(clientId, message);
        break;
      case 'chat':
        this.handleChatMessage(clientId, message);
        break;
      case 'typing':
        this.handleTyping(clientId, message);
        break;
      case 'get_history':
        this.handleGetHistory(clientId, message);
        break;
      case 'ping':
        this.sendToClient(clientId, { type: 'pong' });
        break;
      default:
        console.log(`❓ Tipo de mensaje desconocido de ${clientId}:`, message.type);
    }
  }

  checkRateLimit(clientId) {
    const client = this.clients.get(clientId);
    if (!client) return false;

    const now = Date.now();
    if (!client.lastMessageTime) {
      client.lastMessageTime = now;
      client.messageCount = 1;
      return true;
    }

    // Resetear contador cada minuto
    if (now - client.lastMessageTime > 60000) {
      client.messageCount = 1;
      client.lastMessageTime = now;
      return true;
    }

    // Máximo 30 mensajes por minuto
    if (client.messageCount >= 30) {
      return false;
    }

    client.messageCount++;
    return true;
  }

  handleJoin(clientId, message) {
    const client = this.clients.get(clientId);
    if (!client) return;

    const { username, room } = message;
    
    if (!username || !room) {
      this.sendToClient(clientId, {
        type: 'error',
        message: 'Username y room son requeridos'
      });
      return;
    }

    // Validar longitud
    if (username.length > 100 || room.length > 50) {
      this.sendToClient(clientId, {
        type: 'error',
        message: 'Username o room demasiado largo'
      });
      return;
    }
    
    // Extraer departamento del username (formato: "Departamento - Usuario")
    const usernameParts = username.split(' - ');
    const department = usernameParts.length >= 2 ? usernameParts[0] : 'General';
    const displayName = usernameParts.length >= 2 ? usernameParts.slice(1).join(' - ') : username;
    
    // Remover cliente de sala anterior si existe
    if (client.room) {
      this.removeClientFromRoom(clientId, client.room);
    }

    // Actualizar información del cliente
    client.username = username;
    client.displayName = displayName;
    client.room = room;
    client.department = department;
    client.role = this.determineUserRole(username);

    // Agregar cliente a la nueva sala
    if (!this.rooms.has(room)) {
      this.rooms.set(room, new Set());
      this.messageHistory.set(room, []);
    }
    this.rooms.get(room).add(clientId);

    console.log(`👥 ${username} se unió a la sala ${room} (${this.rooms.get(room).size} usuarios)`);

    // Notificar a otros usuarios en la sala
    this.broadcastToRoom(room, {
      type: 'user_joined',
      username: username,
      displayName: displayName,
      department: department,
      message: `${displayName} (${department}) se unió al chat`,
      timestamp: new Date().toISOString()
    }, clientId);

    // Enviar lista de usuarios conectados
    this.sendUserList(room);

    // Enviar historial de mensajes
    const history = this.messageHistory.get(room) || [];
    this.sendToClient(clientId, {
      type: 'history',
      messages: history.slice(-50) // Últimos 50 mensajes
    });

    // Confirmar unión
    this.sendToClient(clientId, {
      type: 'room_changed',
      room: room,
      message: `Te uniste a ${room}`
    });
  }

  determineUserRole(username) {
    const lowerUsername = username.toLowerCase();
    if (lowerUsername.includes('administrador') || lowerUsername.includes('admin') || lowerUsername.includes('crismar')) {
      return 'admin';
    }
    if (lowerUsername.includes('facturación') || lowerUsername.includes('logística') || 
        lowerUsername.includes('supervisor') || lowerUsername.includes('jefe')) {
      return 'supervisor';
    }
    return 'user';
  }

  handleChatMessage(clientId, message) {
    const client = this.clients.get(clientId);
    if (!client || !client.room || !client.username) {
      this.sendToClient(clientId, {
        type: 'error',
        message: 'Debes unirte a una sala primero'
      });
      return;
    }

    if (!message.message || message.message.trim().length === 0) {
      return;
    }

    // Validar longitud del mensaje
    if (message.message.length > 1000) {
      this.sendToClient(clientId, {
        type: 'error',
        message: 'Mensaje demasiado largo (máximo 1000 caracteres)'
      });
      return;
    }

    const chatMessage = {
      id: uuidv4(),
      type: 'chat',
      username: client.username,
      displayName: client.displayName || client.username,
      message: message.message.trim(),
      timestamp: new Date().toISOString(),
      clientId: clientId,
      department: client.department,
      role: client.role
    };

    // Guardar en historial
    const history = this.messageHistory.get(client.room);
    if (history) {
      history.push(chatMessage);
      
      // Mantener solo los últimos 100 mensajes
      if (history.length > 100) {
        history.splice(0, history.length - 100);
      }
    }

    // Enviar a todos los usuarios en la sala
    this.broadcastToRoom(client.room, chatMessage);
    
    console.log(`💬 Mensaje de ${client.displayName} en ${client.room}: ${message.message.substring(0, 50)}${message.message.length > 50 ? '...' : ''}`);
  }

  handleTyping(clientId, message) {
    const client = this.clients.get(clientId);
    if (!client || !client.room || !client.username) return;

    this.broadcastToRoom(client.room, {
      type: 'typing',
      username: client.username,
      isTyping: !!message.isTyping
    }, clientId);
  }

  handleGetHistory(clientId, message) {
    const client = this.clients.get(clientId);
    if (!client || !client.room) return;

    const history = this.messageHistory.get(client.room) || [];
    this.sendToClient(clientId, {
      type: 'history',
      messages: history.slice(-50)
    });
  }

  removeClientFromRoom(clientId, room) {
    const roomClients = this.rooms.get(room);
    if (roomClients) {
      roomClients.delete(clientId);
      if (roomClients.size === 0) {
        this.rooms.delete(room);
        this.messageHistory.delete(room);
        console.log(`🗑️ Sala ${room} eliminada (sin usuarios)`);
      }
    }
  }

  handleDisconnect(clientId) {
    const client = this.clients.get(clientId);
    if (!client) return;

    // Limpiar interval de ping
    if (client.pingInterval) {
      clearInterval(client.pingInterval);
    }

    if (client.room && client.username) {
      // Remover de la sala
      this.removeClientFromRoom(clientId, client.room);
      
      // Notificar a otros usuarios
      this.broadcastToRoom(client.room, {
        type: 'user_left',
        username: client.username,
        displayName: client.displayName || client.username,
        message: `${client.displayName || client.username} (${client.department}) salió del chat`,
        timestamp: new Date().toISOString()
      });

      // Actualizar lista de usuarios
      this.sendUserList(client.room);
    }

    this.clients.delete(clientId);
    console.log(`🗑️ Cliente ${clientId} eliminado (Total: ${this.clients.size})`);
  }

  broadcastToRoom(room, message, excludeClientId = null) {
    const roomClients = this.rooms.get(room);
    if (!roomClients) return;

    const messageStr = JSON.stringify(message);
    let sentCount = 0;
    
    roomClients.forEach(clientId => {
      if (clientId === excludeClientId) return;
      
      if (this.sendToClient(clientId, message)) {
        sentCount++;
      } else {
        // Cliente desconectado, remover de la sala
        roomClients.delete(clientId);
      }
    });

    if (sentCount > 0) {
      console.log(`📡 Mensaje enviado a ${sentCount} usuarios en sala ${room}`);
    }
  }

  sendUserList(room) {
    const roomClients = this.rooms.get(room);
    if (!roomClients) return;

    const users = [];
    roomClients.forEach(clientId => {
      const client = this.clients.get(clientId);
      if (client && client.username) {
        users.push({
          id: clientId,
          username: client.username,
          displayName: client.displayName || client.username,
          joinedAt: client.joinedAt.toISOString(),
          department: client.department,
          role: client.role
        });
      }
    });

    this.broadcastToRoom(room, {
      type: 'user_list',
      users: users,
      room: room
    });
  }

  startCleanupInterval() {
    // Limpiar clientes inactivos cada 5 minutos
    setInterval(() => {
      this.cleanupInactiveClients();
    }, 5 * 60 * 1000);
  }

  cleanupInactiveClients() {
    const now = new Date();
    const inactiveThreshold = 2 * 60 * 1000; // 2 minutos
    let cleanedCount = 0;

    this.clients.forEach((client, clientId) => {
      const timeSinceLastPing = now.getTime() - client.lastPing.getTime();
      
      if (timeSinceLastPing > inactiveThreshold || client.ws.readyState !== WebSocket.OPEN) {
        console.log(`🧹 Limpiando cliente inactivo: ${clientId} (inactivo por ${Math.round(timeSinceLastPing / 1000)}s)`);
        this.handleDisconnect(clientId);
        cleanedCount++;
      }
    });

    if (cleanedCount > 0) {
      console.log(`🧹 Limpieza completada: ${cleanedCount} clientes eliminados`);
    }
  }

  cleanup() {
    // Cerrar todas las conexiones
    this.clients.forEach((client, clientId) => {
      if (client.pingInterval) {
        clearInterval(client.pingInterval);
      }
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.close(1000, 'Server shutdown');
      }
    });
    
    this.clients.clear();
    this.rooms.clear();
    this.messageHistory.clear();
  }

  getStats() {
    const roomStats = Array.from(this.rooms.entries()).map(([room, clients]) => ({
      room,
      userCount: clients.size,
      messageCount: this.messageHistory.get(room)?.length || 0
    }));

    return {
      totalClients: this.clients.size,
      totalRooms: this.rooms.size,
      roomStats,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage()
    };
  }
}

// Iniciar servidor
const port = process.env.PORT || 8080;
const chatServer = new ChatServer(port);

console.log(`🚀 Chat server iniciado en puerto ${port}`);
console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
console.log(`🏠 Host: ${process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost'}`);

// Endpoint de estadísticas (opcional)
if (process.env.NODE_ENV === 'production') {
  const http = require('http');
  const statsServer = http.createServer((req, res) => {
    if (req.url === '/stats') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(chatServer.getStats()));
    } else if (req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        service: 'websocket-chat-server',
        clients: chatServer.clients.size
      }));
    } else {
      res.writeHead(404);
      res.end('Not Found');
    }
  });
  
  const statsPort = parseInt(port) + 1;
  statsServer.listen(statsPort, () => {
    console.log(`📊 Stats server en puerto ${statsPort}`);
  });
}

// Manejar cierre graceful
process.on('SIGINT', () => {
  console.log('🛑 Cerrando servidor de chat...');
  chatServer.cleanup();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('🛑 Terminando servidor de chat...');
  chatServer.cleanup();
  process.exit(0);
});

// Manejar errores no capturados
process.on('uncaughtException', (error) => {
  console.error('💥 Error no capturado:', error);
  chatServer.cleanup();
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Promesa rechazada no manejada:', reason);
});

module.exports = { ChatServer };