import mongoose from "mongoose";

let mongod;
let usingInMemory = false;

/**
 * Connects to MongoDB using the URI from environment variables.
 * If no URI is provided and we're not in production, an in-memory
 * MongoDB instance will be started for local development/testing.
 */
export async function connectDatabase() {
  let uri = process.env.MONGO_URI;

  if (!uri && process.env.NODE_ENV !== "production") {
    try {
      const { MongoMemoryServer } = await import("mongodb-memory-server");
      mongod = await MongoMemoryServer.create();
      uri = mongod.getUri();
      usingInMemory = true;
      console.warn("No MONGO_URI set: using in-memory MongoDB for development/testing.");
    } catch (err) {
      console.error("Failed to start in-memory MongoDB:", err);
      process.exit(1);
    }
  }

  if (!uri) {
    console.error("MONGO_URI is not set. Add it to your .env file.");
    process.exit(1);
  }

  mongoose.set("strictQuery", true);

  try {
    await mongoose.connect(uri);
    console.log(`MongoDB connected: ${mongoose.connection.host || uri}`);
  } catch (error) {
    console.error("MongoDB connection error:", error.message || error);
    if (usingInMemory && mongod) await mongod.stop();
    process.exit(1);
  }

  mongoose.connection.on("disconnected", () => {
    console.warn("MongoDB disconnected");
  });

  mongoose.connection.on("error", (err) => {
    console.error("MongoDB error:", err.message || err);
  });

  if (usingInMemory && mongod) {
    const stop = async () => {
      try {
        await mongoose.disconnect();
        await mongod.stop();
        console.log("In-memory MongoDB stopped");
      } catch (e) {
        /* ignore */
      }
      process.exit(0);
    };
    process.on("SIGINT", stop);
    process.on("SIGTERM", stop);
    process.on("exit", stop);
  }
}

export default connectDatabase;
