import { Server } from 'socket.io';
import { env } from '../config/env.js';
import { verifyAccessToken } from '../utils/tokens.js';

let io = null;

/**
 * Attach Socket.io to the HTTP server.
 * - Authenticates each socket via the access token in the handshake.
 * - Auto-joins a personal room (`user:<id>`) for notifications.
 * - Lets clients join/leave thread + course rooms for live updates.
 */
export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: env.clientUrl, credentials: true },
  });

  // Auth handshake: client passes { auth: { token } }.
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('No auth token'));
    try {
      const payload = verifyAccessToken(token);
      socket.data.userId = payload.sub;
      socket.data.role = payload.role;
      next();
    } catch {
      next(new Error('Invalid auth token'));
    }
  });

  io.on('connection', (socket) => {
    const { userId } = socket.data;
    socket.join(`user:${userId}`); // personal notification room

    socket.on('thread:join', (threadId) => threadId && socket.join(`thread:${threadId}`));
    socket.on('thread:leave', (threadId) => threadId && socket.leave(`thread:${threadId}`));
    socket.on('course:join', (courseId) => courseId && socket.join(`course:${courseId}`));
    socket.on('course:leave', (courseId) => courseId && socket.leave(`course:${courseId}`));
  });

  console.log('🔌 Socket.io ready');
  return io;
}

export const getIO = () => io;

/* ------------------------------- emit helpers ------------------------------- */

export function emitToUser(userId, event, payload) {
  io?.to(`user:${userId}`).emit(event, payload);
}
export function emitToThread(threadId, event, payload) {
  io?.to(`thread:${threadId}`).emit(event, payload);
}
export function emitToCourse(courseId, event, payload) {
  io?.to(`course:${courseId}`).emit(event, payload);
}
