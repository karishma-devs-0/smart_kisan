const { Server } = require('socket.io');

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*',
    },
  });

  io.on('connection', (socket) => {
    console.log('User Connected:', socket.id);

    socket.on('disconnect', () => {
      console.log('User Disconnected:', socket.id);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }

  return io;
};

module.exports = {
  initSocket,
  getIO,
};
