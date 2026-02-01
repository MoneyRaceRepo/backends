import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server
  port: parseInt(process.env.PORT || '3001'),
  nodeEnv: process.env.NODE_ENV || 'development',

  // Sui Network
  suiRpc: process.env.SUI_RPC || 'https://fullnode.testnet.sui.io',
  network: process.env.NETWORK || 'testnet',

  // Gas Sponsor
  sponsorPrivateKey: process.env.SPONSOR_PRIVATE_KEY!,

  // Smart Contract
  packageId: process.env.PACKAGE_ID || '',
  adminCapId: process.env.ADMIN_CAP_ID || '',

  // zkLogin
  googleClientId: process.env.GOOGLE_CLIENT_ID || process.env.ZKLOGIN_CLIENT_ID || '',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',

  // AI
  aiProvider: process.env.AI_PROVIDER || 'dummy',
  openaiApiKey: process.env.OPENAI_API_KEY || '',

  // Frontend
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
} as const;

// Validation
const requiredEnvVars = ['SPONSOR_PRIVATE_KEY'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.warn(`⚠️  Warning: ${envVar} is not set in .env`);
  }
}
