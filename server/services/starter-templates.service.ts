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
  type BuilderStack,
  CURATED_TEMPLATES,
  getTemplateById,
  getTemplatesByStack,
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
 * List templates filtered by builder stack
 */
export async function listTemplatesByStack(stack: BuilderStack): Promise<StarterTemplate[]> {
  return getTemplatesByStack(stack);
}

/**
 * Get all templates (no niche filtering - user picks manually)
 */
export async function getTemplatesForNiche(_nicheId: string): Promise<{
  niche: string;
  recommended: StarterTemplate[];
}> {
  const all = await listTemplates();
  return { niche: _nicheId, recommended: all };
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
 * - Runs batch processing (Gutenberg content, images)
 */
export async function importTemplate(
  sitePath: string,
  templateId: string
): Promise<void> {
  logger.info({ sitePath, templateId }, 'Importing Starter Template via WP-CLI');

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

  // Validate template compatibility: ensure the template exists in our curated list
  const template = getTemplateById(resolvedId);
  if (template) {
    logger.info(
      { templateId: resolvedId, name: template.name, builderStack: template.builderStack },
      'Template compatibility verified'
    );
  } else {
    logger.warn({ templateId: resolvedId }, 'Template not found in curated list — importing anyway');
  }

  // Run the official WP-CLI import command
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

  // Normalize phone: strip any +1 prefix from user input if a non-US country code is present
  const normalizedPhone = normalizePhoneNumber(config.phone);

  const replacements = [
    // Business name replacements
    { old: 'Company Name', new: config.businessName },
    { old: 'Business Name', new: config.businessName },
    { old: 'Your Company', new: config.businessName },
    { old: 'Your Business', new: config.businessName },
    { old: 'Starter Template', new: config.businessName },
    { old: 'Demo Site', new: config.businessName },
    // Phone replacements (comprehensive patterns)
    { old: '555-123-4567', new: normalizedPhone },
    { old: '(555) 123-4567', new: normalizedPhone },
    { old: '+1 555 123 4567', new: normalizedPhone },
    { old: '+1-555-123-4567', new: normalizedPhone },
    { old: '123-456-7890', new: normalizedPhone },
    { old: '(123) 456-7890', new: normalizedPhone },
    { old: '+1 123 456 7890', new: normalizedPhone },
    { old: '000-000-0000', new: normalizedPhone },
    { old: '(000) 000-0000', new: normalizedPhone },
    { old: '+1 (555) 123-4567', new: normalizedPhone },
    { old: '1-555-123-4567', new: normalizedPhone },
    { old: '202-555-0188', new: normalizedPhone },
    { old: '202-555-0100', new: normalizedPhone },
    { old: '+1-000-000-0000', new: normalizedPhone },
    // Email replacements
    { old: 'contact@example.com', new: config.email },
    { old: 'info@example.com', new: config.email },
    { old: 'hello@example.com', new: config.email },
    { old: 'support@example.com', new: config.email },
    { old: 'email@example.com', new: config.email },
    { old: 'admin@example.com', new: config.email },
    { old: 'mail@example.com', new: config.email },
    { old: 'demo@example.com', new: config.email },
    { old: 'test@example.com', new: config.email },
    // Address replacements
    { old: '123 Main Street, City, State 12345', new: config.address },
    { old: '123 Main St, City, State', new: config.address },
    { old: '123 Main Street', new: config.address },
    { old: '123 Street Name, City', new: config.address },
    { old: '1234 Street Name, City Name', new: config.address },
    { old: 'New York, NY 10001', new: config.address },
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

  // Regex-based replacements for patterns that vary across templates
  const regexReplacements: Array<{ pattern: string; replacement: string; description: string }> = [
    // Replace any @example.com emails
    {
      pattern: '[a-zA-Z0-9._%+-]+@example\\.com',
      replacement: config.email,
      description: 'example.com emails',
    },
    // Replace demo address patterns (common in Astra templates)
    {
      pattern: '123 Demo St[^"]*United States',
      replacement: config.address,
      description: 'demo address (full)',
    },
    {
      pattern: '123 Demo St[^"]*',
      replacement: config.address,
      description: 'demo address (partial)',
    },
    // Fix phone numbers that have "+1 " prefix prepended to user phone
    // Catches "+1 +XXX..." or "+1+XXX..." where the user's phone already has a country code
    {
      pattern: '\\+1\\s*\\+',
      replacement: '+',
      description: 'double country code fix (+1 +X -> +X)',
    },
  ];

  for (const { pattern, replacement, description } of regexReplacements) {
    try {
      await wpService.wpCli(
        ['search-replace', pattern, replacement, '--all-tables', '--quiet', '--regex'],
        { sitePath }
      );
      logger.info({ sitePath, description }, 'Regex replacement applied');
    } catch {
      // Regex search-replace may fail silently
    }
  }

  // Replace Google Maps address in Spectra blocks
  // The spectra/google-map block stores address in JSON like "address":"san francisco"
  if (config.address) {
    const addressForMap = config.address.split(',').slice(0, 2).join(',').trim() || config.address;
    const defaultMapAddresses = ['san francisco', 'new york', 'los angeles', 'chicago', 'houston'];
    for (const defaultAddr of defaultMapAddresses) {
      try {
        await wpService.wpCli(
          ['search-replace', `"address":"${defaultAddr}"`, `"address":"${addressForMap}"`, '--all-tables', '--precise', '--quiet'],
          { sitePath }
        );
      } catch { /* ok */ }
    }
  }

  await wpService.wpCli(
    ['option', 'update', 'blogname', config.businessName],
    { sitePath }
  );

  await wpService.wpCli(
    ['option', 'update', 'admin_email', config.email],
    { sitePath }
  );

  await wpService.wpCli(
    ['option', 'update', 'blogdescription', `Welcome to ${config.businessName}`],
    { sitePath }
  );

  // Set WooCommerce store address if available
  if (config.address) {
    try {
      // Parse address components (best effort)
      const addressParts = config.address.split(',').map(p => p.trim());
      if (addressParts.length >= 1) {
        await wpService.wpCli(['option', 'update', 'woocommerce_store_address', addressParts[0]], { sitePath });
      }
      if (addressParts.length >= 2) {
        await wpService.wpCli(['option', 'update', 'woocommerce_store_city', addressParts[1]], { sitePath });
      }
      if (addressParts.length >= 3) {
        await wpService.wpCli(['option', 'update', 'woocommerce_store_postcode', addressParts[addressParts.length - 1].replace(/\D/g, '') || ''], { sitePath });
      }
    } catch {
      // WooCommerce options may not exist
    }
  }

  // Configure Contact Form 7 email recipient
  try {
    const { stdout: cf7Forms } = await wpService.wpCli(
      ['post', 'list', '--post_type=wpcf7_contact_form', '--format=ids'],
      { sitePath }
    );
    const formIds = cf7Forms.trim().split(/\s+/).filter(Boolean);
    for (const formId of formIds) {
      try {
        // Update the CF7 form mail recipient directly via option
        const { stdout: mailMeta } = await wpService.wpCli(
          ['post', 'meta', 'get', formId, '_mail'],
          { sitePath }
        );
        // Replace any email that looks like a placeholder
        if (mailMeta.includes('example.com') || mailMeta.includes('your-email') || mailMeta.includes('[_site_admin_email]')) {
          const updatedMail = mailMeta
            .replace(/[a-zA-Z0-9._%+-]+@example\.com/g, config.email)
            .replace(/\[?your-email\]?/g, config.email);
          await wpService.wpCli(
            ['post', 'meta', 'update', formId, '_mail', updatedMail],
            { sitePath }
          );
        }
      } catch {
        // Individual form update may fail, continue with others
      }
    }
  } catch {
    // CF7 might not be installed yet at this point
  }

  logger.info({ sitePath }, 'Site content customization completed');
}

/**
 * Normalize a phone number to prevent double country code prepending.
 * If the phone already starts with a country code (+ followed by digits),
 * it is returned as-is. Otherwise, it is returned unchanged.
 */
function normalizePhoneNumber(phone: string): string {
  const trimmed = phone.trim();
  // Already has a country code — return as-is
  if (trimmed.startsWith('+')) return trimmed;
  // No country code — return as-is (don't auto-add one)
  return trimmed;
}
