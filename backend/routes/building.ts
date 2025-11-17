import { Router, Request, Response } from 'express';
import { BuildingDataService } from '../services/buildingDataService';

const router = Router();

// Get complete building data
router.get('/data', async (req: Request, res: Response) => {
  try {
    const data = await BuildingDataService.getBuildingData();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch building data' });
  }
});

// Get building status
router.get('/status', async (req: Request, res: Response) => {
  try {
    const status = await BuildingDataService.getBuildingStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch building status' });
  }
});

// Get energy data
router.get('/energy/current', async (req: Request, res: Response) => {
  try {
    const energy = await BuildingDataService.getCurrentEnergy();
    res.json(energy);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch current energy data' });
  }
});

// Get historical energy data
router.get('/energy/history', async (req: Request, res: Response) => {
  try {
    const history = await BuildingDataService.getEnergyHistory();
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch energy history' });
  }
});

// Get temperature data
router.get('/temperature/week', async (req: Request, res: Response) => {
  try {
    const temperature = await BuildingDataService.getTemperatureWeek();
    res.json(temperature);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch temperature data' });
  }
});

// Get environmental data
router.get('/environmental/current', async (req: Request, res: Response) => {
  try {
    const environmental = await BuildingDataService.getEnvironmentalData();
    res.json(environmental);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch environmental data' });
  }
});

// Get devices status
router.get('/devices', async (req: Request, res: Response) => {
  try {
    const devices = await BuildingDataService.getDevices();
    res.json(devices);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch devices data' });
  }
});

// Update device status
router.patch('/devices/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isConnected } = req.body;
    await BuildingDataService.updateDeviceStatus(id, isConnected);
    res.json({ success: true, message: 'Device status updated' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update device status' });
  }
});

export default router;
