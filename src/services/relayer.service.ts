import { TransactionBlock } from '@mysten/sui.js/transactions';
import { bcs } from '@mysten/sui.js/bcs';
import { suiClient } from '../sui/client.js';
import { sponsorKeypair } from '../sui/sponsor.js';
import { config } from '../config/index.js';
import type { TxResponse } from '../types/index.js';
import { keccak_256 } from '@noble/hashes/sha3.js';

/**
 * Transaction Relayer Service
 * Sponsors gas and submits transactions on behalf of users
 */
export class RelayerService {
  /**
   * Execute a sponsored transaction (LEGACY - backend creates and signs tx)
   * The relayer pays for gas, making it gasless for users
   */
  async executeSponsoredTx(tx: TransactionBlock, senderAddress?: string): Promise<TxResponse> {
    try {
      // Don't set sender - let sponsor be the signer
      // Input objects owned by user will still work as long as they're passed correctly

      // Set gas budget
      tx.setGasBudget(100000000); // 0.1 SUI

      // Sign and execute with sponsor keypair
      // SDK will automatically select gas coin from sponsor wallet
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
   * Execute a user-signed sponsored transaction
   * User signs the transaction, sponsor adds gas payment and signature
   * This is the proper way to do zkLogin sponsored transactions
   */
  async executeSponsoredTxWithUserSignature(
    txBytes: Uint8Array | string,
    userSignature: string
  ): Promise<TxResponse> {
    try {
      // Convert txBytes to Uint8Array if it's a string
      const txBytesArray = typeof txBytes === 'string'
        ? Uint8Array.from(Buffer.from(txBytes, 'base64'))
        : txBytes;

      // Check if userSignature is already a multi-sig (array format)
      // Multi-sig format in Sui can be JSON array string like '["sig1", "sig2"]'
      let finalSignature: string | string[];

      // Try to parse as JSON array
      let isMultiSig = false;
      try {
        const parsed = JSON.parse(userSignature);
        if (Array.isArray(parsed)) {
          isMultiSig = true;
          console.log('⚠️ User signature is already multi-sig, using as-is');
          finalSignature = parsed;
        }
      } catch {
        // Not JSON, treat as single signature
      }

      if (!isMultiSig) {
        // Single signature - add sponsor signature
        const sponsorSignature = await sponsorKeypair.signTransactionBlock(txBytesArray);
        finalSignature = [userSignature, sponsorSignature.signature];
        console.log('✅ Added sponsor signature to single user signature');
      }

      // Execute with signature(s)
      const result = await suiClient.executeTransactionBlock({
        transactionBlock: txBytesArray,
        signature: finalSignature,
        options: {
          showEffects: true,
          showEvents: true,
          showObjectChanges: true,
        },
      });

      const success = result.effects?.status?.status === 'success';

      console.log('Sponsored transaction executed:', {
        digest: result.digest,
        success,
      });

      return {
        digest: result.digest,
        success,
        effects: result.effects,
      };
    } catch (error: any) {
      console.error('Sponsored transaction execution failed:', error);
      throw new Error(`Sponsored transaction failed: ${error.message}`);
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
    isPrivate: boolean;
    password: string;
  }): Promise<TxResponse> {
    const tx = new TransactionBlock();

    // Note: isPrivate and password are stored in DB only for now
    // The smart contract create_room doesn't accept these args

    tx.moveCall({
      target: `${config.packageId}::money_race_v2::create_room`,
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
      target: `${config.packageId}::money_race_v2::start_room`,
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
    userAddress: string;
  }): Promise<TxResponse> {
    const tx = new TransactionBlock();

    tx.moveCall({
      target: `${config.packageId}::money_race_v2::join_room_for`,
      arguments: [
        tx.object(params.roomId),
        tx.object(params.vaultId),
        tx.object(params.clockId),
        tx.object(params.coinObjectId),
        tx.pure(params.userAddress, 'address'),
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
      target: `${config.packageId}::money_race_v2::deposit`,
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
      target: `${config.packageId}::money_race_v2::finalize_room`,
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
      target: `${config.packageId}::money_race_v2::fund_reward_pool`,
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
      target: `${config.packageId}::money_race_v2::claim_all`,
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
  async getRoomData(roomId: string, vaultId?: string): Promise<any> {
    try {
      // Validasi format Room ID
      if (!roomId || typeof roomId !== 'string') {
        throw new Error('Invalid room ID format');
      }

      // Pastikan Room ID memiliki prefix 0x
      const normalizedRoomId = roomId.startsWith('0x') ? roomId : `0x${roomId}`;

      console.log('Fetching room data for ID:', normalizedRoomId);

      const object = await suiClient.getObject({
        id: normalizedRoomId,
        options: {
          showContent: true,
          showOwner: true,
          showType: true,
        },
      });

      if (!object.data) {
        throw new Error(`Room object not found for ID: ${normalizedRoomId}`);
      }

      let vaultData: any = null;
      if (vaultId) {
        try {
          const vObj = await suiClient.getObject({
            id: vaultId,
            options: { showContent: true }
          });
          if (vObj.data?.content?.dataType === 'moveObject') {
            vaultData = vObj.data.content.fields;
          }
        } catch (e) {
          console.error(`Failed to fetch vault data for ${vaultId}`, e);
        }
      }

      console.log('Room data fetched successfully:', {
        objectId: object.data.objectId,
        type: object.data.type,
        hasVaultData: !!vaultData
      });

      return { ...object.data?.content, vaultData };
    } catch (error: any) {
      console.error('Failed to fetch room data:', {
        roomId,
        error: error.message,
        code: error.code,
      });
      throw new Error(`Room not found: ${error.message}`);
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

  /**
   * Mint USDC Mock Tokens to a specific recipient
   */
  async mintUSDC(recipient: string, amount: number): Promise<TxResponse> {
    const tx = new TransactionBlock();

    const USDC_FAUCET_ID = config.faucetId || '0x6f101a733c447a22520807012911552c061a3f63a47129e949f5c2af448cc525';
    const CLOCK_ID = '0x6';

    tx.moveCall({
      target: `${config.packageId}::usdc::mint_to`,
      arguments: [
        tx.object(USDC_FAUCET_ID),
        tx.pure(recipient, 'address'),
        tx.pure(amount, 'u64'),
        tx.object(CLOCK_ID),
      ],
    });

    return this.executeSponsoredTx(tx);
  }

  /**
   * Get USDC Balance
   */
  async getUSDCBalance(address: string): Promise<bigint> {
    try {
      const USDC_COIN_TYPE = `${config.packageId}::usdc::USDC`;

      const coins = await suiClient.getCoins({
        owner: address,
        coinType: USDC_COIN_TYPE,
      });

      let totalBalance = 0n;
      for (const coin of coins.data) {
        totalBalance += BigInt(coin.balance);
      }

      return totalBalance;
    } catch (error) {
      console.error('Failed to fetch USDC balance:', error);
      return 0n;
    }
  }

  /**
   * Get USDC Faucet Info (cooldown status)
   */
  async getUSDCFaucetInfo(address: string): Promise<{
    canMint: boolean;
    timeUntilNextMint: number;
    lastMintTime: number | null;
  }> {
    try {
      const USDC_FAUCET_ID = config.faucetId || '0x6f101a733c447a22520807012911552c061a3f63a47129e949f5c2af448cc525';
      const CLOCK_ID = '0x6';

      // Get faucet object to check cooldown
      const faucetObject = await suiClient.getObject({
        id: USDC_FAUCET_ID,
        options: { showContent: true },
      });

      // Get current time from Clock
      const clockObject = await suiClient.getObject({
        id: CLOCK_ID,
        options: { showContent: true },
      });

      // Parse faucet data to check last mint time
      // This is a simplified version - actual implementation would query dynamic fields
      return {
        canMint: true, // Simplified - always allow for now
        timeUntilNextMint: 0,
        lastMintTime: null,
      };
    } catch (error) {
      console.error('Failed to get faucet info:', error);
      return {
        canMint: true,
        timeUntilNextMint: 0,
        lastMintTime: null,
      };
    }
  }
}

export const relayerService = new RelayerService();
