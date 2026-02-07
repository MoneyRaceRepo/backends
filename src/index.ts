import 'dotenv/config';
import { config } from './config/index.js';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import aiRoutes from './routes/ai.routes.js';
import roomRoutes from './routes/room.routes.js';
import playerRoutes from './routes/player.routes.js';
import usdcRoutes from './routes/usdc.routes.js';
import sponsoredRoutes from './routes/sponsored.routes.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';
import { testRpcConnection, testSmartContractConnection } from './sui/client.js';

const app = express();

// Middleware - Allow all origins for demo/development
app.use(cors({
  origin: '*',
  credentials: false,
}));
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    network: config.network,
    packageId: config.packageId || 'not configured',
  });
});

// Smart Contract status check
app.get('/contract-status', async (_req, res) => {
  try {
    const rpcConnected = await testRpcConnection();
    const contractConnected = rpcConnected ? await testSmartContractConnection() : false;

    res.json({
      status: contractConnected ? 'connected' : 'error',
      rpc: {
        connected: rpcConnected,
        url: config.suiRpc,
        network: config.network,
      },
      contract: {
        connected: contractConnected,
        packageId: config.packageId || 'not configured',
        adminCapId: config.adminCapId || 'not configured',
      },
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      error: error.message,
    });
  }
});

// Routes
app.use('/auth', authRoutes);
app.use('/ai', aiRoutes);
app.use('/room', roomRoutes);
app.use('/player', playerRoutes);
app.use('/usdc', usdcRoutes);
app.use('/sponsored', sponsoredRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
app.listen(config.port, async () => {
  console.log(`
╔═══════════════════════════════════════╗
║   MoneyRace Backend Server Started   ║
╠═══════════════════════════════════════╣
║  Port:     ${config.port}                      ║
║  Network:  ${config.network}                ║
║  Env:      ${config.nodeEnv}          ║
╚═══════════════════════════════════════╝

Server: http://localhost:${config.port}
Health: http://localhost:${config.port}/health

${config.packageId ? '✓ Package ID configured' : '⚠ Package ID not configured - update .env'}
${config.googleClientId ? '✓ Google Client ID configured' : '⚠ Google Client ID not configured - update .env'}
  `);

  // Test RPC connection
  console.log('\n🔄 Testing Sui RPC connection...');
  const rpcConnected = await testRpcConnection();

  // Test Smart Contract connection
  if (rpcConnected) {
    await testSmartContractConnection();
  }
});
