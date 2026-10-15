import { Server } from "socket.io";
import socketAuthMiddleware from "./socketAuth.js";
import registerDriverHandlers from "./driverHandlers.js";
import registerCustomerHandlers from "./customerHandlers.js";
import { attachSocketServer } from "../services/notificationService.js";

/**
 * Initializes Socket.IO on top of the given HTTP server.
 * CORS origins mirror the Express CORS config so both REST and realtime
 * traffic accept the same set of dev origins (localhost + LAN IP).
 */
export function initSocket(httpServer, allowedOrigins) {
  const io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
    },
  });

  io.use(socketAuthMiddleware);

  io.on("connection", (socket) => {
    // Personal room for direct-to-user pushes (notifications).
    socket.join(`user:${socket.user._id}`);

    registerDriverHandlers(io, socket);
    registerCustomerHandlers(io, socket);
  });

  attachSocketServer(io);

  return io;
}

export default initSocket;
