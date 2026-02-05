// User & Auth Types
export interface ZkLoginPayload {
  jwt: string;
  ephemeralPublicKey: string;
  maxEpoch: number;
  jwtRandomness: string;
  salt: string;
}

export interface AuthenticatedUser {
  address: string;
  provider: 'google';
  sub: string;
}

// AI Types
export interface AIPrompt {
  text: string;
  riskTolerance?: 'low' | 'medium' | 'high';
  targetAmount?: number;
  duration?: number;
}

export interface DeFiProtocol {
  name: string;
  type: string; // lending, dex, staking, etc
  apy: string;
  tvl?: string;
}

export interface StrategyRecommendation {
  id: number;
  name: string;
  description: string;
  riskLevel: 'low' | 'medium' | 'high';
  expectedReturn: number; // percentage
  recommended: boolean;
  reasoning?: string;
  protocols?: DeFiProtocol[]; // Real DeFi protocols on Sui
  allocation?: { [key: string]: number }; // Allocation percentages
  suggestedTokens?: string[]; // Token symbols
}

export interface AIRecommendationResponse {
  strategies: StrategyRecommendation[];
  userPrompt: string;
  parsedIntent?: {
    riskTolerance?: string;
    goal?: string;
  };
}

// Transaction Types
export interface SponsoredTxRequest {
  userAddress: string;
  txData: {
    target: string;
    arguments: any[];
    typeArguments?: string[];
  };
}

export interface TxResponse {
  digest: string;
  success: boolean;
  effects?: any;
}

// Smart Contract Data Types
export interface RoomData {
  id: string;
  totalPeriods: number;
  depositAmount: number;
  strategyId: number;
  status: 0 | 1 | 2; // OPEN | ACTIVE | FINISHED
  startTimeMs: number;
  periodLengthMs: number;
  totalWeight: number;
  vaultId?: string;
}

export interface PlayerPositionData {
  id: string;
  owner: string;
  depositedCount: number;
  lastPeriod: number;
  claimed: boolean;
}

// API Request/Response Types
export interface CreateRoomRequest {
  totalPeriods: number;
  depositAmount: number;
  strategyId: number;
  startTimeMs: number;
  periodLengthMs: number;
}

export interface JoinRoomRequest {
  roomId: string;
  vaultId: string;
  amount: number;
}

export interface DepositRequest {
  roomId: string;
  vaultId: string;
  playerPositionId: string;
  amount: number;
}

export interface ClaimRequest {
  roomId: string;
  vaultId: string;
  playerPositionId: string;
}

// EigenAI Types
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionRequest {
  model?: string;
  messages: ChatMessage[];
  max_tokens?: number;
  chat_template_kwargs?: {
    thinking?: boolean;
  };
  temperature?: number;
  top_p?: number;
  top_k?: number;
  stream?: boolean;
}

export interface ChatCompletionChoice {
  index: number;
  message: ChatMessage;
  finish_reason: string;
}

export interface ChatCompletionUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: ChatCompletionChoice[];
  usage: ChatCompletionUsage;
}
