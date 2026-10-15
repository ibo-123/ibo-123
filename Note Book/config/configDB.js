const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.DATABASE_URL, {
            serverSelectionTimeoutMS: 50000 // optional, increase timeout if needed
        });
        console.log("MongoDB connection successful");
    } catch (err) {
        console.error("MongoDB connection error:", err);
    }
};

module.exports = connectDB;
