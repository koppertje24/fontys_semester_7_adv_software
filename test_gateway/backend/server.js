const WebSocket = require('ws');
const port = process.env.PORT || 8080;

const wss = new WebSocket.Server({ port });

console.log(`WebSocket server running on port ${port}`);

wss.on('connection', (ws) => {
  console.log('Client connected');
  
  ws.send('Welcome! Connected to backend via Kong');
  
  ws.on('message', (message) => {
    console.log('Received:', message.toString());
    ws.send(`Echo: ${message}`);
  });
  
  ws.on('close', () => {
    console.log('Client disconnected');
  });
});