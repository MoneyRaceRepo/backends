import { TransactionBlock } from '@mysten/sui.js/transactions';
import { suiClient } from '../sui/client.js';
import { sponsorKeypair } from '../sui/sponsor.js';
import { config } from '../config/index.js';
import type { TxResponse } from '../types/index.js';

/**
 * Transaction Relayer Service
 * Sponsors gas and submits transactions on behalf of users
 */
export class RelayerService {
  /**
   * Execute a sponsored transaction
   * The relayer pays for gas, making it gasless for users
   */
  async executeSponsoredTx(tx: TransactionBlock): Promise<TxResponse> {
    try {
      // Set gas budget
      tx.setGasBudget(100000000); // 0.1 SUI

      // Sign and execute with sponsor keypair
      const result = await suiClient.signAndExecuteTransactionBlock({
        signer: sponsorKeypair,
        transactionBlock: tx,
        options: {
          showEffects: true,
          showEvents: true,
          showObjectChanges: true,
        },
      });

      const success = result.effects?.status?.status === 'success';

      console.log('Transaction executed:', {
        digest: result.digest,
        success,
      });

      return {
        digest: result.digest,
        success,
        effects: result.effects,
      };
    } catch (error: any) {
      console.error('Transaction execution failed:', error);
      throw new Error(`Transaction failed: ${error.message}`);
    }
  }

  /**
   * Create Room Transaction
   */
  async createRoom(params: {
    totalPeriods: number;
    depositAmount: number;
    strategyId: number;
    startTimeMs: number;
    periodLengthMs: number;
  }): Promise<TxResponse> {
    const tx = new TransactionBlock();

    tx.moveCall({
      target: `${config.packageId}::money_race::create_room`,
      arguments: [
        tx.pure(params.totalPeriods, 'u64'),
        tx.pure(params.depositAmount, 'u64'),
        tx.pure(params.strategyId, 'u8'),
        tx.pure(params.startTimeMs, 'u64'),
        tx.pure(params.periodLengthMs, 'u64'),
      ],
    });

    return this.executeSponsoredTx(tx);
  }

  /**
   * Start Room Transaction (Admin only)
   */
  async startRoom(roomId: string): Promise<TxResponse> {
    const tx = new TransactionBlock();

    tx.moveCall({
      target: `${config.packageId}::money_race::start_room`,
      arguments: [
        tx.object(config.adminCapId), // AdminCap
        tx.object(roomId),
      ],
    });

    return this.executeSponsoredTx(tx);
  }

  /**
   * Join Room Transaction
   */
  async joinRoom(params: {
    roomId: string;
    vaultId: string;
    coinObjectId: string;
    clockId: string;
  }): Promise<TxResponse> {
    const tx = new TransactionBlock();

    tx.moveCall({
      target: `${config.packageId}::money_race::join_room`,
      arguments: [
        tx.object(params.roomId),
        tx.object(params.vaultId),
        tx.object(params.clockId),
        tx.object(params.coinObjectId),
      ],
    });

    return this.executeSponsoredTx(tx);
  }

  /**
   * Deposit Transaction
   */
  async deposit(params: {
    roomId: string;
    vaultId: string;
    playerPositionId: string;
    coinObjectId: string;
    clockId: string;
  }): Promise<TxResponse> {
    const tx = new TransactionBlock();

    tx.moveCall({
      target: `${config.packageId}::money_race::deposit`,
      arguments: [
        tx.object(params.roomId),
        tx.object(params.vaultId),
        tx.object(params.playerPositionId),
        tx.object(params.clockId),
        tx.object(params.coinObjectId),
      ],
    });

    return this.executeSponsoredTx(tx);
  }

  /**
   * Finalize Room Transaction (Admin only)
   */
  async finalizeRoom(roomId: string): Promise<TxResponse> {
    const tx = new TransactionBlock();

    tx.moveCall({
      target: `${config.packageId}::money_race::finalize_room`,
      arguments: [
        tx.object(config.adminCapId),
        tx.object(roomId),
      ],
    });

    return this.executeSponsoredTx(tx);
  }

  /**
   * Fund Reward Pool Transaction (Admin only)
   */
  async fundRewardPool(params: {
    vaultId: string;
    coinObjectId: string;
  }): Promise<TxResponse> {
    const tx = new TransactionBlock();

    tx.moveCall({
      target: `${config.packageId}::money_race::fund_reward_pool`,
      arguments: [
        tx.object(config.adminCapId),
        tx.object(params.vaultId),
        tx.object(params.coinObjectId),
      ],
    });

    return this.executeSponsoredTx(tx);
  }

  /**
   * Claim All (Principal + Reward) Transaction
   */
  async claimAll(params: {
    roomId: string;
    vaultId: string;
    playerPositionId: string;
  }): Promise<TxResponse> {
    const tx = new TransactionBlock();

    tx.moveCall({
      target: `${config.packageId}::money_race::claim_all`,
      arguments: [
        tx.object(params.roomId),
        tx.object(params.vaultId),
        tx.object(params.playerPositionId),
      ],
    });

    return this.executeSponsoredTx(tx);
  }

  /**
   * Get Room Data
   */
  async getRoomData(roomId: string): Promise<any> {
    try {
      const object = await suiClient.getObject({
        id: roomId,
        options: { showContent: true },
      });

      return object.data?.content;
    } catch (error) {
      console.error('Failed to fetch room data:', error);
      throw new Error('Room not found');
    }
  }

  /**
   * Get Player Position Data
   */
  async getPlayerPosition(positionId: string): Promise<any> {
    try {
      const object = await suiClient.getObject({
        id: positionId,
        options: { showContent: true },
      });

      return object.data?.content;
    } catch (error) {
      console.error('Failed to fetch player position:', error);
      throw new Error('Player position not found');
    }
  }
}

export const relayerService = new RelayerService();
