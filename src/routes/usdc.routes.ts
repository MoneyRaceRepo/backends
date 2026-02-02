import { Router } from 'express';
import type { Request, Response } from 'express';
import { relayerService } from '../services/relayer.service.js';

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
      return res.status(400).json({ error: 'Recipient address required' });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // Max 1000 USDC per mint (1000 * 10^6 = 1000000000)
    const MAX_MINT = 1000000000;
    if (amount > MAX_MINT) {
      return res.status(400).json({
        error: 'Amount too large',
        hint: 'Maximum 1000 USDC per mint'
      });
    }

    // Mint USDC via gasless transaction to the recipient address
    const result = await relayerService.mintUSDC(recipient, amount);

    res.json({
      success: result.success,
      digest: result.digest,
      effects: result.effects,
      recipient: recipient,
      amount: amount,
    });
  } catch (error: any) {
    console.error('Mint USDC error:', error);

    // Handle cooldown error
    if (error.message?.includes('COOLDOWN_NOT_PASSED')) {
      return res.status(429).json({
        error: 'Cooldown period not passed',
        hint: 'You can mint USDC once every 24 hours. Please try again later.'
      });
    }

    res.status(500).json({ error: error.message || 'Failed to mint USDC' });
  }
});

/**
 * GET /usdc/balance/:address
 * Get USDC balance for an address
 */
router.get('/balance/:address', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;

    if (!address) {
      return res.status(400).json({ error: 'Address required' });
    }

    // Get USDC balance from blockchain
    const balance = await relayerService.getUSDCBalance(address);

    res.json({
      success: true,
      address,
      balance: balance.toString(),
      balanceFormatted: (Number(balance) / 1_000_000).toFixed(2), // 6 decimals
    });
  } catch (error: any) {
    console.error('Get balance error:', error);
    res.status(500).json({ error: error.message || 'Failed to get balance' });
  }
});

/**
 * GET /usdc/faucet/:address
 * Check if user can mint (cooldown status)
 */
router.get('/faucet/:address', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;

    if (!address) {
      return res.status(400).json({ error: 'Address required' });
    }

    // Check cooldown status
    const faucetInfo = await relayerService.getUSDCFaucetInfo(address);

    res.json({
      success: true,
      canMint: faucetInfo.canMint,
      timeUntilNextMint: faucetInfo.timeUntilNextMint,
      lastMintTime: faucetInfo.lastMintTime,
    });
  } catch (error: any) {
    console.error('Get faucet info error:', error);
    res.status(500).json({ error: error.message || 'Failed to get faucet info' });
  }
});

export default router;
