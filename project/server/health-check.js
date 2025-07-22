// Health check endpoint para Railway
const http = require('http');

const server = http.createServer((req, res) => {
  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      service: 'websocket-chat-server'
    }));
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

const healthPort = process.env.HEALTH_PORT || 3001;
server.listen(healthPort, () => {
  console.log(`Health check server running on port ${healthPort}`);
});

module.exports = server;