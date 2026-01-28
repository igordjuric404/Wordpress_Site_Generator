import type { NicheId } from '../../shared/types.js';

// Core plugins installed on all sites
export const CORE_PLUGINS = [
  'contact-form-7',
  'wordpress-seo',
  'updraftplus',
  'wp-super-cache',
  'wordfence',
];

// E-commerce plugins for WooCommerce sites
export const ECOMMERCE_PLUGINS = [
  'woocommerce',
  'woocommerce-gateway-stripe',
  'woocommerce-pdf-invoices-packing-slips',
];

// Niche-specific plugins
export const NICHE_PLUGINS: Record<NicheId, string[]> = {
  plumbing: [],
  salon: [], // TODO: Add booking plugin when available
  dental: [],
  legal: [],
  restaurant: [], // TODO: Add reservation plugin when available
  fitness: [], // TODO: Add scheduling plugin when available
  realestate: [],
  accounting: [],
  automotive: [],
  general: [],
};

/**
 * Get all plugins for a specific site configuration
 */
export function getPluginsForSite(niche: NicheId, isEcommerce: boolean): string[] {
  const plugins = [...CORE_PLUGINS, ...NICHE_PLUGINS[niche]];

  if (isEcommerce) {
    plugins.push(...ECOMMERCE_PLUGINS);
  }

  return plugins;
}
