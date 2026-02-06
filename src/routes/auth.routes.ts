import { Router } from 'express';
import type { Request, Response } from 'express';
import { zkLoginService } from '../services/zklogin.service.js';
import { sendSuccess, sendValidationError, sendUnauthorized } from '../utils/response.js';

const router = Router();

/**
 * POST /auth/login
 * Authenticate user with Google JWT (zkLogin)
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { jwt } = req.body;

    if (!jwt) {
      return sendValidationError(res, 'JWT token required');
    }

    // Authenticate and get Sui address
    const user = await zkLoginService.authenticateSimplified(jwt);

    return sendSuccess(res, { user });
  } catch (error: any) {
    console.error('Login error:', error);
    return sendUnauthorized(res, error.message || 'Authentication failed');
  }
});

/**
 * POST /auth/verify
 * Verify JWT token and return user info
 */
router.post('/verify', async (req: Request, res: Response) => {
  try {
    const { jwt } = req.body;

    if (!jwt) {
      return sendValidationError(res, 'JWT token required');
    }

    const user = await zkLoginService.authenticateSimplified(jwt);

    return sendSuccess(res, { valid: true, user });
  } catch (error: any) {
    return sendUnauthorized(res, error.message);
  }
});

export default router;
