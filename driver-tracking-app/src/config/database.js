import mongoose from "mongoose";

/**
 * Connects to MongoDB using the URI from environment variables.
 * Exits the process on failure since the API cannot function without a DB.
 */
export async function connectDatabase() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error("MONGO_URI is not set. Add it to your .env file.");
    process.exit(1);
  }

  mongoose.set("strictQuery", true);

  try {
    await mongoose.connect(uri);
    console.log(`MongoDB connected: ${mongoose.connection.host}`);
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    process.exit(1);
  }

  mongoose.connection.on("disconnected", () => {
    console.warn("MongoDB disconnected");
  });

  mongoose.connection.on("error", (err) => {
    console.error("MongoDB error:", err.message);
  });
}

export default connectDatabase;
