import type {
  AIPrompt,
  AIRecommendationResponse,
  StrategyRecommendation,
  ChatMessage,
  ChatCompletionRequest,
  ChatCompletionResponse,
} from '../types/index.js';

/**
 * AI Service using EigenAI deepseek-v31-terminus model
 * Provides strategy recommendations and financial analysis
 */
export class AIService {
  private apiKey: string;
  private baseUrl: string = 'https://api-web.eigenai.com/api/v1';
  private defaultModel: string = 'deepseek-v31-terminus';

  // Dummy strategies for fallback and structure reference
  private strategies: StrategyRecommendation[] = [
    {
      id: 0,
      name: 'Stable Saver',
      description:
        'Low-risk strategy focused on steady, predictable growth. Perfect for conservative savers.',
      riskLevel: 'low',
      expectedReturn: 5, // 5% APY
      recommended: false,
    },
    {
      id: 1,
      name: 'Balanced Builder',
      description:
        'Medium-risk strategy balancing growth and stability. Ideal for consistent savers.',
      riskLevel: 'medium',
      expectedReturn: 12, // 12% APY
      recommended: false,
    },
    {
      id: 2,
      name: 'Growth Chaser',
      description:
        'Higher-risk strategy targeting maximum returns. Best for aggressive savers.',
      riskLevel: 'high',
      expectedReturn: 25, // 25% APY
      recommended: false,
    },
  ];

  constructor() {
    this.apiKey = process.env.EIGENAI_API_KEY || '';

    if (!this.apiKey) {
      console.warn(
        'EIGENAI_API_KEY not set - falling back to dummy AI responses'
      );
    }
  }

  /**
   * Send chat completion request to EigenAI
   */
  async chatCompletion(
    messages: ChatMessage[],
    options?: Partial<ChatCompletionRequest>
  ): Promise<ChatCompletionResponse> {
    if (!this.apiKey) {
      throw new Error('EIGENAI_API_KEY not configured');
    }

    const payload: ChatCompletionRequest = {
      model: options?.model || this.defaultModel,
      messages,
      max_tokens: options?.max_tokens || 8192,
      chat_template_kwargs: {
        thinking: options?.chat_template_kwargs?.thinking ?? false,
      },
      temperature: options?.temperature ?? 0.7,
      top_p: options?.top_p ?? 0.95,
      top_k: options?.top_k ?? 1,
      stream: options?.stream ?? false,
    };

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `EigenAI API request failed: ${response.status} ${errorText}`
        );
      }

      const result = (await response.json()) as ChatCompletionResponse;
      return result;
    } catch (error: any) {
      console.error('AI chat completion failed:', error.message);
      throw new Error(`AI chat completion failed: ${error.message}`);
    }
  }

  /**
   * Simple chat helper for single user message
   */
  async chat(
    userMessage: string,
    systemPrompt?: string,
    options?: Partial<ChatCompletionRequest>
  ): Promise<string> {
    const messages: ChatMessage[] = [];

    if (systemPrompt) {
      messages.push({
        role: 'system',
        content: systemPrompt,
      });
    }

    messages.push({
      role: 'user',
      content: userMessage,
    });

    const response = await this.chatCompletion(messages, options);

    if (!response.choices || response.choices.length === 0) {
      throw new Error('No response from AI');
    }

    return response.choices[0]?.message.content || '';
  }

  /**
   * Get strategy recommendations using AI (or fallback to dummy data)
   */
  async getRecommendations(
    prompt: AIPrompt
  ): Promise<AIRecommendationResponse> {
    // If API key not available, use fallback logic
    if (!this.apiKey) {
      return this.getFallbackRecommendations(prompt);
    }

    try {
      const systemPrompt = `You are a DeFi financial advisor for the Sui blockchain. Analyze user requests and recommend investment strategies.

Available strategies:
1. Stable Saver (Low Risk, ~5% APY) - Conservative, steady growth
2. Balanced Builder (Medium Risk, ~12% APY) - Balanced growth and stability
3. Growth Chaser (High Risk, ~25% APY) - Aggressive, maximum returns

Respond ONLY with valid JSON in this exact format:
{
  "recommendedStrategyId": 0,
  "reasoning": "brief explanation",
  "parsedIntent": {
    "riskTolerance": "low|medium|high",
    "goal": "brief goal description"
  }
}`;

      const aiResponse = await this.chat(prompt.text, systemPrompt, {
        temperature: 0.7,
        max_tokens: 1024,
      });

      // Strip markdown code blocks if present (```json ... ```)
      let cleanResponse = aiResponse.trim();
      if (cleanResponse.startsWith('```')) {
        // Remove opening ```json or ```
        cleanResponse = cleanResponse.replace(/^```(?:json)?\s*\n?/, '');
        // Remove closing ```
        cleanResponse = cleanResponse.replace(/\n?```\s*$/, '');
      }

      // Parse AI response
      const parsed = JSON.parse(cleanResponse);
      const strategies = this.strategies.map((s) => ({
        ...s,
        recommended: s.id === parsed.recommendedStrategyId,
        reasoning:
          s.id === parsed.recommendedStrategyId
            ? parsed.reasoning
            : undefined,
      }));

      return {
        strategies,
        userPrompt: prompt.text,
        parsedIntent: parsed.parsedIntent,
      };
    } catch (error: any) {
      console.error('AI recommendation failed, using fallback:', error.message);
      return this.getFallbackRecommendations(prompt);
    }
  }

  /**
   * Fallback to simple keyword-based recommendations
   */
  private getFallbackRecommendations(
    prompt: AIPrompt
  ): AIRecommendationResponse {
    const intent = this.parseIntent(prompt.text);
    const strategies: StrategyRecommendation[] = this.strategies.map((s) => ({
      ...s,
      recommended: false,
    }));

    let recommendedIndex = 1;
    let reasoning =
      'Based on your goals, this balanced approach offers a good mix of safety and growth.';

    if (intent.riskTolerance === 'low' || intent.keywords.includes('safe')) {
      recommendedIndex = 0;
      reasoning =
        'Your preference for stability makes this conservative strategy a perfect fit.';
    } else if (
      intent.riskTolerance === 'high' ||
      intent.keywords.includes('aggressive')
    ) {
      recommendedIndex = 2;
      reasoning =
        'Your growth-focused goals align well with this higher-risk, higher-reward strategy.';
    }

    strategies[recommendedIndex]!.recommended = true;
    strategies[recommendedIndex]!.reasoning = reasoning;

    return {
      strategies,
      userPrompt: prompt.text,
      parsedIntent: intent.goal
        ? {
            riskTolerance: intent.riskTolerance,
            goal: intent.goal,
          }
        : {
            riskTolerance: intent.riskTolerance,
          },
    };
  }

  /**
   * Parse user intent from free-text prompt (fallback method)
   */
  private parseIntent(text: string): {
    riskTolerance: 'low' | 'medium' | 'high';
    goal?: string;
    keywords: string[];
  } {
    const lowerText = text.toLowerCase();
    const keywords: string[] = [];

    const lowRiskKeywords = [
      'safe',
      'secure',
      'stable',
      'conservative',
      'protect',
    ];
    const highRiskKeywords = [
      'aggressive',
      'growth',
      'maximum',
      'risky',
      'high return',
    ];
    const balancedKeywords = ['balanced', 'moderate', 'steady', 'consistent'];

    let riskTolerance: 'low' | 'medium' | 'high' = 'medium';

    if (lowRiskKeywords.some((kw) => lowerText.includes(kw))) {
      riskTolerance = 'low';
      keywords.push('safe');
    } else if (highRiskKeywords.some((kw) => lowerText.includes(kw))) {
      riskTolerance = 'high';
      keywords.push('aggressive');
    } else if (balancedKeywords.some((kw) => lowerText.includes(kw))) {
      riskTolerance = 'medium';
      keywords.push('balance');
    }

    let goal: string | undefined;
    if (lowerText.includes('retire')) goal = 'retirement';
    else if (lowerText.includes('house') || lowerText.includes('home'))
      goal = 'house';
    else if (lowerText.includes('emergency')) goal = 'emergency fund';
    else if (lowerText.includes('vacation')) goal = 'vacation';
    else goal = 'general savings';

    return { riskTolerance, goal, keywords };
  }

  /**
   * Get strategy by ID
   */
  getStrategyById(id: number): StrategyRecommendation | undefined {
    return this.strategies.find((s) => s.id === id);
  }

  /**
   * Get all strategies
   */
  getAllStrategies(): StrategyRecommendation[] {
    return this.strategies.map((s) => ({ ...s }));
  }

  /**
   * General purpose chat endpoint
   */
  async generalChat(
    messages: ChatMessage[],
    options?: Partial<ChatCompletionRequest>
  ): Promise<ChatCompletionResponse> {
    if (!this.apiKey) {
      throw new Error('EIGENAI_API_KEY not configured');
    }

    return await this.chatCompletion(messages, options);
  }
}

export const aiService = new AIService();
