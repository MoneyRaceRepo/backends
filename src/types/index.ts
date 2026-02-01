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

export interface StrategyRecommendation {
  id: number;
  name: string;
  description: string;
  riskLevel: 'low' | 'medium' | 'high';
  expectedReturn: number; // percentage
  recommended: boolean;
  reasoning?: string;
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
