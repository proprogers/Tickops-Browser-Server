const ws = require('ws');

const webSocketsMap = new Map();

const wsServer = new ws.Server({ noServer: true });

wsServer.on('connection', (socket) => {
  socket.on('message', (data) => {
    if (!data) return;
    const userId = data.toString();
    webSocketsMap.set(userId, socket);
    socket.on('close', () => webSocketsMap.delete(userId));
  });
});

function onUpgradeServer(request, socket, head) {
  wsServer.handleUpgrade(request, socket, head, (socket) => {
    wsServer.emit('connection', socket, request);
  });
}

function sendMessage({ userId, value }) {
  const ws = webSocketsMap.get(userId);
  if (!ws) {
    webSocketsMap.delete(userId);
    throw new Error(`No ws for the ${userId}`);
  }
  ws.send(JSON.stringify(value));
}

module.exports = { onUpgradeServer, sendMessage };
