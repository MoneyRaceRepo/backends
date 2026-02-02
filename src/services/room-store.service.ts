/**
 * Prisma Room Store
 * PostgreSQL database for persistent storage
 */

import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient | null = null;

function getPrismaClient() {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}

interface RoomData {
  roomId: string;
  vaultId?: string;
  creatorAddress: string;
  totalPeriods: number;
  depositAmount: number;
  strategyId: number;
  startTimeMs: number;
  periodLengthMs: number;
  createdAt: number;
  transactionDigest: string;
}

class RoomStoreService {
  /**
   * Add a room to the store
   */
  async addRoom(data: RoomData): Promise<void> {
    await getPrismaClient().room.upsert({
      where: { roomId: data.roomId },
      update: {
        vaultId: data.vaultId,
        creatorAddress: data.creatorAddress,
        totalPeriods: data.totalPeriods,
        depositAmount: BigInt(data.depositAmount),
        strategyId: data.strategyId,
        startTimeMs: BigInt(data.startTimeMs),
        periodLengthMs: BigInt(data.periodLengthMs),
        transactionDigest: data.transactionDigest,
      },
      create: {
        roomId: data.roomId,
        vaultId: data.vaultId,
        creatorAddress: data.creatorAddress,
        totalPeriods: data.totalPeriods,
        depositAmount: BigInt(data.depositAmount),
        strategyId: data.strategyId,
        startTimeMs: BigInt(data.startTimeMs),
        periodLengthMs: BigInt(data.periodLengthMs),
        transactionDigest: data.transactionDigest,
      },
    });

    console.log('✓ Room saved to PostgreSQL:', data.roomId);
  }

  /**
   * Get all rooms
   */
  async getAllRooms(): Promise<RoomData[]> {
    const rooms = await getPrismaClient().room.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return rooms.map((room) => ({
      roomId: room.roomId,
      vaultId: room.vaultId || undefined,
      creatorAddress: room.creatorAddress,
      totalPeriods: room.totalPeriods,
      depositAmount: Number(room.depositAmount),
      strategyId: room.strategyId,
      startTimeMs: Number(room.startTimeMs),
      periodLengthMs: Number(room.periodLengthMs),
      createdAt: room.createdAt.getTime(),
      transactionDigest: room.transactionDigest,
    }));
  }

  /**
   * Get room by ID
   */
  async getRoom(roomId: string): Promise<RoomData | undefined> {
    const room = await getPrismaClient().room.findUnique({
      where: { roomId },
    });

    if (!room) return undefined;

    return {
      roomId: room.roomId,
      vaultId: room.vaultId || undefined,
      creatorAddress: room.creatorAddress,
      totalPeriods: room.totalPeriods,
      depositAmount: Number(room.depositAmount),
      strategyId: room.strategyId,
      startTimeMs: Number(room.startTimeMs),
      periodLengthMs: Number(room.periodLengthMs),
      createdAt: room.createdAt.getTime(),
      transactionDigest: room.transactionDigest,
    };
  }

  /**
   * Get rooms by creator
   */
  async getRoomsByCreator(creatorAddress: string): Promise<RoomData[]> {
    const rooms = await getPrismaClient().room.findMany({
      where: { creatorAddress },
      orderBy: { createdAt: 'desc' },
    });

    return rooms.map((room) => ({
      roomId: room.roomId,
      vaultId: room.vaultId || undefined,
      creatorAddress: room.creatorAddress,
      totalPeriods: room.totalPeriods,
      depositAmount: Number(room.depositAmount),
      strategyId: room.strategyId,
      startTimeMs: Number(room.startTimeMs),
      periodLengthMs: Number(room.periodLengthMs),
      createdAt: room.createdAt.getTime(),
      transactionDigest: room.transactionDigest,
    }));
  }

  /**
   * Check if room exists
   */
  async hasRoom(roomId: string): Promise<boolean> {
    const count = await getPrismaClient().room.count({
      where: { roomId },
    });
    return count > 0;
  }

  /**
   * Get room count
   */
  async getRoomCount(): Promise<number> {
    return await getPrismaClient().room.count();
  }

  /**
   * Disconnect from database
   */
  async disconnect(): Promise<void> {
    if (prisma) await prisma.$disconnect();
  }
}

export const roomStoreService = new RoomStoreService();
export type { RoomData };
