import { createApp } from './app';
import { testDbConnection } from './config/db';
import db from './config/db';

const PORT = parseInt(process.env.PORT || '5000', 10);

async function startServer() {
  try {
    // Test database connection
    const isConnected = await testDbConnection();
    
    if (!isConnected) {
      console.error('❌ Failed to connect to database. Exiting...');
      process.exit(1);
    }

    console.log('🔌 Creating Express app...');
    // Pass the database connection to createApp
    const app = createApp(db);

    console.log(`🚀 Starting server on port ${PORT}...`);
    const server = app.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
      console.log(`💚 Health check: http://localhost:${PORT}/health`);
    });

    // Graceful shutdown
    const shutdown = () => {
      console.log('\n🛑 Shutting down server...');
      server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

    return server;
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();

export default startServer;