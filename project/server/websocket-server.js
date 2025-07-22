const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

class ChatServer {
  constructor(port = process.env.PORT || 8080) {
    this.port = port;
    this.clients = new Map();
    this.rooms = new Map();
    this.messageHistory = new Map();
    this.init();
  }

  init() {
    this.wss = new WebSocket.Server({ 
      port: this.port,
      host: '0.0.0.0', // Permitir conexiones externas en Railway
      host: '0.0.0.0', // Permitir conexiones externas
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    // Health check endpoint para Railway
    if (process.env.NODE_ENV === 'production') {
      const http = require('http');
      const server = http.createServer((req, res) => {
        if (req.url === '/health') {
          res.writeHead(200, { 'Content-Type': 'text/plain' });
          res.end('OK');
        } else {
          res.writeHead(404);
          res.end('Not Found');
        }
      });
      server.listen(this.port + 1); // Health check en puerto diferente
    }

    // Health check endpoint para Railway/Render
    if (process.env.NODE_ENV === 'production') {
      const http = require('http');
      const server = http.createServer((req, res) => {
        if (req.url === '/health') {
          res.writeHead(200, { 'Content-Type': 'text/plain' });
          res.end('OK');
        } else {
          res.writeHead(404);
          res.end('Not Found');
        }
      });
      server.listen(this.port + 1); // Health check en puerto +1
    }

    this.wss.on('connection', (ws, req) => {
      const clientId = uuidv4();
      const clientInfo = {
        id: clientId,
        ws: ws,
        username: null,
        room: null,
        joinedAt: new Date()
      };

      this.clients.set(clientId, clientInfo);
      console.log(`Cliente conectado: ${clientId}`);

      // Enviar ID del cliente
      ws.send(JSON.stringify({
        type: 'connection',
        clientId: clientId,
        message: 'Conectado al servidor de chat'
      }));

      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(clientId, message);
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      });

      ws.on('close', () => {
        this.handleDisconnect(clientId);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.handleDisconnect(clientId);
      });
    });

    console.log(`Servidor de chat iniciado en puerto ${this.port}`);
  }

  handleMessage(clientId, message) {
    const client = this.clients.get(clientId);
    if (!client) return;

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
      default:
        console.log('Tipo de mensaje desconocido:', message.type);
    }
  }

  handleJoin(clientId, message) {
    const client = this.clients.get(clientId);
    if (!client) return;

    const { username, room } = message;
    
    // Extraer departamento del username (formato: "Departamento - Usuario")
    const usernameParts = username.split(' - ');
    const department = usernameParts.length >= 2 ? usernameParts[0] : 'General';
    const displayName = usernameParts.length >= 2 ? usernameParts.slice(1).join(' - ') : username;
    
    // Actualizar información del cliente
    client.username = username;
    client.displayName = displayName;
    client.room = room;
    client.department = department;
    client.role = this.determineUserRole(username); // Determinar rol basado en username

    // Agregar cliente a la sala
    if (!this.rooms.has(room)) {
      this.rooms.set(room, new Set());
      this.messageHistory.set(room, []);
    }
    this.rooms.get(room).add(clientId);

    // Notificar a otros usuarios en la sala
    this.broadcastToRoom(room, {
      type: 'user_joined',
      username: username,
      displayName: displayName,
      department: department,
      message: `${displayName} (${department}) se unió al chat general`,
      timestamp: new Date().toISOString()
    }, clientId);

    // Enviar lista de usuarios conectados
    this.sendUserList(room);

    // Enviar historial de mensajes
    const history = this.messageHistory.get(room) || [];
    client.ws.send(JSON.stringify({
      type: 'history',
      messages: history.slice(-50) // Últimos 50 mensajes
    }));

    console.log(`${username} se unió a la sala ${room}`);
  }

  determineUserRole(username) {
    // Determinar rol basado en el departamento y nombre de usuario
    if (username.includes('Administrador') || username.toLowerCase().includes('admin')) return 'admin';
    if (username.includes('Facturación') || username.includes('Logística')) return 'supervisor';
    if (username.toLowerCase().includes('supervisor') || username.toLowerCase().includes('jefe')) return 'supervisor';
    return 'user';
  }

  handleChatMessage(clientId, message) {
    const client = this.clients.get(clientId);
    if (!client || !client.room) return;

    const chatMessage = {
      id: uuidv4(),
      type: 'chat',
      username: client.username,
      displayName: client.displayName || client.username,
      message: message.message,
      timestamp: new Date().toISOString(),
      clientId: clientId,
      department: client.department,
      role: client.role
    };

    // Guardar en historial
    const history = this.messageHistory.get(client.room);
    history.push(chatMessage);
    
    // Mantener solo los últimos 100 mensajes
    if (history.length > 100) {
      history.splice(0, history.length - 100);
    }

    // Enviar a todos los usuarios en la sala
    this.broadcastToRoom(client.room, chatMessage);
  }

  handleTyping(clientId, message) {
    const client = this.clients.get(clientId);
    if (!client || !client.room) return;

    this.broadcastToRoom(client.room, {
      type: 'typing',
      username: client.username,
      isTyping: message.isTyping
    }, clientId);
  }

  handleGetHistory(clientId, message) {
    const client = this.clients.get(clientId);
    if (!client || !client.room) return;

    const history = this.messageHistory.get(client.room) || [];
    client.ws.send(JSON.stringify({
      type: 'history',
      messages: history.slice(-50)
    }));
  }

  handleDisconnect(clientId) {
    const client = this.clients.get(clientId);
    if (!client) return;

    if (client.room && client.username) {
      // Remover de la sala
      const room = this.rooms.get(client.room);
      if (room) {
        room.delete(clientId);
        
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
    }

    this.clients.delete(clientId);
    console.log(`Cliente desconectado: ${clientId}`);
  }

  broadcastToRoom(room, message, excludeClientId = null) {
    const roomClients = this.rooms.get(room);
    if (!roomClients) return;

    const messageStr = JSON.stringify(message);
    
    roomClients.forEach(clientId => {
      if (clientId === excludeClientId) return;
      
      const client = this.clients.get(clientId);
      if (client && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(messageStr);
      }
    });
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
          joinedAt: client.joinedAt,
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

  getStats() {
    return {
      totalClients: this.clients.size,
      totalRooms: this.rooms.size,
      roomStats: Array.from(this.rooms.entries()).map(([room, clients]) => ({
        room,
        userCount: clients.size
      }))
    };
  }
}

// Iniciar servidor
const chatServer = new ChatServer(8080);

// Manejar cierre graceful
process.on('SIGINT', () => {
  console.log('Cerrando servidor de chat...');
  chatServer.wss.close(() => {
    console.log('Servidor cerrado');
    process.exit(0);
  });
});