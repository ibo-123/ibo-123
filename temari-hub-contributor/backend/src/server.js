const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../.env');
const hasEnvFile = fs.existsSync(envPath);

// Managed hosts such as DigitalOcean App Platform inject configuration straight into the
// process and deploy no .env file. override:false keeps those platform values authoritative
// whenever a local .env is also present.
require('dotenv').config({ path: envPath, override: false, quiet: true });

const createApp = require('./app');
const connectDB = require('./config/db');
const { startDeadlineReminders } = require('./services/notificationService');
const { logEmailConfig } = require('./services/emailService');

const PORT = process.env.PORT || 5000;

function logBootDiagnostics() {
  console.log(`[Boot] NODE_ENV: ${process.env.NODE_ENV || 'development'} | PORT: ${PORT}`);
  console.log(`[Boot] Local .env: ${hasEnvFile ? `loaded from ${envPath}` : 'not present, using platform environment variables'}`);
  console.log(`[Boot] CORS origin: ${process.env.CLIENT_ORIGIN || 'http://localhost:5173 (default)'}`);
  logEmailConfig();
}

logBootDiagnostics();

connectDB()
  .then(() => {
    const app = createApp();
    startDeadlineReminders();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  });
