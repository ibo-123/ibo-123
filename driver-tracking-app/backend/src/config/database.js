const mongoose = require("mongoose");

const connectDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
      throw new Error("MONGODB_URI is not defined in .env");
    }

    await mongoose.connect(mongoUri);

    console.log("✅ MongoDB connected");
  } catch (error) {
    console.error(
      "❌ MongoDB connection failed:",
      error.message
    );

    process.exit(1);
  }
};

module.exports = connectDatabase;