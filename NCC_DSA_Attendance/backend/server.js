// server.js
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const authRoutes = require("./route/authRoutes");
const userRoutes = require("./route/userRoutes");
const courseRoutes = require("./route/courseRoutes");
const attendanceRoutes = require("./route/attendanceRoutes");
const errorMiddleware = require("./middleware/errorMiddleware");

const app = express();
app.use(cors());
app.use(express.json());

const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/attendance_system";
mongoose
  .connect(mongoUri)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

if (!process.env.JWT_SECRET) {
  console.warn("Warning: JWT_SECRET is not set. Set it in .env for secure tokens.");
}

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/attendance", attendanceRoutes);

app.use(errorMiddleware);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 
