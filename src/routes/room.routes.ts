import { Router } from 'express';
import type { Request, Response } from 'express';
import { relayerService } from '../services/relayer.service.js';
import { roomStoreService } from '../services/room-store.service.js';

const router = Router();

/**
 * GET /room
 * List all rooms
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const allRooms = await roomStoreService.getAllRooms();

    res.json({
      success: true,
      rooms: allRooms,
      count: allRooms.length,
    });
  } catch (error: any) {
    console.error('List rooms error:', error);
    res.status(500).json({ error: error.message || 'Failed to list rooms' });
  }
});

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

    // Extract created room ID from transaction effects
    let roomId: string | undefined;
    let vaultId: string | undefined;

    // Extract from effects.created array
    // The smart contract creates Room first, then Vault
    if (result.effects?.created && result.effects.created.length >= 2) {
      roomId = result.effects.created[0].reference.objectId;
      vaultId = result.effects.created[1].reference.objectId;
      console.log('✓ Room created:', roomId);
      console.log('✓ Vault created:', vaultId);
    } else {
      console.error('⚠️ Expected 2 created objects (Room + Vault), got:', result.effects?.created?.length);
    }

    // Save room to store
    if (roomId) {
      const roomData: any = {
        roomId,
        creatorAddress: '(gasless)',
        totalPeriods: parseInt(totalPeriods),
        depositAmount: parseInt(depositAmount),
        strategyId: parseInt(strategyId),
        startTimeMs: parseInt(startTimeMs),
        periodLengthMs: parseInt(periodLengthMs),
        createdAt: Date.now(),
        transactionDigest: result.digest,
      };

      if (vaultId) {
        roomData.vaultId = vaultId;
      }

      await roomStoreService.addRoom(roomData);

      console.log('Room stored:', { roomId, vaultId });
    }

    res.json({
      success: result.success,
      digest: result.digest,
      effects: result.effects,
      roomId,
      vaultId,
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
    const { roomId, vaultId, coinObjectId, clockId, userAddress } = req.body;

    if (!roomId || !vaultId || !coinObjectId || !clockId || !userAddress) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await relayerService.joinRoom({
      roomId,
      vaultId,
      coinObjectId,
      clockId,
      userAddress,
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
 * Get room data (blockchain + database)
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;

    console.log('GET /room/:id - Request received:', { id });

    if (!id || Array.isArray(id)) {
      return res.status(400).json({
        error: 'Room ID required',
        hint: 'Please provide a valid Sui object ID (e.g., 0x123abc...)'
      });
    }

    // Validasi format dasar
    if (id.length < 10) {
      return res.status(400).json({
        error: 'Invalid Room ID format',
        hint: 'Room ID should be a valid Sui object ID (minimum 10 characters)'
      });
    }

    // Fetch from database first to get vaultId
    const dbRoom = await roomStoreService.getRoom(id);

    // Fetch blockchain data
    const roomData = await relayerService.getRoomData(id);

    // Merge database data with blockchain data
    const mergedData = {
      ...roomData,
      vaultId: dbRoom?.vaultId || null,
      transactionDigest: dbRoom?.transactionDigest || null,
    };

    console.log('✓ Room data merged:', { roomId: id, vaultId: mergedData.vaultId });

    res.json({
      success: true,
      room: mergedData,
    });
  } catch (error: any) {
    console.error('Get room error:', error);
    res.status(404).json({
      error: error.message || 'Room not found',
      hint: 'Make sure the room has been created on the blockchain first'
    });
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
