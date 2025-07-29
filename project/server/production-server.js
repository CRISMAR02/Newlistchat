const express = require('express');
const path = require('path');
const { createServer } = require('http');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

// Importar la clase ChatServer
const { ChatServer } = require('./websocket-server');

class ProductionServer {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3000;
    this.wsPort = this.port; // Usar el mismo puerto para HTTP y WebSocket
    this.setupExpress();
    this.setupWebSocket();
  }

  setupExpress() {
    // Servir archivos estáticos del build de Vite
    this.app.use(express.static(path.join(__dirname, '../dist')));

    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        service: 'unified-inventory-app'
      });
    });

    // API endpoints si los necesitas
    this.app.get('/api/status', (req, res) => {
      res.json({
        status: 'running',
        websocket: this.wss ? 'active' : 'inactive',
        clients: this.chatServer ? this.chatServer.getStats() : null
      });
    });

    // Catch-all handler: enviar index.html para rutas SPA
    this.app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, '../dist/index.html'));
    });
  }

  setupWebSocket() {
    // Crear servidor HTTP
    this.server = createServer(this.app);

    // Crear servidor WebSocket en el mismo puerto
    this.wss = new WebSocket.Server({ 
      server: this.server,
      path: '/ws' // Opcional: usar un path específico
    });

    // Configurar chat server
    this.chatServer = new ChatServer(this.wss);

    console.log('WebSocket server configurado en el mismo puerto que HTTP');
  }

  start() {
    this.server.listen(this.port, '0.0.0.0', () => {
      console.log(`🚀 Servidor completo iniciado en puerto ${this.port}`);
      console.log(`📱 Frontend: http://localhost:${this.port}`);
      console.log(`💬 WebSocket: ws://localhost:${this.port}/ws`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  }
}

// Iniciar servidor en producción
if (process.env.NODE_ENV === 'production') {
  const server = new ProductionServer();
  server.start();
} else {
  console.log('Usar npm run dev:full para desarrollo');
}