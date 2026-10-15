import { io } from "socket.io-client";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

const token =
  localStorage.getItem("token");

const socket = io(API_URL, {
  auth: {
    token,
  },
  transports: ["polling", "websocket"],
});

console.log("🔌 Socket server:", API_URL);
console.log(
  "🔐 JWT available:",
  Boolean(token)
);

export default socket;