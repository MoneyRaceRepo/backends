# MoneyRace Backend

> Express.js backend for MoneyRace - handles AI recommendations, gasless transaction relaying, and authentication.

## Tech Stack

- **Runtime**: Node.js + TypeScript (tsx)
- **Framework**: Express.js
- **Blockchain**: @mysten/sui SDK
- **AI**: EigenAI (deepseek-v31-terminus model)
- **Auth**: Google OAuth JWT + zkLogin
- **Database**: PostgreSQL (Prisma ORM)
- **Dev**: Nodemon + tsx

## Setup

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env

# Run database migrations
npx prisma generate

# Start development server
npm run dev
# Server runs at http://localhost:3001
```

## Environment Variables

```env
# Server
PORT=3001
NODE_ENV=development

# Sui Network
SUI_RPC=https://fullnode.testnet.sui.io
NETWORK=testnet

# Gas Sponsor (private key for sponsoring transactions)
SPONSOR_PRIVATE_KEY=suiprivkey1qp...

# Smart Contract
PACKAGE_ID=0x...
ADMIN_CAP_ID=0x...
FAUCET_ID=0x...

# Google OAuth
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
JWT_SECRET=your_jwt_secret

# AI
EIGENAI_API_KEY=sk-your_key

# Frontend (CORS)
FRONTEND_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://...
```

## API Endpoints

### Health & Status

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Server health check |
| `/contract-status` | GET | Sui RPC & contract connection status |

### Authentication

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/login` | POST | Login with Google OAuth JWT |
| `/auth/verify` | POST | Verify JWT token |

### AI

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/ai/recommend` | POST | Get strategy recommendations based on user prompt |
| `/ai/chat` | POST | General chat with AI assistant |
| `/ai/strategies` | GET | List all available strategies |
| `/ai/strategies/:id` | GET | Get strategy by ID |

### Rooms

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/room/create` | POST | Create a savings room on-chain |
| `/room/join` | POST | Join an existing room |
| `/room/deposit` | POST | Make a deposit (gasless) |
| `/room/claim` | POST | Claim rewards after room ends |
| `/room/start` | POST | Start a room (admin) |
| `/room/finalize` | POST | Finalize a room (admin) |
| `/room/fund-reward` | POST | Fund reward pool (admin) |
| `/room/:id` | GET | Get room details from blockchain |
| `/room/list` | GET | List available rooms |
| `/room/find-private` | POST | Find private room by password |

### Players

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/player/:id` | GET | Get player position data |
| `/player/profile` | GET | Get user profile |
| `/player/stats` | GET | Get player statistics |

### USDC

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/usdc/mint` | POST | Mint testnet USDC (faucet) |
| `/usdc/balance/:address` | GET | Check USDC balance |

### Sponsored Transactions

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/sponsored/execute` | POST | Execute a sponsored transaction |

## Project Structure

```
backends/
└── src/
    ├── index.ts              # Express app entry point
    ├── config/               # Environment config
    ├── middleware/            # Error handling middleware
    ├── routes/               # API route handlers
    │   ├── auth.routes.ts
    │   ├── ai.routes.ts
    │   ├── room.routes.ts
    │   ├── player.routes.ts
    │   ├── usdc.routes.ts
    │   └── sponsored.routes.ts
    ├── services/             # Business logic
    │   ├── ai.service.ts          # EigenAI integration
    │   ├── relayer.service.ts     # Sui transaction builder & sponsor
    │   ├── zklogin.service.ts     # Google JWT verification
    │   ├── event.service.ts       # Sui event querying
    │   └── room-store.service.ts  # Room data persistence
    ├── sui/                  # Blockchain setup
    │   ├── client.ts              # SuiClient instance
    │   └── sponsor.ts             # Sponsor keypair
    ├── types/                # TypeScript interfaces
    ├── utils/                # Helpers (response, blockchain)
    └── constants/            # App constants
```

## Core Services

### RelayerService
Builds and sponsors all blockchain transactions. Users never pay gas fees - the backend sponsor wallet covers all costs.

### AIService
Integrates with EigenAI (deepseek-v31-terminus) to provide personalized savings strategy recommendations based on user goals and risk tolerance.

### ZkLoginService
Verifies Google OAuth JWTs and derives deterministic Sui addresses, enabling Web2 users to interact with the blockchain without managing private keys.

### EventService
Queries Sui blockchain events (PlayerJoined, DepositMade) to aggregate room statistics and user history.

## Build & Deploy

```bash
# Production build
npm run build

# Start production server
npm run serve
```

Deployed on **Railway**: [moneyrace-backend.up.railway.app](https://moneyrace-backend.up.railway.app/)

## License

MIT
