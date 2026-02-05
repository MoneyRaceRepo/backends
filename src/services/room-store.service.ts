/**
 * Prisma Room Store
 * PostgreSQL database for persistent storage
 */

import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient | null = null;

function getPrismaClient() {
  if (!prisma) {
    console.log('Initializing Prisma Client...');
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✓ Set' : '✗ Undefined');
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is not set in environment variables');
    }
    prisma = new PrismaClient();
  }
  return prisma;
}

interface RoomData {
  roomId: string;
  name?: string | null;
  vaultId: string | null;
  creatorAddress: string;
  totalPeriods: number;
  depositAmount: number;
  strategyId: number;
  isPrivate?: boolean;
  passwordHash?: string | null;
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
        name: data.name ?? null,
        vaultId: data.vaultId,
        creatorAddress: data.creatorAddress,
        totalPeriods: data.totalPeriods,
        depositAmount: BigInt(data.depositAmount),
        strategyId: data.strategyId,
        isPrivate: data.isPrivate ?? false,
        passwordHash: data.passwordHash ?? null,
        startTimeMs: BigInt(data.startTimeMs),
        periodLengthMs: BigInt(data.periodLengthMs),
        transactionDigest: data.transactionDigest,
      },
      create: {
        roomId: data.roomId,
        name: data.name ?? null,
        vaultId: data.vaultId,
        creatorAddress: data.creatorAddress,
        totalPeriods: data.totalPeriods,
        depositAmount: BigInt(data.depositAmount),
        strategyId: data.strategyId,
        isPrivate: data.isPrivate ?? false,
        passwordHash: data.passwordHash ?? null,
        startTimeMs: BigInt(data.startTimeMs),
        periodLengthMs: BigInt(data.periodLengthMs),
        transactionDigest: data.transactionDigest,
      },
    });

    console.log('✓ Room saved to SQLite:', data.roomId);
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
      vaultId: room.vaultId,
      creatorAddress: room.creatorAddress,
      totalPeriods: room.totalPeriods,
      depositAmount: Number(room.depositAmount),
      strategyId: room.strategyId,
      isPrivate: room.isPrivate,
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
      vaultId: room.vaultId,
      creatorAddress: room.creatorAddress,
      totalPeriods: room.totalPeriods,
      depositAmount: Number(room.depositAmount),
      strategyId: room.strategyId,
      isPrivate: room.isPrivate,
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
      vaultId: room.vaultId,
      creatorAddress: room.creatorAddress,
      totalPeriods: room.totalPeriods,
      depositAmount: Number(room.depositAmount),
      strategyId: room.strategyId,
      isPrivate: room.isPrivate,
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
   * Find room by password hash
   */
  async findByPasswordHash(passwordHash: string): Promise<RoomData | undefined> {
    const room = await getPrismaClient().room.findFirst({
      where: { passwordHash },
    });

    if (!room) return undefined;

    return {
      roomId: room.roomId,
      vaultId: room.vaultId,
      creatorAddress: room.creatorAddress,
      totalPeriods: room.totalPeriods,
      depositAmount: Number(room.depositAmount),
      strategyId: room.strategyId,
      isPrivate: room.isPrivate,
      passwordHash: room.passwordHash,
      startTimeMs: Number(room.startTimeMs),
      periodLengthMs: Number(room.periodLengthMs),
      createdAt: room.createdAt.getTime(),
      transactionDigest: room.transactionDigest,
    };
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
