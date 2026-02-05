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

  // Real DeFi strategies with Sui protocols
  private strategies: StrategyRecommendation[] = [
    {
      id: 1, // Conservative (matches smart contract STRATEGY_CONSERVATIVE)
      name: 'Conservative',
      description:
        'Low-risk strategy using stable lending protocols and liquid staking on Sui. Focus on capital preservation with steady yields.',
      riskLevel: 'low',
      expectedReturn: 4, // 4% APY (matches smart contract)
      recommended: false,
      protocols: [
        { name: 'Scallop', type: 'Lending Protocol', apy: '3-5%', tvl: '$50M+' },
        { name: 'Navi Protocol', type: 'Money Market', apy: '2-4%', tvl: '$100M+' },
        { name: 'Aftermath Finance', type: 'Liquid Staking', apy: '3-6%', tvl: '$30M+' },
      ],
      allocation: { scallop: 50, navi: 30, aftermath: 20 },
      suggestedTokens: ['USDC', 'USDT', 'SUI'],
    },
    {
      id: 2, // Balanced (matches smart contract STRATEGY_BALANCED)
      name: 'Balanced',
      description:
        'Medium-risk strategy combining lending protocols with moderate DEX exposure. Balance between yield and growth opportunities.',
      riskLevel: 'medium',
      expectedReturn: 8, // 8% APY (matches smart contract)
      recommended: false,
      protocols: [
        { name: 'Scallop', type: 'Lending Protocol', apy: '4-6%', tvl: '$50M+' },
        { name: 'Cetus', type: 'DEX/AMM', apy: '8-12%', tvl: '$200M+' },
        { name: 'Turbos Finance', type: 'DEX', apy: '7-10%', tvl: '$80M+' },
        { name: 'Navi Protocol', type: 'Money Market', apy: '3-5%', tvl: '$100M+' },
      ],
      allocation: { scallop: 35, cetus: 35, turbos: 20, navi: 10 },
      suggestedTokens: ['USDC', 'SUI', 'CETUS', 'USDT'],
    },
    {
      id: 3, // Aggressive (matches smart contract STRATEGY_AGGRESSIVE)
      name: 'Aggressive',
      description:
        'High-risk strategy focused on maximum yields through DEX liquidity provision and high APY farming. Suitable for risk-tolerant users.',
      riskLevel: 'high',
      expectedReturn: 15, // 15% APY (matches smart contract)
      recommended: false,
      protocols: [
        { name: 'Cetus', type: 'DEX/AMM', apy: '15-25%', tvl: '$200M+' },
        { name: 'Kriya DEX', type: 'DEX', apy: '12-20%', tvl: '$60M+' },
        { name: 'Turbos Finance', type: 'Concentrated Liquidity', apy: '10-18%', tvl: '$80M+' },
        { name: 'Aftermath Finance', type: 'Yield Farming', apy: '15-30%', tvl: '$30M+' },
      ],
      allocation: { cetus: 40, kriya: 30, turbos: 20, aftermath: 10 },
      suggestedTokens: ['SUI', 'CETUS', 'USDC', 'WETH'],
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
   * Validate if user prompt is meaningful
   */
  private isValidPrompt(text: string): { valid: boolean; reason?: string } {
    const trimmed = text.trim();

    // Check minimum length
    if (trimmed.length < 10) {
      return { valid: false, reason: 'Prompt is too short. Please explain your investment goals in more detail.' };
    }

    // Check if it's just random characters or numbers
    if (/^[^a-zA-Z]*$/.test(trimmed)) {
      return { valid: false, reason: 'Invalid prompt. Please use clear sentences to explain your needs.' };
    }

    // Check for gibberish (too many consonants in a row)
    if (/[bcdfghjklmnpqrstvwxyz]{7,}/i.test(trimmed)) {
      return { valid: false, reason: 'Prompt cannot be understood. Please use meaningful sentences.' };
    }

    // Check if prompt contains at least some meaningful words
    const meaningfulWords = ['invest', 'saving', 'money', 'risk', 'return', 'growth', 'stable', 'aggressive', 'profit', 'fund',
                              'investasi', 'tabungan', 'uang', 'risiko', 'hasil', 'pertumbuhan', 'stabil', 'agresif', 'keuntungan', 'dana'];
    const lowerText = trimmed.toLowerCase();
    const hasRelatedWords = meaningfulWords.some(word => lowerText.includes(word)) ||
                           lowerText.includes('defi') ||
                           lowerText.includes('crypto') ||
                           lowerText.includes('apy') ||
                           lowerText.includes('yield');

    if (!hasRelatedWords && trimmed.length < 30) {
      return { valid: false, reason: 'I don\'t understand your request. Please explain your investment goals or risk preferences (e.g., "I want a safe investment with low risk" or "I\'m looking for maximum returns").' };
    }

    return { valid: true };
  }

  /**
   * Get strategy recommendations using AI (or fallback to dummy data)
   */
  async getRecommendations(
    prompt: AIPrompt
  ): Promise<AIRecommendationResponse> {
    // Validate prompt first
    const validation = this.isValidPrompt(prompt.text);
    if (!validation.valid) {
      throw new Error(validation.reason || 'Invalid prompt');
    }

    // If API key not available, use fallback logic
    if (!this.apiKey) {
      return this.getFallbackRecommendations(prompt);
    }

    try {
      const systemPrompt = `You are an AI advisor for MoneyRace, a DeFi protocol on Sui blockchain. Your task is to analyze user needs and recommend the most suitable investment strategy.

**AVAILABLE STRATEGIES:**

1. **Conservative (ID: 1)** - Low Risk, ~4% APY
   - Protocols: Scallop (Lending 3-5%), Navi Protocol (Money Market 2-4%), Aftermath Finance (Liquid Staking 3-6%)
   - Allocation: Scallop 50%, Navi 30%, Aftermath 20%
   - Tokens: USDC, USDT, SUI
   - Best for: Capital preservation, steady income, risk-averse users

2. **Balanced (ID: 2)** - Medium Risk, ~8% APY
   - Protocols: Scallop (Lending 4-6%), Cetus (DEX/AMM 8-12%), Turbos Finance (DEX 7-10%), Navi (3-5%)
   - Allocation: Scallop 35%, Cetus 35%, Turbos 20%, Navi 10%
   - Tokens: USDC, SUI, CETUS, USDT
   - Best for: Balanced risk/reward, moderate risk tolerance, consistent growth

3. **Aggressive (ID: 3)** - High Risk, ~15% APY
   - Protocols: Cetus (DEX/AMM 15-25%), Kriya DEX (12-20%), Turbos Finance (10-18%), Aftermath Finance (Yield Farming 15-30%)
   - Allocation: Cetus 40%, Kriya 30%, Turbos 20%, Aftermath 10%
   - Tokens: SUI, CETUS, USDC, WETH
   - Best for: Maximum returns, high risk tolerance, growth-focused

**INSTRUCTIONS:**
1. Carefully analyze the user prompt
2. If prompt is UNCLEAR or NOT RELEVANT to investment/DeFi, return: {"error": true, "message": "I don't understand your request..."}
3. If prompt is VALID, recommend the MOST SUITABLE strategy
4. Provide SPECIFIC reasoning mentioning DeFi protocols and why they fit user needs

**OUTPUT FORMAT (JSON only):**
{
  "recommendedStrategyId": 1 | 2 | 3,
  "reasoning": "Detailed explanation in English mentioning specific protocols (Scallop/Cetus/Kriya/etc) and why they fit user needs",
  "parsedIntent": {
    "riskTolerance": "low" | "medium" | "high",
    "goal": "specific investment goal"
  }
}

IMPORTANT: Respond ONLY with JSON, no other text!`;

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

      // Check if AI detected invalid/unclear prompt
      if (parsed.error) {
        throw new Error(parsed.message || 'AI cannot understand your prompt.');
      }

      // Validate strategy ID
      if (![1, 2, 3].includes(parsed.recommendedStrategyId)) {
        throw new Error('Invalid strategy ID from AI');
      }

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
   * Fallback to simple keyword-based recommendations with real DeFi protocols
   */
  private getFallbackRecommendations(
    prompt: AIPrompt
  ): AIRecommendationResponse {
    const intent = this.parseIntent(prompt.text);
    const strategies: StrategyRecommendation[] = this.strategies.map((s) => ({
      ...s,
      recommended: false,
    }));

    let recommendedId = 2; // Default to Balanced
    let reasoning =
      'Based on our analysis, we recommend the Balanced strategy with a combination of Scallop (lending 35%), Cetus DEX (35%), Turbos Finance (20%), and Navi Protocol (10%). This provides a good balance between security and growth with a potential 8% APY.';

    if (intent.riskTolerance === 'low' || intent.keywords.includes('safe')) {
      recommendedId = 1;
      reasoning =
        'For your conservative risk profile, we recommend the Conservative strategy focused on Scallop (lending 50%), Navi Protocol (30%), and Aftermath Finance liquid staking (20%). These protocols offer stable 4% yields with minimal risk.';
    } else if (
      intent.riskTolerance === 'high' ||
      intent.keywords.includes('aggressive')
    ) {
      recommendedId = 3;
      reasoning =
        'For maximum growth targets, we recommend the Aggressive strategy with allocation to Cetus DEX (40%), Kriya DEX (30%), Turbos Finance (20%), and Aftermath Finance yield farming (10%). This combination targets 15%+ APY with higher risk.';
    }

    const recommendedIndex = this.strategies.findIndex((s) => s.id === recommendedId);
    if (recommendedIndex !== -1) {
      strategies[recommendedIndex]!.recommended = true;
      strategies[recommendedIndex]!.reasoning = reasoning;
    }

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
   * Supports both English and Indonesian
   */
  private parseIntent(text: string): {
    riskTolerance: 'low' | 'medium' | 'high';
    goal?: string;
    keywords: string[];
  } {
    const lowerText = text.toLowerCase();
    const keywords: string[] = [];

    const lowRiskKeywords = [
      'safe', 'secure', 'stable', 'conservative', 'protect',
      'aman', 'stabil', 'konservatif', 'lindung', 'rendah risiko', 'low risk'
    ];
    const highRiskKeywords = [
      'aggressive', 'growth', 'maximum', 'risky', 'high return', 'maksimal',
      'agresif', 'pertumbuhan', 'tinggi', 'berisiko', 'hasil tinggi', 'profit besar'
    ];
    const balancedKeywords = [
      'balanced', 'moderate', 'steady', 'consistent',
      'seimbang', 'moderat', 'stabil', 'konsisten', 'sedang'
    ];

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
    if (lowerText.includes('retire') || lowerText.includes('pensiun'))
      goal = 'retirement';
    else if (lowerText.includes('house') || lowerText.includes('home') || lowerText.includes('rumah'))
      goal = 'house purchase';
    else if (lowerText.includes('emergency') || lowerText.includes('darurat'))
      goal = 'emergency fund';
    else if (lowerText.includes('vacation') || lowerText.includes('liburan'))
      goal = 'vacation';
    else if (lowerText.includes('education') || lowerText.includes('pendidikan') || lowerText.includes('kuliah'))
      goal = 'education';
    else if (lowerText.includes('business') || lowerText.includes('bisnis') || lowerText.includes('usaha'))
      goal = 'business capital';
    else
      goal = 'general investment';

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
