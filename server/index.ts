import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import net from 'net';
import { sitesRouter } from './routes/sites.js';
import { progressRouter } from './routes/progress.js';
import { preflightRouter } from './routes/preflight.js';
import { logger } from './utils/logger.js';
import { initDatabase } from './db/jobs.js';
import { runPreflightChecks } from './services/preflight.service.js';

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Middleware - allow CORS from common Vite ports
app.use(cors({ 
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
  credentials: true 
}));
app.use(express.json());

// Request logging
app.use((req, _res, next) => {
  logger.info({ method: req.method, path: req.path }, 'Incoming request');
  next();
});

// Routes
app.use('/api/sites', sitesRouter);
app.use('/api/progress', progressRouter);
app.use('/api/preflight', preflightRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error({ error: err.message, stack: err.stack }, 'Unhandled error');
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// Find available port starting from the desired port
function findAvailablePort(startPort: number): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    
    server.listen(startPort, () => {
      const address = server.address();
      const port = address && typeof address === 'object' ? address.port : startPort;
      server.close(() => resolve(port));
    });
    
    server.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        // Try next port
        findAvailablePort(startPort + 1).then(resolve).catch(reject);
      } else {
        reject(err);
      }
    });
  });
}

// Initialize and start server
async function start() {
  try {
    // Initialize SQLite database
    logger.info('Initializing database...');
    initDatabase();

    // Run preflight checks
    logger.info('Running preflight checks...');
    const preflightResult = await runPreflightChecks();
    
    if (preflightResult.status === 'error') {
      logger.warn({ errors: preflightResult.errors }, 'Preflight checks failed - some features may not work');
    } else if (preflightResult.status === 'warning') {
      logger.warn({ warnings: preflightResult.warnings }, 'Preflight checks have warnings');
    } else {
      logger.info('All preflight checks passed');
    }

    // Find available port
    const actualPort = await findAvailablePort(PORT);
    
    if (actualPort !== PORT) {
      logger.warn({ requested: PORT, actual: actualPort }, 'Port was in use, using alternative port');
    }

    // Start server
    app.listen(actualPort, () => {
      logger.info({ port: actualPort }, 'Server started');
      const portNote = actualPort !== PORT ? ` (port ${PORT} was in use)` : '';
      const apiLine = `║  API:      http://localhost:${actualPort}${portNote}`;
      console.log(`
╔═══════════════════════════════════════════════════════╗
║     WordPress Site Generator - Server Running         ║
╠═══════════════════════════════════════════════════════╣
${apiLine.padEnd(55)}║
║  Frontend: http://localhost:5173 (or 5174 if in use) ║
╚═══════════════════════════════════════════════════════╝
      `);
    });
  } catch (err) {
    logger.error({ error: err }, 'Failed to start server');
    process.exit(1);
  }
}

start();
