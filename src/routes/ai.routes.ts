import { Router } from 'express';
import type { Request, Response } from 'express';
import { aiService } from '../services/ai.service.js';
import { sendSuccess, sendError, sendValidationError, sendNotFound } from '../utils/response.js';

const router = Router();

/**
 * POST /ai/recommend
 * Get AI strategy recommendations based on user prompt
 */
router.post('/recommend', async (req: Request, res: Response) => {
  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return sendValidationError(res, 'Prompt text required');
    }

    const recommendations = await aiService.getRecommendations({ text: prompt });

    return sendSuccess(res, recommendations);
  } catch (error: any) {
    console.error('AI recommendation error:', error);
    return sendError(res, error.message || 'Failed to generate recommendations');
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
      return sendValidationError(res, 'Messages array required');
    }

    // Validate message format
    for (const msg of messages) {
      if (!msg.role || !msg.content) {
        return sendValidationError(res, 'Each message must have role and content');
      }
      if (!['system', 'user', 'assistant'].includes(msg.role)) {
        return sendValidationError(res, 'Invalid message role. Must be system, user, or assistant');
      }
    }

    const response = await aiService.generalChat(messages, options);

    return sendSuccess(res, { response });
  } catch (error: any) {
    console.error('AI chat error:', error);
    return sendError(res, error.message || 'Failed to complete chat');
  }
});

/**
 * GET /ai/strategies
 * Get all available strategies
 */
router.get('/strategies', (_req: Request, res: Response) => {
  const strategies = aiService.getAllStrategies();
  return sendSuccess(res, { strategies });
});

/**
 * GET /ai/strategies/:id
 * Get specific strategy by ID
 */
router.get('/strategies/:id', (req: Request, res: Response) => {
  const idParam = req.params.id;

  if (!idParam || Array.isArray(idParam)) {
    return sendValidationError(res, 'Invalid strategy ID');
  }

  const id = parseInt(idParam);

  if (isNaN(id)) {
    return sendValidationError(res, 'Invalid strategy ID');
  }

  const strategy = aiService.getStrategyById(id);

  if (!strategy) {
    return sendNotFound(res, 'Strategy');
  }

  return sendSuccess(res, { strategy });
});

export default router;
