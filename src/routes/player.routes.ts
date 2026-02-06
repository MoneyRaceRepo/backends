import { Router } from 'express';
import type { Request, Response } from 'express';
import { relayerService } from '../services/relayer.service.js';
import { sendSuccess, sendValidationError, sendNotFound } from '../utils/response.js';

const router = Router();

/**
 * GET /player/:id
 * Get player position data
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;

    if (!id || Array.isArray(id)) {
      return sendValidationError(res, 'Player position ID required');
    }

    const positionData = await relayerService.getPlayerPosition(id);

    return sendSuccess(res, { position: positionData });
  } catch (error: any) {
    console.error('Get player position error:', error);
    return sendNotFound(res, 'Player position');
  }
});

export default router;
