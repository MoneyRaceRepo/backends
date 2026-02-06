import { Router } from 'express';
import type { Request, Response } from 'express';
import { relayerService } from '../services/relayer.service.js';
import { sendSuccess, sendError, sendValidationError } from '../utils/response.js';

const router = Router();

/**
 * POST /sponsored/execute
 * Execute a user-signed transaction with sponsor signature
 * This is for proper zkLogin sponsored transactions
 */
router.post('/execute', async (req: Request, res: Response) => {
  try {
    const { txBytes, userSignature } = req.body;

    // Validation
    if (!txBytes || typeof txBytes !== 'string') {
      return sendValidationError(res, 'Transaction bytes required');
    }

    if (!userSignature || typeof userSignature !== 'string') {
      return sendValidationError(res, 'User signature required');
    }

    console.log('Executing sponsored transaction with user signature');

    // Execute with sponsor signature
    const result = await relayerService.executeSponsoredTxWithUserSignature(
      txBytes,
      userSignature
    );

    return sendSuccess(res, {
      digest: result.digest,
      effects: result.effects,
    });
  } catch (error: any) {
    console.error('Sponsored transaction error:', error);
    return sendError(res, error.message || 'Failed to execute sponsored transaction');
  }
});

export default router;
