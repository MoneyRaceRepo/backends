# MoneyRace Backend

Backend server untuk MoneyRace - Saving game dengan AI recommendation dan Sui blockchain.

## Features

- ✅ **zkLogin Authentication** - Login dengan Google (simplified untuk hackathon)
- ✅ **Gasless Transactions** - Gas sponsorship untuk UX yang smooth
- ✅ **AI Recommendations** - Strategy recommendations berdasarkan user prompt
- ✅ **Transaction Relayer** - Submit transactions on behalf of users
- ✅ **API Routes** - Complete REST API untuk smart contract interactions

## Tech Stack

- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **Blockchain**: Sui (via @mysten/sui.js)
- **Auth**: zkLogin (simplified for MVP)
- **AI**: Dummy strategies (keyword-based)

## Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` dan isi:

```env
# Server
PORT=3001
NODE_ENV=development

# Sui Network
SUI_RPC=https://fullnode.testnet.sui.io
NETWORK=testnet

# Gas Sponsor (REQUIRED)
SPONSOR_PRIVATE_KEY=suiprivkey1qp...

# Smart Contract (isi setelah deploy)
PACKAGE_ID=0x...
ADMIN_CAP_ID=0x...

# zkLogin (optional untuk MVP)
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com

# Frontend
FRONTEND_URL=http://localhost:3000
```

### 3. Get Sponsor Private Key

Untuk mendapatkan sponsor keypair:

```bash
# Install Sui CLI jika belum
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
cargo install --locked --git https://github.com/MystenLabs/sui.git --branch testnet sui

# Generate keypair
sui client new-address ed25519

# Copy private key yang muncul ke SPONSOR_PRIVATE_KEY
```

### 4. Fund Sponsor Address

Sponsor address perlu SUI untuk membayar gas:

```bash
# Get address dari private key
sui keytool list

# Request testnet SUI
curl --location --request POST 'https://faucet.testnet.sui.io/gas' \
--header 'Content-Type: application/json' \
--data-raw '{
    "FixedAmountRequest": {
        "recipient": "YOUR_SPONSOR_ADDRESS"
    }
}'
```

### 5. Deploy Smart Contract

```bash
cd ../money_race

# Build contract
sui move build

# Deploy
sui client publish --gas-budget 100000000

# Copy:
# - Package ID ke .env PACKAGE_ID
# - AdminCap object ID ke .env ADMIN_CAP_ID
```

### 6. Run Server

```bash
cd ../backend

# Development mode
npm run dev

# Production mode
npm run build
npm run serve
```

Server akan jalan di `http://localhost:3001`

## API Endpoints

### Health Check

```bash
GET /health
```

### Auth Routes

#### Login dengan Google JWT
```bash
POST /auth/login
Content-Type: application/json

{
  "jwt": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
}

Response:
{
  "success": true,
  "user": {
    "address": "0xabc123...",
    "provider": "google",
    "sub": "123456789"
  }
}
```

#### Verify JWT
```bash
POST /auth/verify
Content-Type: application/json

{
  "jwt": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### AI Routes

#### Get Strategy Recommendations
```bash
POST /ai/recommend
Content-Type: application/json

{
  "prompt": "I want a safe investment strategy for retirement"
}

Response:
{
  "success": true,
  "strategies": [
    {
      "id": 0,
      "name": "Stable Saver",
      "description": "Low-risk strategy...",
      "riskLevel": "low",
      "expectedReturn": 5,
      "recommended": true,
      "reasoning": "Your preference for stability..."
    },
    ...
  ],
  "userPrompt": "I want a safe investment strategy for retirement",
  "parsedIntent": {
    "riskTolerance": "low",
    "goal": "retirement"
  }
}
```

#### Get All Strategies
```bash
GET /ai/strategies
```

#### Get Strategy by ID
```bash
GET /ai/strategies/0
```

### Room Routes

#### Create Room
```bash
POST /room/create
Content-Type: application/json

{
  "totalPeriods": 4,
  "depositAmount": 1000000,
  "strategyId": 1,
  "startTimeMs": 1704067200000,
  "periodLengthMs": 604800000
}
```

#### Start Room (Admin)
```bash
POST /room/start
Content-Type: application/json

{
  "roomId": "0x..."
}
```

#### Join Room
```bash
POST /room/join
Content-Type: application/json

{
  "roomId": "0x...",
  "vaultId": "0x...",
  "coinObjectId": "0x...",
  "clockId": "0x6"
}
```

#### Deposit
```bash
POST /room/deposit
Content-Type: application/json

{
  "roomId": "0x...",
  "vaultId": "0x...",
  "playerPositionId": "0x...",
  "coinObjectId": "0x...",
  "clockId": "0x6"
}
```

#### Claim Rewards
```bash
POST /room/claim
Content-Type: application/json

{
  "roomId": "0x...",
  "vaultId": "0x...",
  "playerPositionId": "0x..."
}
```

#### Get Room Data
```bash
GET /room/{roomId}
```

#### Finalize Room (Admin)
```bash
POST /room/finalize
Content-Type: application/json

{
  "roomId": "0x..."
}
```

#### Fund Reward Pool (Admin)
```bash
POST /room/fund-reward
Content-Type: application/json

{
  "vaultId": "0x...",
  "coinObjectId": "0x..."
}
```

### Player Routes

#### Get Player Position
```bash
GET /player/{positionId}
```

## Architecture

```
backend/
├── src/
│   ├── config/          # Configuration
│   ├── middleware/      # Express middleware
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   │   ├── ai.service.ts       # AI recommendations
│   │   ├── relayer.service.ts  # Transaction relayer
│   │   └── zklogin.service.ts  # Authentication
│   ├── sui/             # Sui client setup
│   ├── types/           # TypeScript types
│   └── index.ts         # Entry point
├── .env.example
├── package.json
└── tsconfig.json
```

## Development

### File Structure

- **config/** - Environment variables & configuration
- **middleware/** - Error handling, validation
- **routes/** - API endpoints (auth, ai, room, player)
- **services/** - Core business logic
  - `ai.service.ts` - Strategy recommendations
  - `relayer.service.ts` - Gas sponsorship & transaction submission
  - `zklogin.service.ts` - Simplified authentication
- **sui/** - Sui client & sponsor keypair
- **types/** - TypeScript interfaces

### Key Services

#### RelayerService
- Sponsors gas untuk semua transactions
- Submits transactions on behalf of users
- Methods: createRoom, joinRoom, deposit, claimAll, etc.

#### AIService
- Parses user prompts (keyword-based)
- Returns strategy recommendations
- 3 strategies: Stable Saver, Balanced Builder, Growth Chaser

#### ZkLoginService
- Simplified auth untuk hackathon MVP
- Generates deterministic Sui address dari Google sub
- Production: harus implement full zkLogin dengan zkSNARK proofs

## Testing

### Test Health Endpoint
```bash
curl http://localhost:3001/health
```

### Test AI Recommendation
```bash
curl -X POST http://localhost:3001/ai/recommend \
  -H "Content-Type: application/json" \
  -d '{"prompt": "I want aggressive growth strategy"}'
```

### Test Create Room
```bash
curl -X POST http://localhost:3001/room/create \
  -H "Content-Type: application/json" \
  -d '{
    "totalPeriods": 4,
    "depositAmount": 1000000,
    "strategyId": 2,
    "startTimeMs": 1704067200000,
    "periodLengthMs": 604800000
  }'
```

## Troubleshooting

### Error: "SPONSOR_PRIVATE_KEY must be set"
- Pastikan `.env` file ada dan `SPONSOR_PRIVATE_KEY` terisi
- Format: `suiprivkey1qp...` atau `0x...`

### Error: "Package ID not configured"
- Deploy smart contract dulu
- Copy Package ID ke `.env`

### Error: "Insufficient gas"
- Fund sponsor address dengan testnet SUI
- Minimal 1 SUI untuk testing

### TypeScript Errors
```bash
# Clean rebuild
rm -rf dist/
npm run build
```

## Next Steps

1. ✅ Backend setup - DONE
2. ⏭️ Deploy smart contract
3. ⏭️ Build frontend
4. ⏭️ Integration testing
5. ⏭️ Demo preparation

## Notes untuk Hackathon

- **zkLogin**: Simplified untuk MVP, production perlu full implementation
- **AI**: Dummy strategies, bisa diganti dengan real LLM
- **Gas**: Semua transactions di-sponsor oleh backend
- **Clock**: Sui clock object ID = `0x6` (shared object)

## Contact

Untuk pertanyaan atau bantuan, silakan kontak team MoneyRace.
