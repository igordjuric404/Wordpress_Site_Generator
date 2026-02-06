/**
 * Astra Starter Templates Service
 *
 * Handles listing, importing, and customizing Astra Starter Templates.
 * Uses WP-CLI command: wp astra-sites import <numeric-id> --reset --yes
 */

import { createServiceLogger } from '../utils/logger.js';
import * as wpService from './wordpress.service.js';
import {
  type StarterTemplate,
  CURATED_TEMPLATES,
  getTemplateById,
  DEFAULT_TEMPLATE_ID,
} from '../config/starter-templates.js';

const logger = createServiceLogger('starter-templates');

/**
 * List all available Starter Templates (all free templates)
 */
export async function listTemplates(): Promise<StarterTemplate[]> {
  return CURATED_TEMPLATES.filter((t) => !t.isPremium);
}

/**
 * Get all templates (no niche filtering - user picks manually)
 */
export async function getTemplatesForNiche(_nicheId: string): Promise<{
  niche: string;
  recommended: StarterTemplate[];
}> {
  const all = await listTemplates();
  return {
    niche: _nicheId,
    recommended: all,
  };
}

/**
 * Get a single template by ID
 */
export async function getTemplate(templateId: string): Promise<StarterTemplate | null> {
  return getTemplateById(templateId) || null;
}

/**
 * Install the Starter Templates plugin (astra-sites)
 */
export async function installStarterTemplatesPlugin(sitePath: string): Promise<void> {
  logger.info({ sitePath }, 'Installing Starter Templates plugin (astra-sites)');

  try {
    await wpService.wpCli(
      ['plugin', 'install', 'astra-sites', '--activate'],
      { sitePath }
    );
    logger.info({ sitePath }, 'Starter Templates plugin installed and activated');
  } catch (err) {
    logger.error({ sitePath, err }, 'Failed to install Starter Templates plugin');
    throw new Error(`Failed to install Starter Templates plugin: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

/**
 * Import a Starter Template using the official WP-CLI command.
 *
 * Command: wp astra-sites import <numeric-id> --reset --yes
 *
 * This triggers the full import pipeline:
 * - Installs & activates required plugins
 * - Imports customizer settings
 * - Imports XML/WXR content (pages, posts, media)
 * - Imports site options
 * - Imports widgets
 * - Runs batch processing (Gutenberg/Elementor content, images)
 */
export async function importTemplate(
  sitePath: string,
  templateId: string
): Promise<void> {
  logger.info({ sitePath, templateId }, 'Importing Starter Template via WP-CLI');

  // Resolve to numeric ID (in case a slug was passed)
  const resolvedId = templateId || DEFAULT_TEMPLATE_ID;

  // Verify the plugin is installed and active
  try {
    const { stdout: plugins } = await wpService.wpCli(
      ['plugin', 'list', '--status=active', '--format=json'],
      { sitePath }
    );
    const pluginList = JSON.parse(plugins);
    const hasPlugin = pluginList.some(
      (p: { name: string }) => p.name === 'astra-sites'
    );
    if (!hasPlugin) {
      throw new Error('Starter Templates plugin (astra-sites) not installed or not active');
    }
  } catch (err) {
    if (err instanceof Error && err.message.includes('not installed')) {
      throw err;
    }
    logger.warn({ sitePath, err }, 'Could not verify plugin status, continuing with import');
  }

  // Run the official WP-CLI import command
  // This is the same import pipeline used by the WordPress admin UI
  try {
    await wpService.wpCli(
      ['astra-sites', 'import', resolvedId, '--reset', '--yes'],
      { sitePath }
    );
    logger.info({ sitePath, templateId: resolvedId }, 'Template imported successfully via WP-CLI');
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    logger.error({ sitePath, templateId: resolvedId, err }, 'WP-CLI astra-sites import failed');
    throw new Error(`Failed to import template ${resolvedId}: ${errorMessage}`);
  }
}

/**
 * Customize imported site content.
 * Replaces placeholder strings with actual business information.
 */
export async function customizeImportedSite(
  sitePath: string,
  config: {
    businessName: string;
    phone: string;
    email: string;
    address: string;
  }
): Promise<void> {
  logger.info({ sitePath }, 'Customizing imported site content');

  // Common placeholder strings to replace
  const replacements = [
    { old: 'Company Name', new: config.businessName },
    { old: 'Business Name', new: config.businessName },
    { old: 'Your Company', new: config.businessName },
    { old: 'Your Business', new: config.businessName },
    { old: 'Starter Template', new: config.businessName },
    { old: 'Demo Site', new: config.businessName },
    { old: '555-123-4567', new: config.phone },
    { old: '(555) 123-4567', new: config.phone },
    { old: '+1 555 123 4567', new: config.phone },
    { old: '123-456-7890', new: config.phone },
    { old: '(123) 456-7890', new: config.phone },
    { old: 'contact@example.com', new: config.email },
    { old: 'info@example.com', new: config.email },
    { old: 'hello@example.com', new: config.email },
    { old: 'support@example.com', new: config.email },
    { old: 'email@example.com', new: config.email },
    { old: '123 Main Street, City, State 12345', new: config.address },
    { old: '123 Main St, City, State', new: config.address },
  ];

  for (const { old, new: newValue } of replacements) {
    try {
      await wpService.wpCli(
        ['search-replace', old, newValue, '--all-tables', '--precise', '--quiet'],
        { sitePath }
      );
    } catch {
      // Search-replace might not find matches, which is okay
    }
  }

  // Update site title
  await wpService.wpCli(
    ['option', 'update', 'blogname', config.businessName],
    { sitePath }
  );

  // Update admin email
  await wpService.wpCli(
    ['option', 'update', 'admin_email', config.email],
    { sitePath }
  );

  // Update site tagline
  await wpService.wpCli(
    ['option', 'update', 'blogdescription', `Welcome to ${config.businessName}`],
    { sitePath }
  );

  logger.info({ sitePath }, 'Site content customization completed');
}

/**
 * Verify Elementor is installed and active
 */
export async function verifyElementorInstalled(sitePath: string): Promise<boolean> {
  try {
    const { stdout } = await wpService.wpCli(
      ['plugin', 'list', '--status=active', '--format=json'],
      { sitePath }
    );
    const plugins = JSON.parse(stdout);
    return plugins.some((p: { name: string }) => p.name === 'elementor');
  } catch {
    return false;
  }
}

/**
 * Install Elementor if not already installed
 */
export async function ensureElementorInstalled(sitePath: string): Promise<void> {
  const isInstalled = await verifyElementorInstalled(sitePath);
  if (!isInstalled) {
    logger.info({ sitePath }, 'Installing Elementor');
    await wpService.wpCli(
      ['plugin', 'install', 'elementor', '--activate'],
      { sitePath }
    );
    logger.info({ sitePath }, 'Elementor installed and activated');
  }
}
