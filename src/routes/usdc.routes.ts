import { Router } from 'express';
import type { Request, Response } from 'express';
import { relayerService } from '../services/relayer.service.js';
import { MAX_USDC_MINT_UNITS, USDC_DECIMALS } from '../constants/index.js';
import { sendSuccess, sendValidationError, sendError } from '../utils/response.js';

const router = Router();

/**
 * POST /usdc/mint
 * Mint USDC mock tokens (gasless via zkLogin)
 */
router.post('/mint', async (req: Request, res: Response) => {
  try {
    const { recipient, amount } = req.body;

    // Validation
    if (!recipient || typeof recipient !== 'string') {
      return sendValidationError(res, 'Recipient address required');
    }

    if (!amount || amount <= 0) {
      return sendValidationError(res, 'Invalid amount');
    }

    // Max 1000 USDC per mint
    if (amount > MAX_USDC_MINT_UNITS) {
      return sendValidationError(res, 'Amount too large. Maximum 1000 USDC per mint');
    }

    // Mint USDC via gasless transaction to the recipient address
    const result = await relayerService.mintUSDC(recipient, amount);

    return sendSuccess(res, {
      digest: result.digest,
      effects: result.effects,
      recipient,
      amount,
    });
  } catch (error: any) {
    console.error('Mint USDC error:', error);

    // Handle cooldown error
    if (error.message?.includes('COOLDOWN_NOT_PASSED')) {
      return sendError(res, 'Cooldown period not passed. You can mint USDC once every 24 hours.', 429);
    }

    return sendError(res, error.message || 'Failed to mint USDC');
  }
});

/**
 * GET /usdc/balance/:address
 * Get USDC balance for an address
 */
router.get('/balance/:address', async (req: Request, res: Response) => {
  try {
    const address = req.params.address as string;

    if (!address) {
      return sendValidationError(res, 'Address required');
    }

    // Get USDC balance from blockchain
    const balance = await relayerService.getUSDCBalance(address);

    return sendSuccess(res, {
      address,
      balance: balance.toString(),
      balanceFormatted: (Number(balance) / USDC_DECIMALS).toFixed(2),
    });
  } catch (error: any) {
    console.error('Get balance error:', error);
    return sendError(res, error.message || 'Failed to get balance');
  }
});

/**
 * GET /usdc/faucet/:address
 * Check if user can mint (cooldown status)
 */
router.get('/faucet/:address', async (req: Request, res: Response) => {
  try {
    const address = req.params.address as string;

    if (!address) {
      return sendValidationError(res, 'Address required');
    }

    // Check cooldown status
    const faucetInfo = await relayerService.getUSDCFaucetInfo(address);

    return sendSuccess(res, {
      canMint: faucetInfo.canMint,
      timeUntilNextMint: faucetInfo.timeUntilNextMint,
      lastMintTime: faucetInfo.lastMintTime,
    });
  } catch (error: any) {
    console.error('Get faucet info error:', error);
    return sendError(res, error.message || 'Failed to get faucet info');
  }
});

export default router;
