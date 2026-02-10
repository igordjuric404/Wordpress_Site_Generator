import { nanoid } from 'nanoid';
import crypto from 'crypto';
import type { SiteConfig, Job } from '../../shared/types.js';
import { createServiceLogger } from '../utils/logger.js';
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
import * as starterTemplatesService from './starter-templates.service.js';
import * as aiContentService from './ai-content.service.js';
import { getPluginsForSite, REQUIRED_ECOMMERCE_PLUGINS, POST_GENERATION_PLUGINS } from '../config/plugins.js';
import { DEFAULT_THEME, getTheme } from '../config/themes.js';
// Note: placeholders.ts is no longer used - templates are imported via Starter Templates
import { getProductsForNiche } from '../config/ecommerce/products.js';
import { getDefaultTemplateForNiche } from '../config/starter-templates.js';

const logger = createServiceLogger('site-generator');

// Generation steps for tracking progress
// Updated for Astra Starter Templates integration + AI content generation
const GENERATION_STEPS = [
  'Validating configuration',             // Step 1
  'Creating site directory',              // Step 2
  'Creating database',                    // Step 3
  'Downloading WordPress',               // Step 4
  'Configuring WordPress',               // Step 5
  'Installing WordPress',                // Step 6
  'Installing Starter Templates plugin', // Step 7: Install Astra + Starter Templates
  'Importing professional template',     // Step 8: Import selected template via WP-CLI
  'Customizing site content',            // Step 9: Replace placeholders with business info
  'Installing additional plugins',       // Step 10: Install remaining plugins
  'Finalizing site',                     // Step 11: WooCommerce setup, menus, permalinks
  'Installing security plugins',         // Step 12: Post-generation plugins
  'Generating AI content',              // Step 13: Rewrite pages with Hugging Face Mistral
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
      addJobLog(jobId, 'info', 'Validating site configuration');
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
      addJobLog(jobId, 'info', 'Downloading WordPress core files');
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
      addJobLog(jobId, 'info', 'Writing wp-config.php');
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
      addJobLog(jobId, 'info', 'Running WordPress installer');
    });

    // Step 7: Install theme + builder plugins based on the selected stack
    await runStep(7, GENERATION_STEPS[6], async () => {
      const resolvedSitePath = requireValue(sitePath, 'sitePath');
      
      if (!options.dryRun) {
        // Resolve the theme definition to find the correct WordPress theme slug and plugins
        const themeSlug = config.theme || DEFAULT_THEME;
        const themeDef = getTheme(themeSlug);
        const wpTheme = themeDef?.wpThemeSlug || 'astra';
        
        // Install the WordPress theme
        addJobLog(jobId, 'info', `Installing theme: ${wpTheme}`);
        await wpService.installTheme(resolvedSitePath, wpTheme);
        
        // Install Starter Templates plugin (needed for import regardless of stack)
        addJobLog(jobId, 'info', 'Installing Starter Templates plugin');
        await starterTemplatesService.installStarterTemplatesPlugin(resolvedSitePath);
        
        // Install builder-specific plugins based on the theme's stack
        if (themeDef?.requiredPlugins && themeDef.requiredPlugins.length > 0) {
          for (const plugin of themeDef.requiredPlugins) {
            try {
              addJobLog(jobId, 'info', `Installing builder plugin: ${plugin}`);
              await wpService.wpCli(
                ['plugin', 'install', plugin, '--activate'],
                { sitePath: resolvedSitePath }
              );
            } catch (pluginErr) {
              logger.warn({ sitePath: resolvedSitePath, plugin, err: pluginErr }, 'Builder plugin install failed');
              addJobLog(jobId, 'warning', `Builder plugin failed: ${plugin}`);
            }
          }
        }
      } else {
        await simulateStep(1500);
      }
    });

    // Step 8: Import selected Starter Template
    await runStep(8, GENERATION_STEPS[7], async () => {
      const resolvedSitePath = requireValue(sitePath, 'sitePath');
      // Use the templateId from config, or get default for the niche
      const templateId = config.templateId || getDefaultTemplateForNiche(config.niche);
      
      if (!options.dryRun) {
        addJobLog(jobId, 'info', `Importing template ${templateId}`);
        
        // Store the template ID in the job record
        updateJobSiteInfo(jobId, { templateId });
        
        await starterTemplatesService.importTemplate(resolvedSitePath, templateId);
        
        // Upgrade Spectra to 3.0 beta AFTER import — critical ordering
        const themeSlug = config.theme || DEFAULT_THEME;
        const themeDef = getTheme(themeSlug);
        if (themeDef?.enableSpectraBeta) {
          addJobLog(jobId, 'info', 'Upgrading Spectra to 3.0 beta');
          try {
            const betaUrl = 'https://downloads.wordpress.org/plugin/ultimate-addons-for-gutenberg.3.0.0-beta.2.zip';
            await wpService.wpCli(
              ['plugin', 'install', betaUrl, '--force', '--activate'],
              { sitePath: resolvedSitePath }
            );
          } catch (betaErr) {
            logger.warn({ sitePath: resolvedSitePath, err: betaErr }, 'Spectra beta upgrade failed');
            addJobLog(jobId, 'warning', 'Spectra beta upgrade failed');
          }
        }
      } else {
        await simulateStep(3000);
        addJobLog(jobId, 'info', `Template import (dry run): ${templateId}`);
      }
    });

    // Step 9: Customize imported site content
    await runStep(9, GENERATION_STEPS[8], async () => {
      const resolvedSitePath = requireValue(sitePath, 'sitePath');
      
      if (!options.dryRun) {
        addJobLog(jobId, 'info', 'Replacing placeholder content with business info');
        await starterTemplatesService.customizeImportedSite(resolvedSitePath, {
          businessName: config.businessName,
          phone: config.phone,
          email: config.email,
          address: config.address,
        });
        addJobLog(jobId, 'info', 'Setting site title and tagline');
        addJobLog(jobId, 'info', 'Configuring contact form email recipient');
      } else {
        await simulateStep(1000);
        addJobLog(jobId, 'info', 'Content customization (dry run)');
      }
    });

    // Step 10: Install additional plugins
    await runStep(10, GENERATION_STEPS[9], async () => {
      const resolvedSitePath = requireValue(sitePath, 'sitePath');
      const isEcommerce = config.siteType === 'ecommerce';
      const plugins = getPluginsForSite(config.niche, isEcommerce);
      
      if (!options.dryRun) {
        for (const p of plugins) {
          addJobLog(jobId, 'info', `Installing plugin: ${p}`);
        }
        const result = await wpService.installPlugins(resolvedSitePath, plugins);
        
        // For e-commerce sites, verify required plugins are installed
        if (isEcommerce) {
          const missingRequired = REQUIRED_ECOMMERCE_PLUGINS.filter(
            (plugin) => result.failed.includes(plugin)
          );
          if (missingRequired.length > 0) {
            throw new Error(
              `Required e-commerce plugin (WooCommerce) failed to install. ` +
              `This may be due to network issues or WordPress.org API problems.`
            );
          }
        }
        
        if (result.failed.length > 0) {
          addJobLog(jobId, 'warning', `Failed optional plugins: ${result.failed.join(', ')}`);
        }
      } else {
        await simulateStep(2000);
        addJobLog(jobId, 'info', `Plugins (dry run): ${plugins.join(', ')}`);
      }
    });

    // Step 11: Finalize (includes WooCommerce setup and product seeding for e-commerce sites)
    await runStep(11, GENERATION_STEPS[10], async () => {
      const resolvedSitePath = requireValue(sitePath, 'sitePath');
      const isEcommerce = config.siteType === 'ecommerce';
      
      if (!options.dryRun) {
        if (isEcommerce) {
          addJobLog(jobId, 'info', 'Configuring WooCommerce store');
          await wpService.setupWooCommerce(resolvedSitePath);
          
          // Clean up duplicate WC pages that may have been created by template import + WC setup
          addJobLog(jobId, 'info', 'Cleaning up duplicate WooCommerce pages');
          await wpService.cleanupDuplicateWooCommercePages(resolvedSitePath);
          
          try {
            const { stdout: menuList } = await wpService.wpCli(
              ['menu', 'list', '--format=ids'],
              { sitePath: resolvedSitePath }
            );
            const menuId = parseInt(menuList.trim().split('\n')[0], 10);
            if (menuId && !isNaN(menuId)) {
              addJobLog(jobId, 'info', 'Adding WooCommerce pages to navigation');
              await wpService.addWooCommercePagesToMenu(resolvedSitePath, menuId);
            }
          } catch (menuErr) {
            logger.warn({ sitePath: resolvedSitePath, menuErr }, 'Failed to add WooCommerce pages to menu');
          }
          
          // Extract product categories from template shortcodes and ensure they exist
          addJobLog(jobId, 'info', 'Detecting template product categories');
          const templateCategories = await wpService.extractTemplateProductCategories(resolvedSitePath);
          if (templateCategories.length > 0) {
            addJobLog(jobId, 'info', `Found template product categories: ${templateCategories.join(', ')}`);
            await wpService.ensureProductCategories(resolvedSitePath, templateCategories);
          }
          
          addJobLog(jobId, 'info', 'Seeding sample products');
          const productConfig = getProductsForNiche(config.niche);
          
          // If template references specific categories, seed products into those instead
          if (templateCategories.length > 0) {
            // Seed products distributed across template categories
            let categoryIndex = 0;
            for (const product of productConfig.products) {
              const catSlug = templateCategories[categoryIndex % templateCategories.length];
              // Override the product's category to match template expectations
              product.category = catSlug;
              categoryIndex++;
            }
          }
          
          const seedResult = await wpService.seedProducts(
            resolvedSitePath,
            productConfig.categories,
            productConfig.products
          );
          addJobLog(jobId, 'info', `Created ${seedResult.productsCreated} products in ${seedResult.categoriesCreated} categories`);
        }
        
        // Deactivate conflicting plugins (modern-cart causes double cart sidebar)
        addJobLog(jobId, 'info', 'Deactivating conflicting plugins');
        for (const pluginToDisable of ['modern-cart', 'woo-cart-abandonment-recovery', 'cartflows']) {
          try {
            await wpService.wpCli(['plugin', 'deactivate', pluginToDisable], { sitePath: resolvedSitePath });
          } catch { /* plugin may not be installed */ }
        }
        
        // Clean up navigation menus: remove duplicates, admin links
        addJobLog(jobId, 'info', 'Cleaning up navigation menus');
        await wpService.cleanupMenuItems(resolvedSitePath);
        
        // Disable admin bar and Astra account icon on frontend
        addJobLog(jobId, 'info', 'Disabling admin bar on frontend');
        await wpService.disableAdminBar(resolvedSitePath);
        
        // Disable Astra header account element (the WP-admin/login icon)
        try {
          // Remove the account icon from Astra's header builder
          await wpService.wpCli(
            ['option', 'patch', 'update', 'astra-settings', 'header-account-login-style', 'none'],
            { sitePath: resolvedSitePath }
          );
          await wpService.wpCli(
            ['option', 'patch', 'update', 'astra-settings', 'header-account-logout-style', 'none'],
            { sitePath: resolvedSitePath }
          );
          // Also try setting the account visibility to hidden
          await wpService.wpCli(
            ['eval', `
              $settings = get_option('astra-settings', array());
              // Remove account from header builder elements
              foreach (['header-desktop-items', 'header-mobile-items'] as $key) {
                if (isset($settings[$key])) {
                  $json = json_encode($settings[$key]);
                  $json = str_replace('"account"', '""', $json);
                  $settings[$key] = json_decode($json, true);
                }
              }
              update_option('astra-settings', $settings);
              echo 'done';
            `],
            { sitePath: resolvedSitePath }
          );
        } catch {
          // Astra settings may not exist or may have different structure
        }
        
        addJobLog(jobId, 'info', 'Flushing rewrite rules');
        await wpService.flushRewriteRules(resolvedSitePath);

        addJobLog(jobId, 'info', 'Disabling WP Cron');
        try {
          await wpService.wpCli(
            ['config', 'set', 'DISABLE_WP_CRON', 'true', '--raw', '--type=constant'],
            { sitePath: resolvedSitePath }
          );
        } catch (cronErr) {
          logger.warn({ sitePath: resolvedSitePath, err: cronErr }, 'Failed to disable WP Cron');
        }

        addJobLog(jobId, 'info', 'Enabling page caching');
        try {
          await wpService.wpCli(
            ['option', 'update', 'wpsupercache_is_enabled', '1'],
            { sitePath: resolvedSitePath }
          );
          await wpService.wpCli(
            ['config', 'set', 'WP_CACHE', 'true', '--raw', '--type=constant'],
            { sitePath: resolvedSitePath }
          );
        } catch (cacheErr) {
          logger.warn({ sitePath: resolvedSitePath, err: cacheErr }, 'Failed to enable WP Super Cache');
        }

        try {
          await wpService.wpCli(
            ['option', 'update', 'heartbeat_control_behavior', 'disable_everywhere'],
            { sitePath: resolvedSitePath }
          );
        } catch {
          // Heartbeat control may not be installed
        }
      } else {
        await simulateStep(isEcommerce ? 2500 : 300);
        if (isEcommerce) {
          addJobLog(jobId, 'info', 'WooCommerce setup (dry run)');
          addJobLog(jobId, 'info', 'Sample products (dry run)');
        }
      }
      addJobLog(jobId, 'info', 'Site finalized');
    });

    // Step 12: Install post-generation plugins
    // Reserved for plugins that should be installed after all other operations
    // Currently empty - Wordfence removed due to local development incompatibility
    await runStep(12, GENERATION_STEPS[11], async () => {
      if (!options.dryRun) {
        const resolvedSitePath = requireValue(sitePath, 'sitePath');
        
        if (POST_GENERATION_PLUGINS.length > 0) {
          addJobLog(jobId, 'info', `Installing security plugins: ${POST_GENERATION_PLUGINS.join(', ')}`);
          const result = await wpService.installPlugins(resolvedSitePath, POST_GENERATION_PLUGINS);
          if (result.failed.length > 0) {
            addJobLog(jobId, 'warning', `Failed: ${result.failed.join(', ')}`);
          }
        }
      } else {
        await simulateStep(300);
        addJobLog(jobId, 'info', 'Security plugins (dry run)');
      }
      addJobLog(jobId, 'info', 'Security setup complete');
    });

    // Step 13: AI Content Generation using Hugging Face Mistral-7B-Instruct
    // Only runs when enableAiContent is explicitly set to true
    await runStep(13, GENERATION_STEPS[12], async () => {
      if (!config.enableAiContent) {
        addJobLog(jobId, 'info', 'AI content generation skipped');
        return;
      }

      const resolvedSitePath = requireValue(sitePath, 'sitePath');
      
      if (!options.dryRun) {
        addJobLog(jobId, 'info', `Starting AI content generation for: ${config.niche}`);
        if (config.additionalContext) {
          addJobLog(jobId, 'info', `Using additional context: ${config.additionalContext.slice(0, 100)}`);
        }
        
        try {
          const aiResult = await aiContentService.generateAiContent(
            resolvedSitePath,
            config.niche,
            (message) => {
              addJobLog(jobId, 'info', `AI: ${message}`);
            },
            config.additionalContext,
            config.dryRunAi === true
          );
          
          addJobLog(jobId, 'info', `AI: ${aiResult.pagesProcessed} pages rewritten, ${aiResult.pagesSkipped} skipped`);
        } catch (aiErr) {
          const errMsg = aiErr instanceof Error ? aiErr.message : 'Unknown AI error';
          logger.warn({ sitePath: resolvedSitePath, err: aiErr }, 'AI content generation failed');
          addJobLog(jobId, 'warning', `AI content generation failed: ${errMsg}`);
        }
      } else {
        await simulateStep(2000);
        addJobLog(jobId, 'info', 'AI content generation (dry run)');
      }
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
    templateId: config.templateId,
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
