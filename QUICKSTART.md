# MoneyRace Backend - Quick Start Guide

Panduan cepat untuk setup backend MoneyRace dalam 5 menit.

## Prerequisites

- Node.js >= 18
- npm atau yarn
- Sui CLI (untuk generate keypair)

## Step-by-Step Setup

### 1️⃣ Install Dependencies (1 menit)

```bash
cd backend
npm install
```

### 2️⃣ Setup Environment (2 menit)

```bash
# Copy example env
cp .env.example .env
```

**Edit `.env` - MINIMAL SETUP:**

```env
# REQUIRED
SPONSOR_PRIVATE_KEY=suiprivkey1qpza22fenrm6m04a6ly0hkwryd8agld27cwqz442pp2h6ajw5hcu6q7prxy

# OPTIONAL (isi nanti setelah deploy)
PACKAGE_ID=
ADMIN_CAP_ID=
```

> **Cara dapat SPONSOR_PRIVATE_KEY:**
> 1. Install Sui CLI: `cargo install --locked --git https://github.com/MystenLabs/sui.git --branch testnet sui`
> 2. Generate keypair: `sui client new-address ed25519`
> 3. Copy private key yang muncul

### 3️⃣ Fund Sponsor Address (1 menit)

```bash
# Get sponsor address
sui keytool list

# Request testnet SUI (via browser)
# https://discord.com/channels/916379725201563759/971488439931392130
# Atau gunakan faucet bot
```

### 4️⃣ Run Server (1 detik)

```bash
# Development mode
npm run dev

# Server running di http://localhost:3001
```

### 5️⃣ Test Server

```bash
# Health check
curl http://localhost:3001/health

# Test AI recommendation
curl -X POST http://localhost:3001/ai/recommend \
  -H "Content-Type: application/json" \
  -d '{"prompt": "I want safe investment"}'
```

## Deploy Smart Contract (Optional - untuk full testing)

```bash
cd ../money_race

# Build
sui move build

# Deploy
sui client publish --gas-budget 100000000

# Update .env dengan Package ID dan AdminCap ID
```

## What's Working Now?

✅ **Tanpa deploy contract:**
- Health check
- AI recommendations
- Auth endpoints (zkLogin simplified)

⏸️ **Perlu deploy contract:**
- Create room
- Join room
- Deposit
- Claim rewards

## Architecture Overview

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Frontend  │─────▶│   Backend   │─────▶│  Sui Chain  │
│  (Next.js)  │      │  (Express)  │      │  (Testnet)  │
└─────────────┘      └─────────────┘      └─────────────┘
                            │
                            ▼
                     ┌─────────────┐
                     │  AI Service │
                     │   (Dummy)   │
                     └─────────────┘
```

## Key Endpoints

| Endpoint | Purpose | Status |
|----------|---------|--------|
| `GET /health` | Health check | ✅ Ready |
| `POST /auth/login` | zkLogin auth | ✅ Ready |
| `POST /ai/recommend` | Get strategy | ✅ Ready |
| `GET /ai/strategies` | List strategies | ✅ Ready |
| `POST /room/create` | Create room | ⏸️ Need contract |
| `POST /room/join` | Join room | ⏸️ Need contract |
| `POST /room/deposit` | Deposit | ⏸️ Need contract |
| `POST /room/claim` | Claim rewards | ⏸️ Need contract |

## Common Issues

### ❌ "Cannot find module '@mysten/sui.js/client'"

**Fix:**
```bash
rm -rf node_modules package-lock.json
npm install
```

### ❌ "SPONSOR_PRIVATE_KEY must be set"

**Fix:**
1. Check `.env` file exists in `/backend` folder
2. Verify `SPONSOR_PRIVATE_KEY` is set
3. Format harus: `suiprivkey1qp...` atau `0x...`

### ❌ "Transaction failed: Insufficient gas"

**Fix:**
1. Fund sponsor address dengan testnet SUI
2. Check balance: `sui client gas`
3. Request dari faucet jika < 0.5 SUI

### ❌ TypeScript errors

**Fix:**
```bash
npm run build
```

## Next Steps

1. ✅ Backend running
2. → Deploy smart contract ([money_race/README.md](../money_race/README.md))
3. → Setup frontend
4. → Integration testing
5. → Deploy to production

## Quick Demo Script

```bash
# 1. Start server
npm run dev

# 2. Test AI (in new terminal)
curl -X POST http://localhost:3001/ai/recommend \
  -H "Content-Type: application/json" \
  -d '{"prompt": "aggressive growth"}'

# 3. Test auth (with Google JWT)
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"jwt": "YOUR_GOOGLE_JWT_HERE"}'
```

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | 3001 | Server port |
| `SPONSOR_PRIVATE_KEY` | **YES** | - | Gas sponsor keypair |
| `PACKAGE_ID` | For contract calls | - | Deployed contract ID |
| `ADMIN_CAP_ID` | For admin ops | - | AdminCap object ID |
| `GOOGLE_CLIENT_ID` | For real zkLogin | - | Google OAuth client |
| `SUI_RPC` | No | testnet | Sui RPC endpoint |
| `FRONTEND_URL` | No | localhost:3000 | CORS origin |

## Development Workflow

```bash
# Make changes to src/
# Server auto-reloads (nodemon)

# Build for production
npm run build

# Run production build
npm run serve
```

## File Structure

```
backend/
├── src/
│   ├── config/index.ts          # Config & env vars
│   ├── types/index.ts            # TypeScript types
│   ├── middleware/
│   │   └── error.middleware.ts   # Error handling
│   ├── services/
│   │   ├── ai.service.ts         # AI recommendations
│   │   ├── relayer.service.ts    # Transaction relayer
│   │   └── zklogin.service.ts    # Auth service
│   ├── routes/
│   │   ├── auth.routes.ts        # Auth endpoints
│   │   ├── ai.routes.ts          # AI endpoints
│   │   ├── room.routes.ts        # Room endpoints
│   │   └── player.routes.ts      # Player endpoints
│   ├── sui/
│   │   ├── client.ts             # Sui client
│   │   └── sponsor.ts            # Sponsor keypair
│   └── index.ts                  # Server entry
├── .env                          # Environment vars
├── package.json
├── tsconfig.json
├── README.md                     # Full documentation
└── QUICKSTART.md                 # This file
```

## Support

- Full docs: [README.md](./README.md)
- Smart contract: [../money_race/](../money_race/)
- Issues: GitHub Issues

---

**Status**: ✅ Backend setup complete
**Time**: ~5 minutes
**Next**: Deploy smart contract & build frontend
