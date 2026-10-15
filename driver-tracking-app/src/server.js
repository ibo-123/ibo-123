import "dotenv/config";
import http from "http";

import { connectDatabase } from "./config/database.js";
import createApp from "./app.js";
import { initSocket } from "./socket/index.js";

/**
 * CLIENT_URL is a comma-separated list of allowed frontend origins, e.g.:
 *   CLIENT_URL=http://localhost:5173,http://127.0.0.1:5173,http://10.2.84.27:5173
 * Include your PC's LAN IP here so a phone on the same Wi-Fi/hotspot can
 * reach both the REST API and the Socket.IO server. Never hard-code
 * "localhost" as the only origin - it will reject phone connections.
 */
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

async function start() {
  await connectDatabase();

  const app = createApp(allowedOrigins);
  const httpServer = http.createServer(app);

  initSocket(httpServer, allowedOrigins);

  const PORT = process.env.PORT || 5000;

  // Bind to 0.0.0.0 (not "localhost") so devices on the same local network,
  // like a driver's or customer's phone, can reach this server via the
  // machine's LAN IP (e.g. http://10.2.84.27:5000).
  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Freight tracking API listening on 0.0.0.0:${PORT}`);
    console.log(`Allowed client origins: ${allowedOrigins.join(", ")}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});

process.on("unhandledRejection", (err) => {
  console.error("Unhandled promise rejection:", err);
});
