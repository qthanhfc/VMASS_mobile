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

    // Room management — clients join a room identified by their userId
    // so events can be scoped per user/shop when needed.
    socket.on('join room', (data) => {
      const roomId = data && data.room_id;
      if (roomId) {
        socket.join(String(roomId));
      }
    });

    socket.on('leave room', (data) => {
      const roomId = data && data.room_id;
      if (roomId) {
        socket.leave(String(roomId));
      }
    });
  });

  return ioInstance;
}

/**
 * Emit a realtime event to connected clients.
 *
 * @param {string} scope   - Data scope (e.g. 'orders', 'products', 'messages')
 * @param {string} action  - What happened (e.g. 'created', 'updated', 'deleted')
 * @param {object} payload - Optional data payload
 * @param {string|null} roomId - If provided, emit only to clients in this room;
 *                               otherwise broadcast to all connected clients.
 */
function emitRealtimeEvent(scope, action, payload = {}, roomId = null) {
  if (!ioInstance) return;

  const event = {
    eventId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    scope,
    action,
    schemaVersion: '1.0',
    timestamp: new Date().toISOString(),
    payload,
  };

  if (roomId) {
    ioInstance.to(String(roomId)).emit('vmass:data-changed', event);
    ioInstance.to(String(roomId)).emit(`vmass:${scope}`, event);
  } else {
    ioInstance.emit('vmass:data-changed', event);
    ioInstance.emit(`vmass:${scope}`, event);
  }
}

module.exports = {
  initRealtime,
  emitRealtimeEvent,
};
