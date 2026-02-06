import { Router } from 'express';
import type { Request, Response } from 'express';
import { relayerService } from '../services/relayer.service.js';
import { roomStoreService } from '../services/room-store.service.js';
import { sponsorKeypair } from '../sui/sponsor.js';
import { suiClient } from '../sui/client.js';
import { keccak_256 } from '@noble/hashes/sha3.js';

const router = Router();

/**
 * GET /room/sponsor
 * Get sponsor address for building sponsored transactions
 */
router.get('/sponsor', async (req: Request, res: Response) => {
  try {
    const sponsorAddress = sponsorKeypair.toSuiAddress();
    res.json({
      success: true,
      sponsorAddress,
    });
  } catch (error: any) {
    console.error('Get sponsor error:', error);
    res.status(500).json({ error: error.message || 'Failed to get sponsor' });
  }
});

/**
 * POST /room/execute-sponsored
 * Execute a sponsored transaction (user signs, backend pays gas)
 */
router.post('/execute-sponsored', async (req: Request, res: Response) => {
  try {
    const { txBytes, userSignature } = req.body;

    if (!txBytes || !userSignature) {
      return res.status(400).json({ error: 'Missing txBytes or userSignature' });
    }

    console.log('Executing sponsored transaction...');
    console.log('txBytes length:', txBytes.length);
    console.log('userSignature:', userSignature.substring(0, 50) + '...');

    const result = await relayerService.executeSponsoredTxWithUserSignature(
      txBytes,
      userSignature
    );

    res.json({
      success: result.success,
      digest: result.digest,
      effects: result.effects,
    });
  } catch (error: any) {
    console.error('Execute sponsored error:', error);
    res.status(500).json({ error: error.message || 'Failed to execute sponsored transaction' });
  }
});

/**
 * GET /room
 * List all rooms (only public rooms are returned by default)
 * Query param: includePrivate=true to include private rooms
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const allRooms = await roomStoreService.getAllRooms();

    // Filter out private rooms by default (unless explicitly requested)
    const includePrivate = req.query.includePrivate === 'true';
    const filteredRooms = includePrivate
      ? allRooms
      : allRooms.filter(room => !room.isPrivate);

    const USDC_DECIMALS = 1_000_000;

    // Fetch totalDeposit from participant events (sum of all deposits)
    const packageId = process.env.PACKAGE_ID || '0xaa90da2945b7b5dee82c73a535f0717724b0fa58643aba43972b8e8fbc67c280';

    // Query all PlayerJoined and DepositMade events
    const [joinEvents, depositEvents] = await Promise.all([
      suiClient.queryEvents({
        query: { MoveEventType: `${packageId}::money_race_v2::PlayerJoined` },
        limit: 50,
      }),
      suiClient.queryEvents({
        query: { MoveEventType: `${packageId}::money_race_v2::DepositMade` },
        limit: 100,
      }),
    ]);

    const roomsWithTotalDeposit = filteredRooms.map((room) => {
      let totalDeposit = 0;

      // Sum deposits from PlayerJoined events for this room
      joinEvents.data
        .filter((event: any) => event.parsedJson?.room_id === room.roomId)
        .forEach((event: any) => {
          const amount = parseInt(event.parsedJson?.amount) || 0;
          totalDeposit += amount;
        });

      // Sum deposits from DepositMade events for this room
      depositEvents.data
        .filter((event: any) => event.parsedJson?.room_id === room.roomId)
        .forEach((event: any) => {
          const amount = parseInt(event.parsedJson?.amount) || 0;
          totalDeposit += amount;
        });

      // Convert from USDC decimals to regular number
      totalDeposit = totalDeposit / USDC_DECIMALS;

      return {
        ...room,
        totalDeposit, // Sum of all participant deposits
      };
    });

    res.json({
      success: true,
      rooms: roomsWithTotalDeposit,
      count: roomsWithTotalDeposit.length,
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
    const { totalPeriods, depositAmount, strategyId, startTimeMs, periodLengthMs, isPrivate } = req.body;

    // Validation
    if (!totalPeriods || !depositAmount || strategyId === undefined || !startTimeMs || !periodLengthMs) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Generate random password for private rooms
    let generatedPassword = '';
    if (isPrivate === true) {
      // Generate 8-character random password (alphanumeric)
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
      for (let i = 0; i < 8; i++) {
        generatedPassword += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      console.log('Generated password for private room:', generatedPassword);
    }

    // Create room transaction
    const result = await relayerService.createRoom({
      totalPeriods: parseInt(totalPeriods),
      depositAmount: parseInt(depositAmount),
      strategyId: parseInt(strategyId),
      startTimeMs: parseInt(startTimeMs),
      periodLengthMs: parseInt(periodLengthMs),
      isPrivate: isPrivate === true,
      password: generatedPassword,
    });

    // Extract created room ID from transaction effects
    let roomId: string | undefined;
    let vaultId: string | undefined;

    console.log('Transaction result:', JSON.stringify(result, null, 2));

    // Extract from effects.created array
    // Check type to correctly identify Room vs Vault (order may vary)
    if (result.effects?.created && result.effects.created.length >= 2) {
      console.log('Found created objects:', result.effects.created.length);

      for (const created of result.effects.created) {
        const objectId = created.reference?.objectId;
        console.log('Processing created object:', objectId, 'objectType:', created.objectType);

        // Check objectType if available in effects
        if (created.objectType) {
          if (created.objectType.includes('::Room')) {
            roomId = objectId;
            console.log('✓ Room created:', roomId);
          } else if (created.objectType.includes('::Vault')) {
            vaultId = objectId;
            console.log('✓ Vault created:', vaultId);
          }
        }
      }

      // Fallback: if objectType not in effects, we need to fetch and check
      if (!roomId || !vaultId) {
        console.log('⚠️ ObjectType not in effects, fetching objects to determine types...');

        // Wait a bit for blockchain to index the objects
        await new Promise(resolve => setTimeout(resolve, 1000));

        for (const created of result.effects.created) {
          const objectId = created.reference?.objectId;
          if (!objectId) {
            console.log('Skipping created object with no objectId');
            continue;
          }
          console.log('Fetching object:', objectId);
          try {
            const obj = await suiClient.getObject({
              id: objectId,
              options: { showType: true }
            });
            console.log('Fetched object result:', obj.data?.objectId, obj.data?.type);
            const objType = obj.data?.type || '';
            if (objType.includes('::Room')) {
              roomId = objectId;
              console.log('✓ Room created (fetched):', roomId);
            } else if (objType.includes('::Vault')) {
              vaultId = objectId;
              console.log('✓ Vault created (fetched):', vaultId);
            }
          } catch (err: any) {
            console.error('Failed to fetch object:', objectId, err.message);
          }
        }
      }
    } else {
      console.error('⚠️ Expected 2 created objects (Room + Vault), got:', result.effects?.created?.length);
      console.log('Effects:', JSON.stringify(result.effects, null, 2));
    }

    // Save room to store
    if (roomId) {
      // Compute password hash for storage (if private room)
      let passwordHashHex: string | null = null;
      if (isPrivate === true && generatedPassword) {
        const hash = keccak_256(new TextEncoder().encode(generatedPassword));
        passwordHashHex = Buffer.from(hash).toString('hex');
      }

      const roomData: any = {
        roomId,
        creatorAddress: '(gasless)',
        totalPeriods: parseInt(totalPeriods),
        depositAmount: parseInt(depositAmount),
        strategyId: parseInt(strategyId),
        isPrivate: isPrivate === true,
        passwordHash: passwordHashHex,
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

      // Auto-start the room so users can join immediately
      // Add delay to ensure object is indexed on blockchain
      try {
        console.log('Auto-starting room in 3 seconds...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        const startResult = await relayerService.startRoom(roomId);
        console.log('✓ Room auto-started:', startResult.digest);
      } catch (startError: any) {
        console.error('⚠️ Failed to auto-start room:', startError.message);
        // Continue anyway - room can be started manually later
      }
    }

    res.json({
      success: result.success,
      digest: result.digest,
      effects: result.effects,
      roomId,
      vaultId,
      // Return password only for private rooms (user must save it!)
      password: isPrivate === true ? generatedPassword : undefined,
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
 * Join a room (with user signature for sponsored transaction)
 */
router.post('/join', async (req: Request, res: Response) => {
  try {
    const { txBytes, userSignature } = req.body;

    if (!txBytes || !userSignature) {
      return res.status(400).json({ error: 'Missing txBytes or userSignature' });
    }

    const result = await relayerService.executeSponsoredTxWithUserSignature(
      txBytes,
      userSignature
    );

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
 * Make a deposit (with user signature for sponsored transaction)
 */
router.post('/deposit', async (req: Request, res: Response) => {
  try {
    const { txBytes, userSignature } = req.body;

    if (!txBytes || !userSignature) {
      return res.status(400).json({ error: 'Missing txBytes or userSignature' });
    }

    const result = await relayerService.executeSponsoredTxWithUserSignature(
      txBytes,
      userSignature
    );

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
 * Claim rewards (with user signature - since PlayerPosition is owned by user)
 */
router.post('/claim', async (req: Request, res: Response) => {
  try {
    const { txBytes, userSignature } = req.body;

    if (!txBytes || !userSignature) {
      return res.status(400).json({ error: 'Missing txBytes or userSignature' });
    }

    const result = await relayerService.executeSponsoredTxWithUserSignature(
      txBytes,
      userSignature
    );

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
 * GET /room/my-rooms/:userAddress
 * Get all rooms that a user has joined
 */
router.get('/my-rooms/:userAddress', async (req: Request, res: Response) => {
  try {
    const userAddress = req.params.userAddress;
    const packageId = process.env.PACKAGE_ID || '0xaa90da2945b7b5dee82c73a535f0717724b0fa58643aba43972b8e8fbc67c280';

    if (!userAddress) {
      return res.status(400).json({ error: 'User address required' });
    }

    console.log('Fetching rooms for user:', userAddress);

    // Query PlayerJoined events for this user
    const joinEvents = await suiClient.queryEvents({
      query: {
        MoveEventType: `${packageId}::money_race_v2::PlayerJoined`
      },
      limit: 100,
    });

    // Filter events for this specific user and extract room info
    const userRoomIds = new Set<string>();
    const roomMap = new Map<string, {
      roomId: string;
      playerPositionId: string;
      joinedAt: string;
      initialDeposit: number;
    }>();

    joinEvents.data
      .filter((event: any) => {
        const parsedJson = event.parsedJson as any;
        return parsedJson?.player === userAddress;
      })
      .forEach((event: any) => {
        const parsedJson = event.parsedJson as any;
        const roomId = parsedJson.room_id;
        userRoomIds.add(roomId);
        roomMap.set(roomId, {
          roomId,
          playerPositionId: parsedJson.player_position_id,
          joinedAt: event.timestampMs,
          initialDeposit: parseInt(parsedJson.amount) || 0,
        });
      });

    // Fetch room details from database for each room
    const roomsWithDetails = await Promise.all(
      Array.from(userRoomIds).map(async (roomId) => {
        const dbRoom = await roomStoreService.getRoom(roomId);
        const joinInfo = roomMap.get(roomId);

        console.log(`Processing room ${roomId}:`, {
          hasDbRoom: !!dbRoom,
          hasJoinInfo: !!joinInfo,
          dbRoomDepositAmount: dbRoom?.depositAmount,
          initialDeposit: joinInfo?.initialDeposit,
        });

        if (!dbRoom) {
          console.log(`⚠️ Room ${roomId} not found in database`);
          return null;
        }

        // Fetch data from blockchain (Room + Vault)
        let rewardPool = 0;
        let totalDeposit = 0;
        let blockchainDepositAmount = 0;
        let blockchainTotalPeriods = 0;
        try {
          const roomContent = await relayerService.getRoomData(roomId, dbRoom.vaultId || undefined);

          // Extract Room fields from blockchain
          if (roomContent?.fields) {
            blockchainDepositAmount = Number(roomContent.fields.deposit_amount || 0);
            blockchainTotalPeriods = Number(roomContent.fields.total_periods || 0);
            console.log(`Blockchain Room data:`, { blockchainDepositAmount, blockchainTotalPeriods });
          }

          // Extract Vault fields
          if (roomContent?.vaultData) {
            const rewardBalance = roomContent.vaultData.reward?.fields?.value || roomContent.vaultData.reward || 0;
            rewardPool = Number(rewardBalance) / 1_000_000;

            const principalBalance = roomContent.vaultData.principal?.fields?.value || roomContent.vaultData.principal || 0;
            totalDeposit = Number(principalBalance) / 1_000_000;
          }
        } catch (e) {
          console.log(`Failed to fetch blockchain data for my-room ${roomId}:`, e);
        }

        // Use blockchain data as fallback if DB data is 0 or missing
        const finalDepositAmount = dbRoom.depositAmount || blockchainDepositAmount;
        const finalTotalPeriods = dbRoom.totalPeriods || blockchainTotalPeriods;

        // Build response with explicit field names
        const roomResponse = {
          roomId: dbRoom.roomId,
          name: `Savings Room #${dbRoom.roomId.slice(0, 8)}`,
          vaultId: dbRoom.vaultId,
          depositAmount: finalDepositAmount, // Fallback to blockchain if DB is 0
          totalPeriods: finalTotalPeriods,
          strategyId: dbRoom.strategyId,
          isPrivate: dbRoom.isPrivate,
          startTimeMs: dbRoom.startTimeMs,
          periodLengthMs: dbRoom.periodLengthMs,
          status: 0, // Assuming active for now
          // Join-specific data
          playerPositionId: joinInfo?.playerPositionId,
          joinedAt: joinInfo?.joinedAt,
          initialDeposit: joinInfo?.initialDeposit || 0, // Raw units
          myDeposit: joinInfo?.initialDeposit || 0, // Alias for frontend compatibility
          depositsCount: 1, // At least 1 deposit since user joined
          // Blockchain data (already divided)
          rewardPool,
          totalDeposit,
        };

        console.log(`✓ Room ${roomId} data:`, {
          depositAmount: roomResponse.depositAmount,
          totalPeriods: roomResponse.totalPeriods,
          initialDeposit: roomResponse.initialDeposit,
          myDeposit: roomResponse.myDeposit,
        });

        return roomResponse;
      })
    );

    // Filter out null entries (rooms not found in DB)
    const validRooms = roomsWithDetails.filter(room => room !== null);

    console.log(`✓ Found ${validRooms.length} rooms for user ${userAddress}`);

    res.json({
      success: true,
      rooms: validRooms,
      count: validRooms.length,
    });
  } catch (error: any) {
    console.error('Get my rooms error:', error);
    res.status(500).json({ error: error.message || 'Failed to get user rooms' });
  }
});

/**
 * POST /room/find-by-password
 * Find a private room by password
 */
router.post('/find-by-password', async (req: Request, res: Response) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Password required' });
    }

    // Hash the password
    const hash = keccak_256(new TextEncoder().encode(password));
    const hashHex = Buffer.from(hash).toString('hex');

    console.log('Searching for room with password hash:', hashHex);

    // Find room by password hash
    const room = await roomStoreService.findByPasswordHash(hashHex);

    if (!room) {
      return res.status(404).json({
        error: 'No room found with this password',
        hint: 'Please check the password and try again'
      });
    }

    console.log('✓ Found room:', room.roomId);

    res.json({
      success: true,
      roomId: room.roomId,
      vaultId: room.vaultId,
    });
  } catch (error: any) {
    console.error('Find by password error:', error);
    res.status(500).json({ error: error.message || 'Failed to find room' });
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

    const USDC_DECIMALS = 1_000_000;
    const packageId = process.env.PACKAGE_ID || '0xaa90da2945b7b5dee82c73a535f0717724b0fa58643aba43972b8e8fbc67c280';

    // Calculate totalDeposit from participant events (sum of all deposits)
    let totalDeposit = 0;
    let rewardPool = 0;

    try {
      // Query PlayerJoined and DepositMade events for this room
      const [joinEvents, depositEvents] = await Promise.all([
        suiClient.queryEvents({
          query: { MoveEventType: `${packageId}::money_race_v2::PlayerJoined` },
          limit: 50,
        }),
        suiClient.queryEvents({
          query: { MoveEventType: `${packageId}::money_race_v2::DepositMade` },
          limit: 100,
        }),
      ]);

      // Sum deposits from PlayerJoined events for this room
      joinEvents.data
        .filter((event: any) => event.parsedJson?.room_id === id)
        .forEach((event: any) => {
          const amount = parseInt(event.parsedJson?.amount) || 0;
          totalDeposit += amount;
        });

      // Sum deposits from DepositMade events for this room
      depositEvents.data
        .filter((event: any) => event.parsedJson?.room_id === id)
        .forEach((event: any) => {
          const amount = parseInt(event.parsedJson?.amount) || 0;
          totalDeposit += amount;
        });

      // Convert from USDC decimals
      totalDeposit = totalDeposit / USDC_DECIMALS;
    } catch (error) {
      console.log(`Could not fetch deposit events for room ${id}:`, error);
      totalDeposit = 0;
    }

    // Fetch rewardPool from vault if vaultId exists
    let vaultPrincipal = 0;
    if (dbRoom?.vaultId) {
      try {
        const vaultObj = await suiClient.getObject({
          id: dbRoom.vaultId,
          options: { showContent: true },
        });

        if (vaultObj.data?.content && 'fields' in vaultObj.data.content) {
          const vaultFields = vaultObj.data.content.fields as any;
          const rewardBalance = vaultFields.reward?.fields?.value || vaultFields.reward || 0;
          const principalBalance = vaultFields.principal?.fields?.value || vaultFields.principal || 0;

          rewardPool = Number(rewardBalance) / USDC_DECIMALS;
          vaultPrincipal = Number(principalBalance) / USDC_DECIMALS;
        }
      } catch (error) {
        console.log(`Could not fetch vault data for room ${id}:`, error);
        rewardPool = 0;
      }
    }

    // Calculate time-based accrued yield (real-time calculation)
    if (roomData?.startTimeMs && roomData?.strategy !== undefined && vaultPrincipal > 0) {
      const startTime = Number(roomData.startTimeMs);
      const now = Date.now();
      
      // APY based on strategy
      let apy = 0.04; // Default: Stable = 4%
      if (roomData.strategy === 'Growth' || roomData.strategy === 1) {
        apy = 0.08; // Growth = 8%
      } else if (roomData.strategy === 'Aggressive' || roomData.strategy === 2) {
        apy = 0.15; // Aggressive = 15%
      }

      // Use persisted accumulatedYield from database
      let accumulatedYield = dbRoom?.accumulatedYield || 0;
      const lastUpdateMs = Number(dbRoom?.lastYieldUpdateMs || startTime);
      
      // Calculate NEW yield since last update
      const elapsedSinceLastUpdate = now - lastUpdateMs;
      const elapsedYears = elapsedSinceLastUpdate / (365.25 * 24 * 60 * 60 * 1000);
      const newYield = vaultPrincipal * apy * elapsedYears;
      
      // Add new yield to accumulated
      accumulatedYield += newYield;
      
      // Update database with new accumulated yield (fire and forget)
      if (dbRoom && newYield > 0) {
        roomStoreService.updateYield(id, accumulatedYield, now).catch(err => {
          console.error('Failed to update yield in DB:', err);
        });
      }

      // Add accumulated yield to existing reward pool
      rewardPool += accumulatedYield;

      console.log(`✓ Persisted yield: ${accumulatedYield.toFixed(6)} USDC (new: +${newYield.toFixed(6)})`);
    }

    // Merge database data with blockchain data
    const mergedData = {
      ...roomData,
      vaultId: dbRoom?.vaultId || null,
      transactionDigest: dbRoom?.transactionDigest || null,
      totalDeposit, // Total deposits from participant events
      rewardPool, // Blockchain reward + accumulated yield
    };

    console.log('✓ Room data merged:', { roomId: id, vaultId: mergedData.vaultId, totalDeposit, rewardPool });

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

/**
 * GET /room/:id/participants
 * Get room participants by querying PlayerJoined and DepositMade events
 */
router.get('/:id/participants', async (req: Request, res: Response) => {
  try {
    const roomId = req.params.id;
    const packageId = process.env.PACKAGE_ID || '0xaa90da2945b7b5dee82c73a535f0717724b0fa58643aba43972b8e8fbc67c280';

    if (!roomId) {
      return res.status(400).json({ error: 'Room ID required' });
    }

    // Query PlayerJoined events for this room
    const joinEvents = await suiClient.queryEvents({
      query: {
        MoveEventType: `${packageId}::money_race_v2::PlayerJoined`
      },
      limit: 50,
    });

    // Query DepositMade events for this room
    const depositEvents = await suiClient.queryEvents({
      query: {
        MoveEventType: `${packageId}::money_race_v2::DepositMade`
      },
      limit: 100,
    });

    // Build participant map from join events
    const participantMap = new Map<string, {
      address: string;
      playerPositionId: string;
      totalDeposit: number;
      depositsCount: number;
      joinedAt: string;
    }>();

    // Process join events
    joinEvents.data
      .filter((event: any) => {
        const parsedJson = event.parsedJson as any;
        return parsedJson?.room_id === roomId;
      })
      .forEach((event: any) => {
        const parsedJson = event.parsedJson as any;
        const player = parsedJson.player;
        participantMap.set(player, {
          address: player,
          playerPositionId: parsedJson.player_position_id,
          totalDeposit: parseInt(parsedJson.amount) || 0,
          depositsCount: 1, // Initial join counts as 1
          joinedAt: event.timestampMs,
        });
      });

    // Add deposits from DepositMade events
    depositEvents.data
      .filter((event: any) => {
        const parsedJson = event.parsedJson as any;
        return parsedJson?.room_id === roomId;
      })
      .forEach((event: any) => {
        const parsedJson = event.parsedJson as any;
        const player = parsedJson.player;
        const amount = parseInt(parsedJson.amount) || 0;

        if (participantMap.has(player)) {
          const existing = participantMap.get(player)!;
          existing.totalDeposit += amount;
          existing.depositsCount += 1;
        }
      });

    // Convert map to array
    const participants = Array.from(participantMap.values()).map(p => ({
      address: p.address,
      playerPositionId: p.playerPositionId,
      amount: p.totalDeposit, // Total including all deposits
      depositsCount: p.depositsCount,
      joinedAt: p.joinedAt,
    }));

    res.json({
      success: true,
      participants,
      count: participants.length,
    });
  } catch (error: any) {
    console.error('Get participants error:', error);
    res.status(500).json({ error: error.message || 'Failed to get participants' });
  }
});

/**
 * GET /room/:id/history
 * Get room transaction history (joins, deposits, claims)
 */
router.get('/:id/history', async (req: Request, res: Response) => {
  try {
    const roomId = req.params.id;
    const packageId = process.env.PACKAGE_ID || '0xaa90da2945b7b5dee82c73a535f0717724b0fa58643aba43972b8e8fbc67c280';

    if (!roomId) {
      return res.status(400).json({ error: 'Room ID required' });
    }

    // Query all relevant events
    const [joinEvents, depositEvents] = await Promise.all([
      suiClient.queryEvents({
        query: { MoveEventType: `${packageId}::money_race_v2::PlayerJoined` },
        limit: 100,
      }),
      suiClient.queryEvents({
        query: { MoveEventType: `${packageId}::money_race_v2::DepositMade` },
        limit: 100,
      }),
    ]);

    // Process join events
    const joins = joinEvents.data
      .filter((event: any) => event.parsedJson?.room_id === roomId)
      .map((event: any) => ({
        type: 'join',
        player: event.parsedJson.player,
        amount: parseInt(event.parsedJson.amount) || 0,
        timestamp: parseInt(event.timestampMs),
        txDigest: event.id.txDigest,
      }));

    // Process deposit events
    const deposits = depositEvents.data
      .filter((event: any) => event.parsedJson?.room_id === roomId)
      .map((event: any) => ({
        type: 'deposit',
        player: event.parsedJson.player,
        amount: parseInt(event.parsedJson.amount) || 0,
        period: parseInt(event.parsedJson.period) || 0,
        totalDeposits: parseInt(event.parsedJson.total_deposits) || 0,
        timestamp: parseInt(event.timestampMs),
        txDigest: event.id.txDigest,
      }));

    // Combine and sort by timestamp (newest first)
    const history = [...joins, ...deposits].sort((a, b) => b.timestamp - a.timestamp);

    res.json({
      success: true,
      history,
      count: history.length,
    });
  } catch (error: any) {
    console.error('Get history error:', error);
    res.status(500).json({ error: error.message || 'Failed to get history' });
  }
});

/**
 * GET /room/user/:address/joined
 * Get all rooms that a user has joined by querying PlayerJoined events
 */
router.get('/user/:address/joined', async (req: Request, res: Response) => {
  try {
    const userAddress = req.params.address as string;
    const packageId = process.env.PACKAGE_ID || '0xaa90da2945b7b5dee82c73a535f0717724b0fa58643aba43972b8e8fbc67c280';

    if (!userAddress) {
      return res.status(400).json({ error: 'User address required' });
    }

    console.log('Fetching rooms for user:', userAddress);

    // Fetch PlayerJoined events with error handling
    let joinEvents;
    try {
      joinEvents = await suiClient.queryEvents({
        query: {
          MoveEventType: `${packageId}::money_race_v2::PlayerJoined`
        },
        limit: 100,
        order: 'descending'
      });
    } catch (apiError: any) {
      console.error('Failed to query join events:', apiError);
      // Return empty list instead of crashing
      return res.json({ success: true, rooms: [], count: 0, error: 'Blockchain query failed' });
    }

    // Fetch DepositMade events to calculate total deposits
    let depositEvents;
    try {
      depositEvents = await suiClient.queryEvents({
        query: {
          MoveEventType: `${packageId}::money_race_v2::DepositMade`
        },
        limit: 200,
        order: 'descending'
      });
    } catch (apiError: any) {
      console.warn('Failed to query deposit events:', apiError);
      // Continue without deposit info if this fails
      depositEvents = { data: [] };
    }

    // Filter join events for this user and extract room info
    // Use optional chaining and validation
    const userJoinEvents = (joinEvents.data || []).filter((event: any) => {
      const parsedJson = event.parsedJson as any;
      const player = parsedJson?.player;
      return typeof player === 'string' && player.toLowerCase() === userAddress.toLowerCase();
    });

    // Build rooms map with user's data
    const roomsMap = new Map<string, {
      roomId: string;
      playerPositionId: string;
      joinedAt: number;
      initialDeposit: number;
      totalDeposit: number;
      depositsCount: number;
    }>();

    // Process user's join events
    for (const event of userJoinEvents) {
      try {
        const parsedJson = event.parsedJson as any;
        const roomId = parsedJson.room_id;
        const playerPositionId = parsedJson.player_position_id;

        if (roomId && typeof roomId === 'string' && playerPositionId && typeof playerPositionId === 'string') {
          roomsMap.set(roomId, {
            roomId,
            playerPositionId,
            joinedAt: parseInt(event.timestampMs || '0') || Date.now(),
            initialDeposit: parseInt(parsedJson.amount) || 0,
            totalDeposit: parseInt(parsedJson.amount) || 0,
            depositsCount: 1,
          });
        }
      } catch (e) {
        console.error('Error parsing join event:', e);
      }
    }

    // Add deposits to rooms
    for (const event of (depositEvents.data || [])) {
      try {
        const parsedJson = event.parsedJson as any;
        const player = parsedJson?.player;
        if (typeof player === 'string' && player.toLowerCase() === userAddress.toLowerCase()) {
          const roomId = parsedJson.room_id;
          if (roomsMap.has(roomId)) {
            const room = roomsMap.get(roomId)!;
            room.totalDeposit += parseInt(parsedJson.amount) || 0;
            room.depositsCount += 1;
          }
        }
      } catch (e) {
        // Ignore malformed deposit events
      }
    }

    const fetchedRooms: any[] = [];

    // Fetch room details from database
    const roomIds = Array.from(roomsMap.keys());
    // We can fetch DB rooms in parallel or loop. Using existing service.

    for (const roomId of roomIds) {
      try {
        const userRoom = roomsMap.get(roomId)!;
        const dbRoom = await roomStoreService.getRoom(roomId);

        // Fetch blockchain data robustly
        let blockchainData: any = {};
        let vaultData: any = null;
        try {
          // Pass vaultId to fetch vault data if available
          const roomContent = await relayerService.getRoomData(roomId, dbRoom?.vaultId || undefined);
          if (roomContent?.fields) {
            blockchainData = roomContent.fields;
          }
          if (roomContent?.vaultData) {
            vaultData = roomContent.vaultData;
          }
        } catch (e) {
          // If room not found on chain, it might be an issue, but we still have DB data
          console.log(`Could not fetch blockchain data for room ${roomId}`);
        }

        const USDC_DECIMALS = 1_000_000;

        // Calculate current period based on time
        const startTimeMs = dbRoom?.startTimeMs || blockchainData.start_time || Date.now();
        const periodLengthMs = dbRoom?.periodLengthMs || blockchainData.period_length || (7 * 24 * 60 * 60 * 1000);
        const totalPeriods = dbRoom?.totalPeriods || blockchainData.total_periods || 0;
        const now = Date.now();
        const elapsedMs = now - Number(startTimeMs);
        let currentPeriod = 0;
        if (elapsedMs > 0) {
          currentPeriod = Math.floor(elapsedMs / Number(periodLengthMs));
        }

        // Determine status: Override blockchain status if room is still active based on time
        let status = blockchainData.status !== undefined ? blockchainData.status : 0;
        // If current period < total periods, force status to 0 (Active)
        if (currentPeriod < totalPeriods) {
          status = 0; // Active
        } else if (currentPeriod >= totalPeriods && status === 0) {
          // If time is up but blockchain status is still 0, set to 1 (Claiming)
          status = 1;
        }

        // Calculate reward pool from vault data (balance value)
        // Balance<T> struct has 'value' field
        const rewardBalance = vaultData?.reward?.fields?.value || vaultData?.reward || 0;
        const principalBalance = vaultData?.principal?.fields?.value || vaultData?.principal || 0;
        let rewardPool = Number(rewardBalance) / USDC_DECIMALS;
        const vaultPrincipal = Number(principalBalance) / USDC_DECIMALS;

        // Calculate time-based accrued yield (real-time calculation)
        if (startTimeMs && vaultPrincipal > 0) {
          const now = Date.now();
          const elapsedMs = now - Number(startTimeMs);
          const elapsedYears = elapsedMs / (365.25 * 24 * 60 * 60 * 1000);

          // APY based on strategy
          const strategyId = dbRoom?.strategyId || blockchainData.strategy_id || 0;
          let apy = 0.04; // Default: Conservative = 4%
          if (strategyId === 1) {
            apy = 0.08; // Growth = 8%
          } else if (strategyId === 2) {
            apy = 0.15; // Aggressive = 15%
          }

          // Calculate accrued yield: principal × APY × time
          const accruedYield = vaultPrincipal * apy * elapsedYears;
          rewardPool += accruedYield;
        }

        // Calculate totalDeposit from participant events (sum of ALL deposits in room)
        let totalDeposit = 0;
        try {
          const packageId = process.env.PACKAGE_ID || '0xaa90da2945b7b5dee82c73a535f0717724b0fa58643aba43972b8e8fbc67c280';

          // Query all PlayerJoined and DepositMade events for ALL users in this room
          const [allJoinEvents, allDepositEvents] = await Promise.all([
            suiClient.queryEvents({
              query: { MoveEventType: `${packageId}::money_race_v2::PlayerJoined` },
              limit: 50,
            }),
            suiClient.queryEvents({
              query: { MoveEventType: `${packageId}::money_race_v2::DepositMade` },
              limit: 100,
            }),
          ]);

          // Sum deposits from PlayerJoined events for this room
          allJoinEvents.data
            .filter((event: any) => event.parsedJson?.room_id === roomId)
            .forEach((event: any) => {
              const amount = parseInt(event.parsedJson?.amount) || 0;
              totalDeposit += amount;
            });

          // Sum deposits from DepositMade events for this room
          allDepositEvents.data
            .filter((event: any) => event.parsedJson?.room_id === roomId)
            .forEach((event: any) => {
              const amount = parseInt(event.parsedJson?.amount) || 0;
              totalDeposit += amount;
            });

          // Convert from USDC decimals
          totalDeposit = totalDeposit / USDC_DECIMALS;
        } catch (error) {
          console.log(`Could not calculate totalDeposit for room ${roomId}:`, error);
          totalDeposit = 0;
        }

        const roomObj = {
          roomId: roomId,
          name: dbRoom?.name || `Savings Room #${roomId.slice(0, 8)}`,
          vaultId: dbRoom?.vaultId || null,
          playerPositionId: userRoom.playerPositionId,
          joinedAt: userRoom.joinedAt,
          myDeposit: userRoom.totalDeposit / USDC_DECIMALS,
          depositsCount: userRoom.depositsCount,
          // Room info from database/blockchain
          totalPeriods: totalPeriods,
          depositAmount: (dbRoom?.depositAmount || blockchainData.deposit_amount || 0) / USDC_DECIMALS,
          strategyId: dbRoom?.strategyId || blockchainData.strategy_id || 0,
          isPrivate: dbRoom?.isPrivate || false,
          status: status, // 0 = active, 1 = claiming (time-based override applied)
          rewardPool: rewardPool, // Blockchain data + time-based accrual
          totalDeposit: totalDeposit, // Total pool from participant deposits
        };

        fetchedRooms.push(roomObj);
      } catch (error) {
        console.error(`Error processing room ${roomId}:`, error);
        // Continue to next room
      }
    }

    // --- FILTERING LOGIC ---
    // Only show Active and Claiming rooms, hide Ended rooms
    // Status: 0 = Active, 1 = Claiming, 2 = Ended
    // Keep rooms where status is NOT 2 (ended)

    const activeRooms = fetchedRooms.filter(r => {
      const status = parseInt(r.status) || 0;
      return status !== 2; // Exclude ended rooms (status 2)
    });

    // Sort by joinedAt (newest first)
    activeRooms.sort((a, b) => b.joinedAt - a.joinedAt);

    console.log(`Returning ${activeRooms.length} active rooms (filtered from ${fetchedRooms.length} total)`);

    res.json({
      success: true,
      rooms: activeRooms,
      count: activeRooms.length,
    });
  } catch (error: any) {
    console.error('Get user joined rooms error:', error);
    res.status(500).json({ error: error.message || 'Failed to get user rooms' });
  }
});

export default router;
