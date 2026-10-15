import Notification from "../model/Notification.js";

let ioInstance = null;

/** Called once from server.js after Socket.IO is initialized. */
export function attachSocketServer(io) {
  ioInstance = io;
}

/**
 * Creates a notification in the DB and, if a Socket.IO server is attached,
 * pushes it live to the user's personal room ("user:<userId>").
 */
export async function notifyUser(userId, { type, title, message, metadata = {} }) {
  const notification = await Notification.create({ userId, type, title, message, metadata });

  if (ioInstance) {
    ioInstance.to(`user:${userId}`).emit("notification:new", notification);
  }

  return notification;
}

export default { attachSocketServer, notifyUser };
