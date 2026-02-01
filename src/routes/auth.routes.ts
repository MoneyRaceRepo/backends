import { Router } from 'express';
import type { Request, Response } from 'express';
import { zkLoginService } from '../services/zklogin.service.js';

const router = Router();

/**
 * POST /auth/login
 * Authenticate user with Google JWT (zkLogin)
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { jwt } = req.body;

    if (!jwt) {
      return res.status(400).json({ error: 'JWT token required' });
    }

    // Authenticate and get Sui address
    const user = await zkLoginService.authenticateSimplified(jwt);

    res.json({
      success: true,
      user,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(401).json({ error: error.message || 'Authentication failed' });
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
      return res.status(400).json({ error: 'JWT token required' });
    }

    const user = await zkLoginService.authenticateSimplified(jwt);

    res.json({
      valid: true,
      user,
    });
  } catch (error: any) {
    res.status(401).json({ valid: false, error: error.message });
  }
});

export default router;
