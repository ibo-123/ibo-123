// backend/tests/setup.js
const mongoose = require("mongoose");
const { ConnectionString } = require("mongodb-connection-string-url");

function buildTestUri() {
        const base =
                process.env.MONGODB_URI ||
                process.env.MONGO_URI ||
                "mongodb://localhost:27017/code-arena";

        // Each node --test process gets its own DB, so parallel files never clash.
        const suffix = `code-arena-test-${process.pid}`;

        const parsed = new ConnectionString(base);
        parsed.pathname = `/${suffix}`;
        return parsed.toString();
}

async function connect() {
        await mongoose.connect(buildTestUri());
        console.log(`✅ Connected: ${mongoose.connection.name}`);
}

async function disconnect() {
        try {
                await mongoose.connection.dropDatabase();
        } catch {
                // ignore — DB may already be gone
        }
        await mongoose.disconnect();
}

async function clearDatabase() {
        const collections = mongoose.connection.collections;
        for (const key of Object.keys(collections)) {
                await collections[key].deleteMany({});
        }
}

module.exports = { connect, disconnect, clearDatabase };