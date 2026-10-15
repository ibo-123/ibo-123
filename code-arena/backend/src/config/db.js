const mongoose = require("mongoose");

const connectDB = async (uri = process.env.MONGO_URI) => {
  try {
    if (!uri) throw new Error("MongoDB connection URI is required");
    await mongoose.connect(uri);

    console.log("✅ MongoDB connected");
  } catch (error) {
    console.error("❌ MongoDB connection failed:");
    console.error(error.message);

    process.exit(1);
  }
};

module.exports = connectDB;
