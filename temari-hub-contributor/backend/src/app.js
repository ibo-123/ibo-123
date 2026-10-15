const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

function createApp() {
  const app = express();

  app.use(
    cors({
      origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
    }),
  );
  app.use(express.json({ limit: '2mb' }));
  app.use('/api', routes);
  app.use(notFound);
  app.use(errorHandler);

  return app;
}


module.exports = createApp;
