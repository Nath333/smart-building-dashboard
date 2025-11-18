import { Router, Request, Response, NextFunction } from 'express';
import { BuildingDataService } from '../services/buildingDataService';
import { logger } from '../utils/logger';
import { validators, ValidationError } from '../utils/validators';

const router = Router();

/**
 * Error handler wrapper for async routes
 */
type AsyncRouteHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

const asyncHandler = (fn: AsyncRouteHandler) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Get complete building data
router.get('/data', asyncHandler(async (req: Request, res: Response) => {
  logger.info('GET /api/building/data');
  const data = await BuildingDataService.getBuildingData();
  res.json({ success: true, data });
}));

// Get building status
router.get('/status', asyncHandler(async (req: Request, res: Response) => {
  logger.info('GET /api/building/status');
  const status = await BuildingDataService.getBuildingStatus();
  res.json({ success: true, data: status });
}));

// Get energy data
router.get('/energy/current', asyncHandler(async (req: Request, res: Response) => {
  logger.info('GET /api/building/energy/current');
  const energy = await BuildingDataService.getCurrentEnergy();
  res.json({ success: true, data: energy });
}));

// Get historical energy data
router.get('/energy/history', asyncHandler(async (req: Request, res: Response) => {
  logger.info('GET /api/building/energy/history');
  const history = await BuildingDataService.getEnergyHistory();
  res.json({ success: true, data: history });
}));

// Get temperature data
router.get('/temperature/week', asyncHandler(async (req: Request, res: Response) => {
  logger.info('GET /api/building/temperature/week');
  const temperature = await BuildingDataService.getTemperatureWeek();
  res.json({ success: true, data: temperature });
}));

// Get environmental data
router.get('/environmental/current', asyncHandler(async (req: Request, res: Response) => {
  logger.info('GET /api/building/environmental/current');
  const environmental = await BuildingDataService.getEnvironmentalData();
  res.json({ success: true, data: environmental });
}));

// Get devices status
router.get('/devices', asyncHandler(async (req: Request, res: Response) => {
  logger.info('GET /api/building/devices');
  const devices = await BuildingDataService.getDevices();
  res.json({ success: true, data: devices });
}));

// Update device status
router.patch('/devices/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { isConnected } = req.body;

  logger.info(`PATCH /api/building/devices/${id}`);

  // Validate device ID
  if (!validators.isValidDeviceId(id)) {
    throw new ValidationError('Invalid device ID format');
  }

  // Validate isConnected
  if (!validators.isBoolean(isConnected)) {
    throw new ValidationError('isConnected must be a boolean');
  }

  await BuildingDataService.updateDeviceStatus(id, isConnected);
  res.json({ success: true, message: 'Device status updated' });
}));

export default router;
