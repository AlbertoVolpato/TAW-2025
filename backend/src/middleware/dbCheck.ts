import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';

// Middleware to check database connection
export const checkDatabaseConnection = (req: Request, res: Response, next: NextFunction): void => {
  // Skip database check for health endpoint
  if (req.path === '/health') {
    next();
    return;
  }

  // Check if mongoose is connected
  if (mongoose.connection.readyState !== 1) {
    res.status(503).json({
      success: false,
      message: 'Database not available',
      error: 'MongoDB connection is not established. Please start MongoDB or use Docker.',
      hint: 'Run `docker compose up -d mongodb` or start MongoDB locally'
    });
    return;
  }

  next();
};