import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import buildingRouter from './routes/building';
import { logger } from './utils/logger';
import { ValidationError } from './utils/validators';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  logger.debug(`${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/building', buildingRouter);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Error occurred:', err);

  // Handle validation errors
  if (err instanceof ValidationError) {
    return res.status(400).json({
      success: false,
      error: err.message
    });
  }

  // Handle generic errors
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message
  });
});

app.listen(PORT, () => {
  logger.info(`🚀 Backend server running on http://localhost:${PORT}`);
  logger.info(`📊 API available at http://localhost:${PORT}/api`);
  logger.info(`🏥 Health check at http://localhost:${PORT}/health`);
});

export default app;
