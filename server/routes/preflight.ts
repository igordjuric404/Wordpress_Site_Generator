import { Router, type Request, type Response } from 'express';
import { runPreflightChecks, clearPreflightCache } from '../services/preflight.service.js';
import { testConnection } from '../services/database.service.js';
import { createServiceLogger } from '../utils/logger.js';

const logger = createServiceLogger('routes/preflight');

export const preflightRouter = Router();

// GET /api/preflight - Run preflight checks
preflightRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const result = await runPreflightChecks();
    res.json({ success: true, data: result });
  } catch (err) {
    logger.error({ error: err }, 'Preflight checks failed');
    res.status(500).json({
      success: false,
      error: 'Preflight checks failed',
      data: {
        status: 'error',
        checks: {},
        errors: [err instanceof Error ? err.message : 'Unknown error'],
        warnings: [],
      },
    });
  }
});

// POST /api/preflight/refresh - Force refresh preflight checks
preflightRouter.post('/refresh', async (_req: Request, res: Response) => {
  try {
    clearPreflightCache();
    const result = await runPreflightChecks(true);
    res.json({ success: true, data: result });
  } catch (err) {
    logger.error({ error: err }, 'Preflight refresh failed');
    res.status(500).json({ success: false, error: 'Preflight refresh failed' });
  }
});

// GET /api/preflight/mysql - Test MySQL connection
preflightRouter.get('/mysql', async (_req: Request, res: Response) => {
  try {
    const connected = await testConnection();
    res.json({
      success: true,
      data: {
        connected,
        host: process.env.MYSQL_HOST || 'localhost',
        port: process.env.MYSQL_PORT || '8889',
      },
    });
  } catch (err) {
    logger.error({ error: err }, 'MySQL connection test failed');
    res.json({
      success: true,
      data: {
        connected: false,
        error: err instanceof Error ? err.message : 'Connection failed',
      },
    });
  }
});
