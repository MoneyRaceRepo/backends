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
 * POST /ai/chat
 * General purpose chat completion with EigenAI
 */
router.post('/chat', async (req: Request, res: Response) => {
  try {
    const { messages, options } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array required' });
    }

    // Validate message format
    for (const msg of messages) {
      if (!msg.role || !msg.content) {
        return res.status(400).json({
          error: 'Each message must have role and content',
        });
      }
      if (!['system', 'user', 'assistant'].includes(msg.role)) {
        return res.status(400).json({
          error: 'Invalid message role. Must be system, user, or assistant',
        });
      }
    }

    const response = await aiService.generalChat(messages, options);

    res.json({
      success: true,
      response,
    });
  } catch (error: any) {
    console.error('AI chat error:', error);
    res.status(500).json({
      error: error.message || 'Failed to complete chat',
    });
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
