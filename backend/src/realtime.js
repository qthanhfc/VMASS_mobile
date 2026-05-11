const { Server } = require('socket.io');

let ioInstance = null;

function initRealtime(httpServer) {
  ioInstance = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    },
    transports: ['websocket', 'polling'],
  });

  ioInstance.on('connection', (socket) => {
    socket.emit('realtime:connected', {
      serverTime: new Date().toISOString(),
      message: 'Connected to VMASS realtime',
    });
  });

  return ioInstance;
}

function emitRealtimeEvent(scope, action, payload = {}) {
  if (!ioInstance) return;

  const event = {
    eventId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    scope,
    action,
    schemaVersion: '1.0',
    timestamp: new Date().toISOString(),
    payload,
  };

  ioInstance.emit('vmass:data-changed', event);
  ioInstance.emit(`vmass:${scope}`, event);
}

module.exports = {
  initRealtime,
  emitRealtimeEvent,
};

