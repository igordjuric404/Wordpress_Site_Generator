import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import type { SiteConfig } from '../../shared/types.js';
import { getAllJobs, getFailedJobs, getJob, getJobLogs, getJobsByStatus } from '../db/jobs.js';
import { generateSite, deleteSite, resumeJob, cancelJob, bulkDeleteSites } from '../services/site-generator.service.js';
import { createServiceLogger } from '../utils/logger.js';
import { THEMES, DEFAULT_THEME } from '../config/themes.js';
import * as starterTemplatesService from '../services/starter-templates.service.js';
import { getTemplateById, getTemplatesByStack, type BuilderStack } from '../config/starter-templates.js';

const logger = createServiceLogger('routes/sites');

export const sitesRouter = Router();

// Validation schema for site creation
// Phase 2: niche is now a free-form string (no longer an enum)
const createSiteSchema = z.object({
  businessName: z.string().min(1, 'Business name is required').max(100),
  niche: z.string().min(1, 'Niche is required').max(200),
  address: z.string().min(1, 'Address is required').max(500),
  phone: z.string().min(1, 'Phone is required').max(50),
  email: z.string().email('Invalid email address'),
  additionalContext: z.string().max(2000).optional(),
  siteType: z.enum(['standard', 'ecommerce']).default('standard'),
  theme: z.string().optional(),
  templateId: z.string().optional(), // Astra Starter Template numeric ID
  enableAiContent: z.boolean().optional(), // Enable AI content rewrite (default: false)
  dryRunAi: z.boolean().optional(), // AI dry run: extract & log but don't call API
  dryRun: z.boolean().optional(),
});

// GET /api/sites - List recent sites
sitesRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const jobs = getAllJobs();
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

// GET /api/sites/niches - List available niches (kept for backward compat)
sitesRouter.get('/niches', (_req: Request, res: Response) => {
  // Return empty - niche is now a free-form text input
  res.json({ success: true, data: [] });
});

// GET /api/sites/themes - List available themes with builder stack metadata
sitesRouter.get('/themes', (_req: Request, res: Response) => {
  const themes = THEMES.map((theme) => ({
    slug: theme.slug,
    name: theme.name,
    description: theme.description,
    features: theme.features,
    recommended: theme.recommended,
    builderStack: theme.builderStack,   // null = no templates
    wpThemeSlug: theme.wpThemeSlug,
  }));
  res.json({ success: true, data: themes, default: DEFAULT_THEME });
});

// GET /api/sites/templates - List starter templates, optionally filtered by builder stack
// Query param: ?stack=spectra|classic  (omit for all)
sitesRouter.get('/templates', async (req: Request, res: Response) => {
  try {
    const stack = req.query.stack as string | undefined;
    let templates;
    if (stack && (stack === 'spectra' || stack === 'classic')) {
      templates = getTemplatesByStack(stack as BuilderStack);
    } else {
      templates = await starterTemplatesService.listTemplates();
    }
    res.json({ success: true, data: templates });
  } catch (err) {
    logger.error({ error: err }, 'Failed to list templates');
    res.status(500).json({ success: false, error: 'Failed to list templates' });
  }
});

// GET /api/sites/templates/niche/:nicheId - Returns ALL templates (no niche filtering)
sitesRouter.get('/templates/niche/:nicheId', async (req: Request<{ nicheId: string }>, res: Response) => {
  try {
    const { nicheId } = req.params;
    const result = await starterTemplatesService.getTemplatesForNiche(nicheId);
    res.json({ success: true, data: result });
  } catch (err) {
    logger.error({ error: err, nicheId: req.params.nicheId }, 'Failed to get templates for niche');
    res.status(500).json({ success: false, error: 'Failed to get templates for niche' });
  }
});

// GET /api/sites/templates/:id - Get a single template by ID
sitesRouter.get('/templates/:id', async (req: Request<{ id: string }>, res: Response) => {
  try {
    const { id } = req.params;
    const template = getTemplateById(id);
    
    if (!template) {
      res.status(404).json({ success: false, error: 'Template not found' });
      return;
    }
    
    res.json({ success: true, data: template });
  } catch (err) {
    logger.error({ error: err, templateId: req.params.id }, 'Failed to get template');
    res.status(500).json({ success: false, error: 'Failed to get template' });
  }
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

// POST /api/sites/:id/cancel - Cancel in-progress job
sitesRouter.post('/:id/cancel', async (req: Request<{ id: string }>, res: Response) => {
  try {
    const { id } = req.params;
    const job = await cancelJob(id);
    res.json({ success: true, data: job });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to cancel job';
    logger.error({ error: err, jobId: req.params.id }, 'Failed to cancel job');
    res.status(500).json({ success: false, error: errorMessage });
  }
});

// DELETE /api/sites/bulk - Bulk delete sites
sitesRouter.post('/bulk-delete', async (req: Request, res: Response) => {
  try {
    const { jobIds } = req.body;

    if (!Array.isArray(jobIds) || jobIds.length === 0) {
      res.status(400).json({ success: false, error: 'jobIds array is required' });
      return;
    }

    const result = await bulkDeleteSites(jobIds);
    res.json({ success: true, data: result });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to bulk delete sites';
    logger.error({ error: err }, 'Failed to bulk delete sites');
    res.status(500).json({ success: false, error: errorMessage });
  }
});

// GET /api/sites/by-status/:status - Get jobs by status
sitesRouter.get('/by-status/:status', async (req: Request<{ status: string }>, res: Response) => {
  try {
    const { status } = req.params;
    const validStatuses = ['pending', 'in_progress', 'completed', 'failed', 'cancelled', 'deleted'];
    
    if (!validStatuses.includes(status)) {
      res.status(400).json({ success: false, error: 'Invalid status' });
      return;
    }

    const jobs = getJobsByStatus(status as any);
    res.json({ success: true, data: jobs });
  } catch (err) {
    logger.error({ error: err }, 'Failed to get jobs by status');
    res.status(500).json({ success: false, error: 'Failed to get jobs by status' });
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
