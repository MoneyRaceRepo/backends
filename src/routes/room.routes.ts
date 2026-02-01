import { Router } from 'express';
import type { Request, Response } from 'express';
import { relayerService } from '../services/relayer.service.js';

const router = Router();

/**
 * POST /room/create
 * Create a new saving room
 */
router.post('/create', async (req: Request, res: Response) => {
  try {
    const { totalPeriods, depositAmount, strategyId, startTimeMs, periodLengthMs } = req.body;

    // Validation
    if (!totalPeriods || !depositAmount || strategyId === undefined || !startTimeMs || !periodLengthMs) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create room transaction
    const result = await relayerService.createRoom({
      totalPeriods: parseInt(totalPeriods),
      depositAmount: parseInt(depositAmount),
      strategyId: parseInt(strategyId),
      startTimeMs: parseInt(startTimeMs),
      periodLengthMs: parseInt(periodLengthMs),
    });

    res.json({
      success: result.success,
      digest: result.digest,
      effects: result.effects,
    });
  } catch (error: any) {
    console.error('Create room error:', error);
    res.status(500).json({ error: error.message || 'Failed to create room' });
  }
});

/**
 * POST /room/start
 * Start a room (Admin only)
 */
router.post('/start', async (req: Request, res: Response) => {
  try {
    const { roomId } = req.body;

    if (!roomId) {
      return res.status(400).json({ error: 'Room ID required' });
    }

    const result = await relayerService.startRoom(roomId);

    res.json({
      success: result.success,
      digest: result.digest,
    });
  } catch (error: any) {
    console.error('Start room error:', error);
    res.status(500).json({ error: error.message || 'Failed to start room' });
  }
});

/**
 * POST /room/join
 * Join a room
 */
router.post('/join', async (req: Request, res: Response) => {
  try {
    const { roomId, vaultId, coinObjectId, clockId } = req.body;

    if (!roomId || !vaultId || !coinObjectId || !clockId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await relayerService.joinRoom({
      roomId,
      vaultId,
      coinObjectId,
      clockId,
    });

    res.json({
      success: result.success,
      digest: result.digest,
      effects: result.effects,
    });
  } catch (error: any) {
    console.error('Join room error:', error);
    res.status(500).json({ error: error.message || 'Failed to join room' });
  }
});

/**
 * POST /room/deposit
 * Make a deposit
 */
router.post('/deposit', async (req: Request, res: Response) => {
  try {
    const { roomId, vaultId, playerPositionId, coinObjectId, clockId } = req.body;

    if (!roomId || !vaultId || !playerPositionId || !coinObjectId || !clockId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await relayerService.deposit({
      roomId,
      vaultId,
      playerPositionId,
      coinObjectId,
      clockId,
    });

    res.json({
      success: result.success,
      digest: result.digest,
      effects: result.effects,
    });
  } catch (error: any) {
    console.error('Deposit error:', error);
    res.status(500).json({ error: error.message || 'Failed to deposit' });
  }
});

/**
 * POST /room/claim
 * Claim rewards
 */
router.post('/claim', async (req: Request, res: Response) => {
  try {
    const { roomId, vaultId, playerPositionId } = req.body;

    if (!roomId || !vaultId || !playerPositionId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await relayerService.claimAll({
      roomId,
      vaultId,
      playerPositionId,
    });

    res.json({
      success: result.success,
      digest: result.digest,
      effects: result.effects,
    });
  } catch (error: any) {
    console.error('Claim error:', error);
    res.status(500).json({ error: error.message || 'Failed to claim' });
  }
});

/**
 * GET /room/:id
 * Get room data
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;

    if (!id || Array.isArray(id)) {
      return res.status(400).json({ error: 'Room ID required' });
    }

    const roomData = await relayerService.getRoomData(id);

    res.json({
      success: true,
      room: roomData,
    });
  } catch (error: any) {
    console.error('Get room error:', error);
    res.status(404).json({ error: error.message || 'Room not found' });
  }
});

/**
 * POST /room/finalize
 * Finalize room (Admin only)
 */
router.post('/finalize', async (req: Request, res: Response) => {
  try {
    const { roomId } = req.body;

    if (!roomId) {
      return res.status(400).json({ error: 'Room ID required' });
    }

    const result = await relayerService.finalizeRoom(roomId);

    res.json({
      success: result.success,
      digest: result.digest,
    });
  } catch (error: any) {
    console.error('Finalize room error:', error);
    res.status(500).json({ error: error.message || 'Failed to finalize room' });
  }
});

/**
 * POST /room/fund-reward
 * Fund reward pool (Admin only)
 */
router.post('/fund-reward', async (req: Request, res: Response) => {
  try {
    const { vaultId, coinObjectId } = req.body;

    if (!vaultId || !coinObjectId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await relayerService.fundRewardPool({
      vaultId,
      coinObjectId,
    });

    res.json({
      success: result.success,
      digest: result.digest,
    });
  } catch (error: any) {
    console.error('Fund reward error:', error);
    res.status(500).json({ error: error.message || 'Failed to fund reward pool' });
  }
});

export default router;
