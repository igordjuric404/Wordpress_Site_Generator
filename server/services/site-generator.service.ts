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
  'Installing theme',
  'Installing plugins',
  'Creating homepage',
  'Creating about page',
  'Creating services page',
  'Creating contact page',
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

/**
 * Generate a WordPress site
 */
export async function generateSite(
  config: SiteConfig,
  options: GenerationOptions = {}
): Promise<Job> {
  const jobId = nanoid();
  const totalSteps = GENERATION_STEPS.length;
  const progress = createProgressHelper(jobId, totalSteps);

  // Create job record
  createJob({
    id: jobId,
    businessName: config.businessName,
    niche: config.niche,
    siteType: config.siteType,
    totalSteps,
  });

  logger.info({ jobId, businessName: config.businessName, dryRun: options.dryRun }, 'Starting site generation');
  addJobLog(jobId, 'info', 'Site generation started', { config });

  try {
    // Mark job as in progress
    updateJobProgress(jobId, 0, 'in_progress');
    progress.start('Starting site generation');

    // Step 1: Validate configuration
    progress.advance(GENERATION_STEPS[0]);
    if (!options.dryRun) {
      // Validation is always done
      if (!config.businessName || !config.niche) {
        throw new Error('Business name and niche are required');
      }
    } else {
      await simulateStep(300);
    }
    addJobLog(jobId, 'info', 'Configuration validated');

    // Step 2: Create site directory
    progress.advance(GENERATION_STEPS[1]);
    const siteName = await fsService.getNextAvailableSiteName(config.businessName);
    const sitePath = options.dryRun
      ? `/Applications/MAMP/htdocs/${siteName}`
      : await fsService.createSiteDirectory(siteName);
    const siteUrl = fsService.getSiteUrl(siteName);

    updateJobSiteInfo(jobId, { sitePath, siteUrl });
    addJobLog(jobId, 'info', `Site directory: ${sitePath}`);

    if (options.dryRun) {
      await simulateStep(500);
    }

    // Step 3: Create database
    progress.advance(GENERATION_STEPS[2]);
    const dbName = await dbService.getNextAvailableDbName(config.businessName);

    if (!options.dryRun) {
      await dbService.createDatabase(dbName);
    } else {
      await simulateStep(800);
    }

    updateJobSiteInfo(jobId, { dbName });
    addJobLog(jobId, 'info', `Database created: ${dbName}`);

    // Step 4: Download WordPress
    progress.advance(GENERATION_STEPS[3]);
    if (!options.dryRun) {
      await wpService.downloadWordPress(sitePath);
    } else {
      await simulateStep(2000);
    }
    addJobLog(jobId, 'info', 'WordPress downloaded');

    // Step 5: Configure WordPress
    progress.advance(GENERATION_STEPS[4]);
    const mysqlPort = process.env.MYSQL_PORT || '3306';
    const mysqlPassword = process.env.MYSQL_PASSWORD !== undefined 
      ? process.env.MYSQL_PASSWORD 
      : '';  // XAMPP default is empty password
    
    if (!options.dryRun) {
      await wpService.createConfig(sitePath, {
        dbName,
        dbUser: process.env.MYSQL_USER || 'root',
        dbPassword: mysqlPassword,
        dbHost: `localhost:${mysqlPort}`,
      });
    } else {
      await simulateStep(500);
    }
    addJobLog(jobId, 'info', 'WordPress configured');

    // Step 6: Install WordPress
    progress.advance(GENERATION_STEPS[5]);
    const adminPassword = generatePassword();
    const adminEmail = config.email || 'admin@example.com';

    if (!options.dryRun) {
      // Database already created in Step 3, no need to create again
      await wpService.installCore(sitePath, {
        url: siteUrl,
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

    // Step 7: Install theme
    progress.advance(GENERATION_STEPS[6]);
    const theme = config.theme || DEFAULT_THEME;
    if (!options.dryRun) {
      await wpService.installTheme(sitePath, theme);
    } else {
      await simulateStep(1000);
    }
    addJobLog(jobId, 'info', `Theme installed: ${theme}`);

    // Step 8: Install plugins
    progress.advance(GENERATION_STEPS[7]);
    const plugins = getPluginsForSite(config.niche, config.siteType === 'ecommerce');
    if (!options.dryRun) {
      await wpService.installPlugins(sitePath, plugins);
    } else {
      await simulateStep(2000);
    }
    addJobLog(jobId, 'info', `Plugins installed: ${plugins.join(', ')}`);

    // Step 9-12: Create pages with placeholder content
    const templates = PLACEHOLDER_TEMPLATES[config.niche];
    const templateVars = {
      businessName: config.businessName,
      city: extractCity(config.address),
      phone: config.phone,
      email: config.email,
    };

    // Homepage
    progress.advance(GENERATION_STEPS[8]);
    const homepageContent = getHomepageHtml(config.niche, config.businessName);
    let homepageId = 0;
    if (!options.dryRun) {
      homepageId = await wpService.createPage(sitePath, {
        title: 'Home',
        content: homepageContent,
      });
      await wpService.setHomepage(sitePath, homepageId);
    } else {
      await simulateStep(800);
    }
    addJobLog(jobId, 'info', 'Homepage created');

    // About page
    progress.advance(GENERATION_STEPS[9]);
    const aboutContent = populateTemplate(templates.about, templateVars);
    if (!options.dryRun) {
      await wpService.createPage(sitePath, {
        title: 'About',
        content: aboutContent,
      });
    } else {
      await simulateStep(600);
    }
    addJobLog(jobId, 'info', 'About page created');

    // Services page
    progress.advance(GENERATION_STEPS[10]);
    const servicesContent = populateTemplate(templates.services, templateVars);
    if (!options.dryRun) {
      await wpService.createPage(sitePath, {
        title: 'Services',
        content: servicesContent,
      });
    } else {
      await simulateStep(600);
    }
    addJobLog(jobId, 'info', 'Services page created');

    // Contact page
    progress.advance(GENERATION_STEPS[11]);
    const contactContent = populateTemplate(templates.contact, templateVars);
    if (!options.dryRun) {
      await wpService.createPage(sitePath, {
        title: 'Contact',
        content: contactContent,
      });
    } else {
      await simulateStep(600);
    }
    addJobLog(jobId, 'info', 'Contact page created');

    // Step 13: Finalize
    progress.advance(GENERATION_STEPS[12]);
    if (!options.dryRun) {
      await wpService.flushRewriteRules(sitePath);
    } else {
      await simulateStep(300);
    }
    addJobLog(jobId, 'info', 'Site finalized');

    // Mark as completed
    updateJobStatus(jobId, 'completed');
    progress.complete('Site generation completed successfully');

    logger.info({ jobId, siteUrl }, 'Site generation completed');
    addJobLog(jobId, 'info', 'Site generation completed', { siteUrl });

    return getJob(jobId)!;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    logger.error({ jobId, error: errorMessage }, 'Site generation failed');
    addJobLog(jobId, 'error', `Site generation failed: ${errorMessage}`);

    updateJobStatus(jobId, 'failed', errorMessage);
    progress.fail(errorMessage);

    // Cleanup on failure
    const failedJob = getJob(jobId);
    if (failedJob && !options.dryRun) {
      await cleanupFailedJob(failedJob);
    }

    throw err;
  }
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

  // For now, we'll restart from the beginning
  // In a more sophisticated implementation, we'd track which step failed
  // and resume from there
  logger.info({ jobId }, 'Resuming failed job (restarting from beginning)');

  // Clean up any partial resources first
  await cleanupFailedJob(job);

  // Re-run with the same config
  // Note: We'd need to store the original config to properly resume
  // For now, this is a simplified implementation
  throw new Error('Job resumption not fully implemented yet - please create a new job');
}
