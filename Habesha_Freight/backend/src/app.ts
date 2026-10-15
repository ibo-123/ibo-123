import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import type { Knex } from 'knex';

import db from './config/db';
import authRoutes from './routes/authRoutes';
import { createAdminRouter } from './routes/adminRoutes';
import loadRoutes from './routes/loadRoutes';
import bidRoutes from './routes/bidRoutes';
import vehicleRoutes from './routes/vehicleRoutes';
import shipmentRoutes from './routes/shipmentRoutes';
import escrowRoutes from './routes/escrowRoutes';
import trackingRoutes from './routes/trackingRoutes';
import disputeRoutes from './routes/disputeRoutes';
import reviewRoutes from './routes/reviewRoutes';
import messageRoutes from './routes/messageRoutes';
import driverRoutes from './routes/driverRoutes';
import shipperRoutes from './routes/shipperRoutes';
import companyRoutes from './routes/companyRoutes';

dotenv.config();

export function createApp(database: Knex = db): Express {
  const app = express();

  // Security middleware with cross-origin resource policy allowed for media/uploads
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Serve uploaded files & documents statically
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // Health check endpoint
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({ 
      success: true, 
      message: 'API is healthy.', 
      data: { 
        status: 'ok',
        timestamp: new Date().toISOString()
      } 
    });
  });

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/drivers', driverRoutes);
  app.use('/api/driver', driverRoutes);
  app.use('/api/shipper', shipperRoutes);
  app.use('/api/company', companyRoutes);
  app.use('/api/admin', createAdminRouter(database));
  app.use('/api/loads', loadRoutes);
  app.use('/api/bids', bidRoutes);
  app.use('/api/vehicles', vehicleRoutes);
  app.use('/api/shipments', shipmentRoutes);
  app.use('/api/escrow', escrowRoutes);
  app.use('/api/tracking', trackingRoutes);
  app.use('/api/disputes', disputeRoutes);
  app.use('/api/reviews', reviewRoutes);
  app.use('/api/messages', messageRoutes);

  // 404 handler
  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      message: 'Route not found.',
      error: { code: 'NOT_FOUND' },
    });
  });

  // Global Error Handler
  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Error:', error);
    
    if (error instanceof Error) {
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token.',
          error: { code: 'INVALID_TOKEN' },
        });
      }
      
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expired.',
          error: { code: 'TOKEN_EXPIRED' },
        });
      }

      return res.status(500).json({
        success: false,
        message: error.message || 'Internal server error.',
        error: { code: error.name.toUpperCase() || 'INTERNAL_ERROR' },
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error.',
      error: { code: 'UNKNOWN_ERROR' },
    });
  });

  return app;
}