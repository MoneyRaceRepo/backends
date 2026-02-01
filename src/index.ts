import express from 'express';
import cors from 'cors';
import { config } from './config/index.js';
import authRoutes from './routes/auth.routes.js';
import aiRoutes from './routes/ai.routes.js';
import roomRoutes from './routes/room.routes.js';
import playerRoutes from './routes/player.routes.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';

const app = express();

// Middleware
app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
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

// Routes
app.use('/auth', authRoutes);
app.use('/ai', aiRoutes);
app.use('/room', roomRoutes);
app.use('/player', playerRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
app.listen(config.port, () => {
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
});
