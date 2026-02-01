import type { AIPrompt, AIRecommendationResponse, StrategyRecommendation } from '../types/index.js';

/**
 * AI Service
 * Provides strategy recommendations based on user prompts
 * MVP: Uses dummy strategies with simple intent parsing
 */
export class AIService {
  // Dummy strategies for hackathon MVP
  private strategies: StrategyRecommendation[] = [
    {
      id: 0,
      name: 'Stable Saver',
      description: 'Low-risk strategy focused on steady, predictable growth. Perfect for conservative savers.',
      riskLevel: 'low',
      expectedReturn: 5, // 5% APY
      recommended: false,
    },
    {
      id: 1,
      name: 'Balanced Builder',
      description: 'Medium-risk strategy balancing growth and stability. Ideal for consistent savers.',
      riskLevel: 'medium',
      expectedReturn: 12, // 12% APY
      recommended: false,
    },
    {
      id: 2,
      name: 'Growth Chaser',
      description: 'Higher-risk strategy targeting maximum returns. Best for aggressive savers.',
      riskLevel: 'high',
      expectedReturn: 25, // 25% APY
      recommended: false,
    },
  ];

  /**
   * Get strategy recommendations based on user prompt
   */
  async getRecommendations(prompt: AIPrompt): Promise<AIRecommendationResponse> {
    // Parse user intent from prompt
    const intent = this.parseIntent(prompt.text);

    // Clone strategies and mark recommended one
    const strategies: StrategyRecommendation[] = this.strategies.map(s => ({
      ...s,
      recommended: false,
    }));

    // Determine recommended strategy based on intent
    let recommendedIndex = 1; // Default: Balanced
    let reasoning = 'Based on your goals, this balanced approach offers a good mix of safety and growth.';

    if (intent.riskTolerance === 'low' || intent.keywords.includes('safe')) {
      recommendedIndex = 0;
      reasoning = 'Your preference for stability makes this conservative strategy a perfect fit.';
    } else if (intent.riskTolerance === 'high' || intent.keywords.includes('aggressive')) {
      recommendedIndex = 2;
      reasoning = 'Your growth-focused goals align well with this higher-risk, higher-reward strategy.';
    } else if (intent.keywords.includes('balance') || intent.keywords.includes('steady')) {
      recommendedIndex = 1;
      reasoning = 'A balanced approach suits your steady saving goals while maintaining growth potential.';
    }

    strategies[recommendedIndex]!.recommended = true;
    strategies[recommendedIndex]!.reasoning = reasoning;

    return {
      strategies,
      userPrompt: prompt.text,
      parsedIntent: intent.goal ? {
        riskTolerance: intent.riskTolerance,
        goal: intent.goal,
      } : {
        riskTolerance: intent.riskTolerance,
      },
    };
  }

  /**
   * Parse user intent from free-text prompt
   * Simple keyword-based parsing for MVP
   */
  private parseIntent(text: string): {
    riskTolerance: 'low' | 'medium' | 'high';
    goal?: string;
    keywords: string[];
  } {
    const lowerText = text.toLowerCase();
    const keywords: string[] = [];

    // Risk tolerance keywords
    const lowRiskKeywords = ['safe', 'secure', 'stable', 'conservative', 'protect'];
    const highRiskKeywords = ['aggressive', 'growth', 'maximum', 'risky', 'high return'];
    const balancedKeywords = ['balanced', 'moderate', 'steady', 'consistent'];

    let riskTolerance: 'low' | 'medium' | 'high' = 'medium';

    // Check for risk keywords
    if (lowRiskKeywords.some(kw => lowerText.includes(kw))) {
      riskTolerance = 'low';
      keywords.push('safe');
    } else if (highRiskKeywords.some(kw => lowerText.includes(kw))) {
      riskTolerance = 'high';
      keywords.push('aggressive');
    } else if (balancedKeywords.some(kw => lowerText.includes(kw))) {
      riskTolerance = 'medium';
      keywords.push('balance');
    }

    // Extract goal
    let goal: string | undefined;
    if (lowerText.includes('retire')) goal = 'retirement';
    else if (lowerText.includes('house') || lowerText.includes('home')) goal = 'house';
    else if (lowerText.includes('emergency')) goal = 'emergency fund';
    else if (lowerText.includes('vacation')) goal = 'vacation';
    else goal = 'general savings';

    return { riskTolerance, goal, keywords };
  }

  /**
   * Get strategy by ID
   */
  getStrategyById(id: number): StrategyRecommendation | undefined {
    return this.strategies.find(s => s.id === id);
  }

  /**
   * Get all strategies
   */
  getAllStrategies(): StrategyRecommendation[] {
    return this.strategies.map(s => ({ ...s }));
  }
}

export const aiService = new AIService();
