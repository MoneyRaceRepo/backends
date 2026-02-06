/**
 * Event Service
 * Handles querying and aggregation of blockchain events
 * Reduces duplication across route handlers
 */

import { suiClient } from '../sui/client.js';
import { getPackageId, buildEventType } from '../utils/blockchain.js';
import { MOVE_EVENT_TYPES, EVENT_QUERY_LIMITS, USDC_DECIMALS } from '../constants/index.js';

/**
 * Query PlayerJoined events from blockchain
 *
 * @param limit - Maximum number of events to retrieve
 * @returns Query result with PlayerJoined events
 */
export async function queryPlayerJoinedEvents(limit: number = EVENT_QUERY_LIMITS.PLAYER_JOINED) {
  const eventType = buildEventType(MOVE_EVENT_TYPES.PLAYER_JOINED);
  return suiClient.queryEvents({
    query: { MoveEventType: eventType },
    limit,
  });
}

/**
 * Query DepositMade events from blockchain
 *
 * @param limit - Maximum number of events to retrieve
 * @returns Query result with DepositMade events
 */
export async function queryDepositMadeEvents(limit: number = EVENT_QUERY_LIMITS.DEPOSIT_MADE) {
  const eventType = buildEventType(MOVE_EVENT_TYPES.DEPOSIT_MADE);
  return suiClient.queryEvents({
    query: { MoveEventType: eventType },
    limit,
  });
}

/**
 * Query both PlayerJoined and DepositMade events in parallel
 * Common pattern used across multiple endpoints
 *
 * @param options - Query options
 * @returns Object containing both event types
 */
export async function queryRoomEvents(options?: {
  joinLimit?: number;
  depositLimit?: number;
}) {
  const [joinEvents, depositEvents] = await Promise.all([
    queryPlayerJoinedEvents(options?.joinLimit),
    queryDepositMadeEvents(options?.depositLimit),
  ]);

  return {
    joinEvents,
    depositEvents,
  };
}

/**
 * Calculate total deposit for a specific room from events
 * Aggregates both PlayerJoined and DepositMade events
 *
 * @param roomId - Room ID to calculate deposits for
 * @param events - Optional pre-fetched events (to avoid re-querying)
 * @returns Total deposit amount in USDC (human-readable format)
 */
export async function calculateRoomTotalDeposit(
  roomId: string,
  events?: {
    joinEvents: any;
    depositEvents: any;
  }
): Promise<number> {
  // Fetch events if not provided
  const { joinEvents, depositEvents } = events || await queryRoomEvents();

  let totalDepositInUnits = 0;

  // Sum deposits from PlayerJoined events for this room
  joinEvents.data
    .filter((event: any) => event.parsedJson?.room_id === roomId)
    .forEach((event: any) => {
      const amount = parseInt(event.parsedJson?.amount) || 0;
      totalDepositInUnits += amount;
    });

  // Sum deposits from DepositMade events for this room
  depositEvents.data
    .filter((event: any) => event.parsedJson?.room_id === roomId)
    .forEach((event: any) => {
      const amount = parseInt(event.parsedJson?.amount) || 0;
      totalDepositInUnits += amount;
    });

  // Convert from USDC base units to human-readable format
  return totalDepositInUnits / USDC_DECIMALS;
}

/**
 * Calculate total deposits for multiple rooms from events
 * More efficient than calling calculateRoomTotalDeposit for each room
 *
 * @param roomIds - Array of room IDs
 * @param events - Optional pre-fetched events
 * @returns Map of roomId -> totalDeposit (in USDC)
 */
export async function calculateMultipleRoomDeposits(
  roomIds: string[],
  events?: {
    joinEvents: any;
    depositEvents: any;
  }
): Promise<Map<string, number>> {
  // Fetch events if not provided
  const { joinEvents, depositEvents } = events || await queryRoomEvents();

  // Initialize deposit map
  const depositMap = new Map<string, number>();
  roomIds.forEach(roomId => depositMap.set(roomId, 0));

  // Aggregate PlayerJoined events
  joinEvents.data.forEach((event: any) => {
    const roomId = event.parsedJson?.room_id;
    if (roomId && depositMap.has(roomId)) {
      const amount = parseInt(event.parsedJson?.amount) || 0;
      depositMap.set(roomId, depositMap.get(roomId)! + amount);
    }
  });

  // Aggregate DepositMade events
  depositEvents.data.forEach((event: any) => {
    const roomId = event.parsedJson?.room_id;
    if (roomId && depositMap.has(roomId)) {
      const amount = parseInt(event.parsedJson?.amount) || 0;
      depositMap.set(roomId, depositMap.get(roomId)! + amount);
    }
  });

  // Convert all amounts from base units to USDC
  depositMap.forEach((amountInUnits, roomId) => {
    depositMap.set(roomId, amountInUnits / USDC_DECIMALS);
  });

  return depositMap;
}

/**
 * Get all rooms that a user has joined from PlayerJoined events
 *
 * @param userAddress - User's Sui address
 * @returns Array of room IDs and join info
 */
export async function getUserJoinedRooms(userAddress: string) {
  const joinEvents = await queryPlayerJoinedEvents(100);

  const userRooms: Array<{
    roomId: string;
    playerPositionId: string;
    joinedAt: string;
    initialDeposit: number;
  }> = [];

  joinEvents.data
    .filter((event: any) => event.parsedJson?.player === userAddress)
    .forEach((event: any) => {
      const parsedJson = event.parsedJson as any;
      userRooms.push({
        roomId: parsedJson.room_id,
        playerPositionId: parsedJson.player_position_id,
        joinedAt: event.timestampMs,
        initialDeposit: parseInt(parsedJson.amount) || 0,
      });
    });

  return userRooms;
}

/**
 * Event service singleton
 * Export functions as an object for easier mocking in tests
 */
export const eventService = {
  queryPlayerJoinedEvents,
  queryDepositMadeEvents,
  queryRoomEvents,
  calculateRoomTotalDeposit,
  calculateMultipleRoomDeposits,
  getUserJoinedRooms,
};
