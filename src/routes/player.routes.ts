import { Router } from 'express';
import type { Request, Response } from 'express';
import { relayerService } from '../services/relayer.service.js';

const router = Router();

/**
 * GET /player/:id
 * Get player position data
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;

    if (!id || Array.isArray(id)) {
      return res.status(400).json({ error: 'Player position ID required' });
    }

    const positionData = await relayerService.getPlayerPosition(id);

    res.json({
      success: true,
      position: positionData,
    });
  } catch (error: any) {
    console.error('Get player position error:', error);
    res.status(404).json({ error: error.message || 'Player position not found' });
  }
});

export default router;
