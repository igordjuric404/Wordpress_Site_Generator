import { nanoid } from 'nanoid';
import crypto from 'crypto';
import type { SiteConfig, Job } from '../../shared/types.js';
import { createServiceLogger } from '../utils/logger.js';
import { extractCity } from '../utils/sanitize.js';
import {
  createJob,
  getJob,
  updateJobProgress,
  updateJobStatus,
  updateJobSiteInfo,
  addJobLog,
  resetJobForResume,
} from '../db/jobs.js';
import { createProgressHelper } from './progress.service.js';
import * as wpService from './wordpress.service.js';
import * as dbService from './database.service.js';
import * as fsService from './filesystem.service.js';
import { getPluginsForSite } from '../config/plugins.js';
import { DEFAULT_THEME } from '../config/themes.js';
import { PLACEHOLDER_TEMPLATES, populateTemplate, getHomepageHtml } from '../config/placeholders.js';

const logger = createServiceLogger('site-generator');

// Generation steps for tracking progress
const GENERATION_STEPS = [
  'Validating configuration',
  'Creating site directory',
  'Creating database',
  'Downloading WordPress',
  'Configuring WordPress',
  'Installing WordPress',
  'Creating homepage',
  'Creating about page',
  'Creating services page',
  'Creating contact page',
  'Installing theme',
  'Installing plugins',
  'Finalizing site',
];

interface GenerationOptions {
  dryRun?: boolean;
}

/**
 * Generate a secure random password
 */
function generatePassword(length: number = 16): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  const randomBytes = crypto.randomBytes(length);
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars[randomBytes[i] % chars.length];
  }
  return password;
}

/**
 * Simulate a step for dry-run mode
 */
async function simulateStep(duration: number = 500): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, duration));
}

function requireValue<T>(value: T | undefined, name: string): T {
  if (value === undefined || value === null) {
    throw new Error(`Missing required value: ${name}`);
  }
  return value;
}

function getSiteNameFromPath(sitePath?: string): string | undefined {
  return sitePath ? sitePath.split('/').pop() : undefined;
}

async function runGenerationSteps(
  jobId: string,
  config: SiteConfig,
  options: GenerationOptions,
  startStep: number,
  existingJob?: Job
): Promise<Job> {
  const totalSteps = GENERATION_STEPS.length;
  const job = existingJob ?? getJob(jobId);
  if (!job) {
    throw new Error(`Job not found: ${jobId}`);
  }

  const progress = createProgressHelper(jobId, totalSteps, Math.max(0, startStep - 1));
  const startingMessage = startStep > 1 ? 'Resuming site generation' : 'Starting site generation';
  progress.start(startingMessage);

  let sitePath = job.sitePath;
  let siteUrl = job.siteUrl;
  let dbName = job.dbName;
  let adminPassword = job.adminPassword;

  const runStep = async (stepNumber: number, message: string, fn: () => Promise<void>) => {
    if (stepNumber < startStep) {
      return;
    }
    
    // Check if job was cancelled
    const currentJob = getJob(jobId);
    if (currentJob?.status === 'cancelled') {
      throw new Error('Job was cancelled');
    }
    
    progress.advance(message);
    await fn();
    
    // Check again after step completion
    const jobAfterStep = getJob(jobId);
    if (jobAfterStep?.status === 'cancelled') {
      throw new Error('Job was cancelled');
    }
    
    updateJobProgress(jobId, stepNumber);
  };

  try {
    // Step 1: Validate configuration
    await runStep(1, GENERATION_STEPS[0], async () => {
      if (!options.dryRun) {
        if (!config.businessName || !config.niche) {
          throw new Error('Business name and niche are required');
        }
      } else {
        await simulateStep(300);
      }
      addJobLog(jobId, 'info', 'Configuration validated');
    });

    // Step 2: Create site directory
    await runStep(2, GENERATION_STEPS[1], async () => {
      if (!sitePath) {
        const siteName = await fsService.getNextAvailableSiteName(config.businessName);
        sitePath = options.dryRun
          ? `${fsService.getWebRoot()}/${siteName}`
          : await fsService.createSiteDirectory(siteName);
        siteUrl = fsService.getSiteUrl(siteName);

        updateJobSiteInfo(jobId, { sitePath, siteUrl });
        addJobLog(jobId, 'info', `Site directory: ${sitePath}`);
      } else if (!siteUrl) {
        const siteName = getSiteNameFromPath(sitePath);
        if (siteName) {
          siteUrl = fsService.getSiteUrl(siteName);
          updateJobSiteInfo(jobId, { siteUrl });
        }
        addJobLog(jobId, 'info', `Reusing site directory: ${sitePath}`);
      }

      if (options.dryRun) {
        await simulateStep(500);
      }
    });

    // Step 3: Create database
    await runStep(3, GENERATION_STEPS[2], async () => {
      if (!dbName) {
        dbName = await dbService.getNextAvailableDbName(config.businessName);
        if (!options.dryRun) {
          await dbService.createDatabase(dbName);
        } else {
          await simulateStep(800);
        }

        updateJobSiteInfo(jobId, { dbName });
        addJobLog(jobId, 'info', `Database created: ${dbName}`);
      } else {
        addJobLog(jobId, 'info', `Reusing database: ${dbName}`);
      }
    });

    // Step 4: Download WordPress
    await runStep(4, GENERATION_STEPS[3], async () => {
      const resolvedSitePath = requireValue(sitePath, 'sitePath');
      if (!options.dryRun) {
        await wpService.downloadWordPress(resolvedSitePath);
      } else {
        await simulateStep(2000);
      }
      addJobLog(jobId, 'info', 'WordPress downloaded');
    });

    // Step 5: Configure WordPress
    await runStep(5, GENERATION_STEPS[4], async () => {
      const resolvedSitePath = requireValue(sitePath, 'sitePath');
      const resolvedDbName = requireValue(dbName, 'dbName');
      const mysqlPort = process.env.MYSQL_PORT || '3306';
      const mysqlPassword = process.env.MYSQL_PASSWORD !== undefined
        ? process.env.MYSQL_PASSWORD
        : ''; // Most local setups default to empty password

      if (!options.dryRun) {
        await wpService.createConfig(resolvedSitePath, {
          dbName: resolvedDbName,
          dbUser: process.env.MYSQL_USER || 'root',
          dbPassword: mysqlPassword,
          dbHost: `localhost:${mysqlPort}`,
        });
      } else {
        await simulateStep(500);
      }
      addJobLog(jobId, 'info', 'WordPress configured');
    });

    // Step 6: Install WordPress
    await runStep(6, GENERATION_STEPS[5], async () => {
      const resolvedSitePath = requireValue(sitePath, 'sitePath');
      const resolvedSiteUrl = requireValue(siteUrl, 'siteUrl');
      if (!adminPassword) {
        adminPassword = generatePassword();
      }
      const adminEmail = config.email || 'admin@example.com';

      if (!options.dryRun) {
        await wpService.installCore(resolvedSitePath, {
          url: resolvedSiteUrl,
          title: config.businessName,
          adminUser: 'admin',
          adminPassword,
          adminEmail,
        });
      } else {
        await simulateStep(1500);
      }

      updateJobSiteInfo(jobId, { adminPassword });
      addJobLog(jobId, 'info', 'WordPress installed');
    });

    // Step 7: Create homepage
    await runStep(7, GENERATION_STEPS[6], async () => {
      const resolvedSitePath = requireValue(sitePath, 'sitePath');
      const homepageContent = getHomepageHtml(config.niche, config.businessName);
      if (!options.dryRun) {
        const homepageId = await wpService.createPage(resolvedSitePath, {
          title: 'Home',
          content: homepageContent,
        });
        await wpService.setHomepage(resolvedSitePath, homepageId);
      } else {
        await simulateStep(800);
      }
      addJobLog(jobId, 'info', 'Homepage created');
    });

    // Step 8: About page
    await runStep(8, GENERATION_STEPS[7], async () => {
      const resolvedSitePath = requireValue(sitePath, 'sitePath');
      const templates = PLACEHOLDER_TEMPLATES[config.niche];
      const templateVars = {
        businessName: config.businessName,
        city: extractCity(config.address),
        phone: config.phone,
        email: config.email,
      };
      const aboutContent = populateTemplate(templates.about, templateVars);
      if (!options.dryRun) {
        await wpService.createPage(resolvedSitePath, {
          title: 'About',
          content: aboutContent,
        });
      } else {
        await simulateStep(600);
      }
      addJobLog(jobId, 'info', 'About page created');
    });

    // Step 9: Services page
    await runStep(9, GENERATION_STEPS[8], async () => {
      const resolvedSitePath = requireValue(sitePath, 'sitePath');
      const templates = PLACEHOLDER_TEMPLATES[config.niche];
      const templateVars = {
        businessName: config.businessName,
        city: extractCity(config.address),
        phone: config.phone,
        email: config.email,
      };
      const servicesContent = populateTemplate(templates.services, templateVars);
      if (!options.dryRun) {
        await wpService.createPage(resolvedSitePath, {
          title: 'Services',
          content: servicesContent,
        });
      } else {
        await simulateStep(600);
      }
      addJobLog(jobId, 'info', 'Services page created');
    });

    // Step 10: Contact page
    await runStep(10, GENERATION_STEPS[9], async () => {
      const resolvedSitePath = requireValue(sitePath, 'sitePath');
      const templates = PLACEHOLDER_TEMPLATES[config.niche];
      const templateVars = {
        businessName: config.businessName,
        city: extractCity(config.address),
        phone: config.phone,
        email: config.email,
      };
      const contactContent = populateTemplate(templates.contact, templateVars);
      if (!options.dryRun) {
        await wpService.createPage(resolvedSitePath, {
          title: 'Contact',
          content: contactContent,
        });
      } else {
        await simulateStep(600);
      }
      addJobLog(jobId, 'info', 'Contact page created');
    });

    // Step 11: Install theme
    await runStep(11, GENERATION_STEPS[10], async () => {
      const resolvedSitePath = requireValue(sitePath, 'sitePath');
      const theme = config.theme || DEFAULT_THEME;
      if (!options.dryRun) {
        await wpService.installTheme(resolvedSitePath, theme);
      } else {
        await simulateStep(1000);
      }
      addJobLog(jobId, 'info', `Theme installed: ${theme}`);
    });

    // Step 12: Install plugins
    await runStep(12, GENERATION_STEPS[11], async () => {
      const resolvedSitePath = requireValue(sitePath, 'sitePath');
      const plugins = getPluginsForSite(config.niche, config.siteType === 'ecommerce');
      if (!options.dryRun) {
        await wpService.installPlugins(resolvedSitePath, plugins);
      } else {
        await simulateStep(2000);
      }
      addJobLog(jobId, 'info', `Plugins installed: ${plugins.join(', ')}`);
    });

    // Step 13: Finalize
    await runStep(13, GENERATION_STEPS[12], async () => {
      const resolvedSitePath = requireValue(sitePath, 'sitePath');
      if (!options.dryRun) {
        await wpService.flushRewriteRules(resolvedSitePath);
      } else {
        await simulateStep(300);
      }
      addJobLog(jobId, 'info', 'Site finalized');
    });

    // Mark as completed - update to final step first
    updateJobProgress(jobId, totalSteps, 'completed');
    progress.complete('Site generation completed successfully');

    logger.info({ jobId, siteUrl }, 'Site generation completed');
    addJobLog(jobId, 'info', 'Site generation completed', { siteUrl });

    return getJob(jobId)!;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    
    // Check if cancellation was the cause
    const finalJob = getJob(jobId);
    if (finalJob?.status === 'cancelled') {
      progress.cancel('Job cancelled');
      addJobLog(jobId, 'info', 'Generation stopped due to cancellation');
      return finalJob;
    }
    
    progress.fail(errorMessage);
    throw err;
  }
}

/**
 * Generate a WordPress site
 */
export async function generateSite(
  config: SiteConfig,
  options: GenerationOptions = {}
): Promise<Job> {
  const jobId = nanoid();
  const totalSteps = GENERATION_STEPS.length;

  // Create job record
  createJob({
    id: jobId,
    businessName: config.businessName,
    niche: config.niche,
    siteType: config.siteType,
    totalSteps,
    config,
  });

  logger.info({ jobId, businessName: config.businessName, dryRun: options.dryRun }, 'Starting site generation');
  addJobLog(jobId, 'info', 'Site generation started', { config });

  // Mark job as in progress
  updateJobProgress(jobId, 0, 'in_progress');

  // Run generation asynchronously so the API can respond immediately
  void (async () => {
    try {
      await runGenerationSteps(jobId, config, options, 1);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      logger.error({ jobId, error: errorMessage }, 'Site generation failed');
      addJobLog(jobId, 'error', `Site generation failed: ${errorMessage}`);

      updateJobStatus(jobId, 'failed', errorMessage);

      // Cleanup on failure
      const failedJob = getJob(jobId);
      if (failedJob && !options.dryRun) {
        await cleanupFailedJob(failedJob);
      }
    }
  })();

  return getJob(jobId)!;
}

/**
 * Clean up resources from a failed job
 */
export async function cleanupFailedJob(job: Job): Promise<void> {
  logger.info({ jobId: job.id }, 'Cleaning up failed job');

  // Drop database if created
  if (job.dbName) {
    try {
      await dbService.dropDatabase(job.dbName);
      logger.info({ dbName: job.dbName }, 'Cleaned up database');
    } catch (err) {
      logger.warn({ dbName: job.dbName, error: err }, 'Failed to cleanup database');
    }
  }

  // Remove site directory if created
  if (job.sitePath) {
    const siteName = job.sitePath.split('/').pop();
    if (siteName) {
      try {
        await fsService.removeSiteDirectory(siteName);
        logger.info({ sitePath: job.sitePath }, 'Cleaned up site directory');
      } catch (err) {
        logger.warn({ sitePath: job.sitePath, error: err }, 'Failed to cleanup site directory');
      }
    }
  }
}

/**
 * Bulk delete multiple sites
 */
export async function bulkDeleteSites(jobIds: string[]): Promise<{ deleted: number; failed: number; errors: string[] }> {
  let deleted = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const jobId of jobIds) {
    try {
      await deleteSite(jobId);
      deleted++;
    } catch (err) {
      failed++;
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      errors.push(`${jobId}: ${errorMessage}`);
      logger.warn({ jobId, error: errorMessage }, 'Failed to delete site in bulk operation');
    }
  }

  logger.info({ deleted, failed, total: jobIds.length }, 'Bulk delete completed');
  return { deleted, failed, errors };
}

/**
 * Delete a site completely (database and files)
 */
export async function deleteSite(jobId: string): Promise<void> {
  const job = getJob(jobId);
  if (!job) {
    throw new Error(`Job not found: ${jobId}`);
  }

  logger.info({ jobId, businessName: job.businessName }, 'Deleting site');

  // Drop database
  if (job.dbName) {
    try {
      await dbService.dropDatabase(job.dbName);
    } catch (err) {
      logger.warn({ dbName: job.dbName, error: err }, 'Failed to drop database');
    }
  }

  // Remove site directory
  if (job.sitePath) {
    const siteName = job.sitePath.split('/').pop();
    if (siteName) {
      try {
        await fsService.removeSiteDirectory(siteName);
      } catch (err) {
        logger.warn({ sitePath: job.sitePath, error: err }, 'Failed to remove site directory');
      }
    }
  }

  // Mark as deleted
  updateJobStatus(jobId, 'deleted');
  addJobLog(jobId, 'info', 'Site deleted');

  logger.info({ jobId }, 'Site deleted successfully');
}

/**
 * Cancel a job that's in progress
 */
export async function cancelJob(jobId: string): Promise<Job> {
  const job = getJob(jobId);
  if (!job) {
    throw new Error(`Job not found: ${jobId}`);
  }

  if (job.status !== 'in_progress' && job.status !== 'pending') {
    throw new Error(`Job cannot be cancelled: current status is ${job.status}`);
  }

  logger.info({ jobId, businessName: job.businessName }, 'Cancelling job');
  addJobLog(jobId, 'info', 'Job cancelled by user');

  updateJobStatus(jobId, 'cancelled', 'Job cancelled by user');

  // Clean up partial resources
  if (!job.sitePath && !job.dbName) {
    // Nothing to clean up if no resources were created yet
    logger.info({ jobId }, 'No resources to clean up');
  } else {
    await cleanupFailedJob(job);
  }

  return getJob(jobId)!;
}

/**
 * Resume a failed job
 */
export async function resumeJob(jobId: string): Promise<Job> {
  const job = getJob(jobId);
  if (!job) {
    throw new Error(`Job not found: ${jobId}`);
  }

  if (job.status !== 'failed') {
    throw new Error(`Job is not in failed state: ${job.status}`);
  }

  if (!job.config) {
    throw new Error('Original job configuration is missing; unable to resume');
  }

  if (job.currentStep >= job.totalSteps) {
    throw new Error('Job has already completed all steps');
  }

  const startStep = Math.max(1, Math.min(job.totalSteps, job.currentStep + 1));
  logger.info({ jobId, startStep }, 'Resuming failed job from last successful step');
  addJobLog(jobId, 'info', `Resuming job from step ${startStep}`);

  resetJobForResume(jobId, job.currentStep);
  try {
    return await runGenerationSteps(jobId, job.config, { dryRun: false }, startStep, job);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    logger.error({ jobId, error: errorMessage }, 'Job resume failed');
    addJobLog(jobId, 'error', `Job resume failed: ${errorMessage}`);
    updateJobStatus(jobId, 'failed', errorMessage);
    throw err;
  }
}
