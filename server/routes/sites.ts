import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import type { SiteConfig, NicheId } from '../../shared/types.js';
import { SUPPORTED_NICHES } from '../../shared/types.js';
import { getRecentJobs, getFailedJobs, getJob, getJobLogs } from '../db/jobs.js';
import { generateSite, deleteSite, resumeJob } from '../services/site-generator.service.js';
import { createServiceLogger } from '../utils/logger.js';

const logger = createServiceLogger('routes/sites');

export const sitesRouter = Router();

// Validation schema for site creation
const createSiteSchema = z.object({
  businessName: z.string().min(1, 'Business name is required').max(100),
  niche: z.enum(Object.keys(SUPPORTED_NICHES) as [NicheId, ...NicheId[]]),
  address: z.string().min(1, 'Address is required').max(500),
  phone: z.string().min(1, 'Phone is required').max(50),
  email: z.string().email('Invalid email address'),
  additionalContext: z.string().max(2000).optional(),
  siteType: z.enum(['standard', 'ecommerce']).default('standard'),
  theme: z.string().optional(),
  dryRun: z.boolean().optional(),
});

// GET /api/sites - List recent sites
sitesRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const jobs = getRecentJobs(20);
    res.json({ success: true, data: jobs });
  } catch (err) {
    logger.error({ error: err }, 'Failed to list sites');
    res.status(500).json({ success: false, error: 'Failed to list sites' });
  }
});

// GET /api/sites/failed - List failed jobs
sitesRouter.get('/failed', async (_req: Request, res: Response) => {
  try {
    const jobs = getFailedJobs();
    res.json({ success: true, data: jobs });
  } catch (err) {
    logger.error({ error: err }, 'Failed to list failed jobs');
    res.status(500).json({ success: false, error: 'Failed to list failed jobs' });
  }
});

// GET /api/sites/niches - List available niches
sitesRouter.get('/niches', (_req: Request, res: Response) => {
  const niches = Object.entries(SUPPORTED_NICHES).map(([id, data]) => ({
    id,
    label: data.label,
    pages: data.pages,
    services: data.services,
  }));
  res.json({ success: true, data: niches });
});

// GET /api/sites/:id - Get site details
sitesRouter.get('/:id', async (req: Request<{ id: string }>, res: Response) => {
  try {
    const { id } = req.params;
    const job = getJob(id);

    if (!job) {
      res.status(404).json({ success: false, error: 'Site not found' });
      return;
    }

    const logs = getJobLogs(id);
    res.json({ success: true, data: { ...job, logs } });
  } catch (err) {
    logger.error({ error: err }, 'Failed to get site');
    res.status(500).json({ success: false, error: 'Failed to get site' });
  }
});

// POST /api/sites - Create new site
sitesRouter.post('/', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validationResult = createSiteSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationResult.error.errors,
      });
      return;
    }

    const config = validationResult.data as SiteConfig;
    const dryRun = validationResult.data.dryRun || false;

    logger.info({ businessName: config.businessName, niche: config.niche, dryRun }, 'Creating new site');

    // Start site generation (async - returns immediately with job ID)
    const job = await generateSite(config, { dryRun });

    res.status(201).json({
      success: true,
      data: job,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to create site';
    logger.error({ error: err }, 'Failed to create site');
    res.status(500).json({ success: false, error: errorMessage });
  }
});

// POST /api/sites/:id/resume - Resume failed job
sitesRouter.post('/:id/resume', async (req: Request<{ id: string }>, res: Response) => {
  try {
    const { id } = req.params;
    const job = await resumeJob(id);
    res.json({ success: true, data: job });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to resume job';
    logger.error({ error: err, jobId: req.params.id }, 'Failed to resume job');
    res.status(500).json({ success: false, error: errorMessage });
  }
});

// DELETE /api/sites/:id - Delete site
sitesRouter.delete('/:id', async (req: Request<{ id: string }>, res: Response) => {
  try {
    const { id } = req.params;

    const job = getJob(id);
    if (!job) {
      res.status(404).json({ success: false, error: 'Site not found' });
      return;
    }

    await deleteSite(id);
    res.json({ success: true, message: 'Site deleted successfully' });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to delete site';
    logger.error({ error: err, jobId: req.params.id }, 'Failed to delete site');
    res.status(500).json({ success: false, error: errorMessage });
  }
});
