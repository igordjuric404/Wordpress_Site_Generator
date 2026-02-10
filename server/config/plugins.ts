import type { NicheId } from '../../shared/types.js';

// Core plugins installed on all sites
// NOTE: wordpress-seo (Yoast) and updraftplus removed — they add significant
// boot overhead (~200ms each per request) and aren't needed for generated demo sites.
// WP Super Cache is kept to enable page caching for faster loads.
export const CORE_PLUGINS = [
  'contact-form-7',
  'wp-super-cache',
];

// Plugins to install at the very end (after all other operations)
// Note: Wordfence removed - causes fatal timeouts in local development
export const POST_GENERATION_PLUGINS: string[] = [];

// E-commerce plugins for WooCommerce sites
// WooCommerce is required; other plugins (Stripe, PDF invoices) can be added later
export const ECOMMERCE_PLUGINS = [
  'woocommerce',
];

// Required plugins that must install successfully for their respective site types
export const REQUIRED_ECOMMERCE_PLUGINS = ['woocommerce'];

// Niche-specific plugins (optional - failures won't block generation)
// These can be expanded with industry-specific plugins as needed
// Note: Plugin availability may change; installation failures are logged but don't block generation
export const NICHE_PLUGINS: Record<NicheId, string[]> = {
  plumbing: [],
  salon: [],
  dental: [],
  legal: [],
  restaurant: [],
  fitness: [],
  realestate: [],
  accounting: [],
  automotive: [],
  general: [],
};

/**
 * Get all plugins for a specific site configuration.
 * Accepts any string niche - falls back to empty array for unknown niches.
 */
export function getPluginsForSite(niche: string, isEcommerce: boolean): string[] {
  const nichePlugins = NICHE_PLUGINS[niche as NicheId] || [];
  const plugins = [...CORE_PLUGINS, ...nichePlugins];

  if (isEcommerce) {
    plugins.push(...ECOMMERCE_PLUGINS);
  }

  return plugins;
}
