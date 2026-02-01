import { Router } from 'express';
import type { Request, Response } from 'express';
import { aiService } from '../services/ai.service.js';

const router = Router();

/**
 * POST /ai/recommend
 * Get AI strategy recommendations based on user prompt
 */
router.post('/recommend', async (req: Request, res: Response) => {
  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt text required' });
    }

    const recommendations = await aiService.getRecommendations({ text: prompt });

    res.json({
      success: true,
      ...recommendations,
    });
  } catch (error: any) {
    console.error('AI recommendation error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate recommendations' });
  }
});

/**
 * GET /ai/strategies
 * Get all available strategies
 */
router.get('/strategies', (_req: Request, res: Response) => {
  const strategies = aiService.getAllStrategies();
  res.json({ strategies });
});

/**
 * GET /ai/strategies/:id
 * Get specific strategy by ID
 */
router.get('/strategies/:id', (req: Request, res: Response) => {
  const idParam = req.params.id;

  if (!idParam || Array.isArray(idParam)) {
    return res.status(400).json({ error: 'Invalid strategy ID' });
  }

  const id = parseInt(idParam);

  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid strategy ID' });
  }

  const strategy = aiService.getStrategyById(id);

  if (!strategy) {
    return res.status(404).json({ error: 'Strategy not found' });
  }

  res.json({ strategy });
});

export default router;
