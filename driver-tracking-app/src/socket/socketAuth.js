import jwt from "jsonwebtoken";
import User from "../model/User.js";
import Driver from "../model/Driver.js";

/**
 * Socket.IO middleware: verifies the JWT sent in the connection handshake
 * (auth.token) and attaches the authenticated user (and driver profile, if
 * any) to the socket. Every downstream handler reads identity from
 * socket.user / socket.driver - never from data the client sends in an
 * event payload.
 */
export async function socketAuthMiddleware(socket, next) {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) return next(new Error("Authentication required."));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.sub);
    if (!user || !user.isActive) return next(new Error("Invalid or inactive account."));

    socket.user = user;

    if (user.role === "driver") {
      socket.driver = await Driver.findOne({ userId: user._id });
    }

    next();
  } catch {
    next(new Error("Invalid or expired token."));
  }
}

export default socketAuthMiddleware;
