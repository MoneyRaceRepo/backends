import { Router } from 'express';
import type { Request, Response } from 'express';
import { relayerService } from '../services/relayer.service.js';
import { eventService } from '../services/event.service.js';
import { sendSuccess, sendValidationError, sendNotFound, sendError } from '../utils/response.js';

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

/**
 * GET /player/:address/deposits
 * Get deposit history for a player with enriched amount data
 * Query param: roomId (optional) to filter by specific room
 */
router.get('/:address/deposits', async (req: Request, res: Response) => {
  try {
    const address = req.params.address;
    const roomId = req.query.roomId as string | undefined;

    if (!address || Array.isArray(address)) {
      return sendValidationError(res, 'Player address required');
    }

    const deposits = await eventService.getUserDepositHistory(address, roomId);

    return sendSuccess(res, {
      deposits,
      count: deposits.length,
    });
  } catch (error: any) {
    console.error('Get deposit history error:', error);
    return sendError(res, error.message || 'Failed to get deposit history');
  }
});

export default router;
