import type { BuilderStack } from './starter-templates.js';

// Curated theme list - free, actively maintained, high performance
export interface ThemeDefinition {
  slug: string;
  name: string;
  description: string;
  features: string[];
  recommended: boolean;
  /**
   * The builder stack this theme option maps to.
   * Used to filter compatible starter templates.
   * null = no templates available for this theme.
   */
  builderStack: BuilderStack | null;
  /**
   * WordPress plugins that must be installed for this builder stack.
   * Empty = no extra plugins beyond the theme itself.
   */
  requiredPlugins: string[];
  /**
   * Whether to enable Spectra 3.0 beta updates.
   * Required for -09 templates that use the spectra/* block namespace.
   */
  enableSpectraBeta: boolean;
  /**
   * The WordPress theme slug to install.
   * All Astra Starter Templates use the 'astra' theme.
   */
  wpThemeSlug: string;
}

export const THEMES: ThemeDefinition[] = [
  {
    slug: 'spectra',
    name: 'Spectra (Astra + Spectra Blocks)',
    description: 'Modern Astra theme with Spectra page-builder blocks — the largest free template library',
    features: ['60+ Free Templates', 'Spectra Blocks', 'WooCommerce Ready'],
    recommended: true,
    builderStack: 'spectra',
    requiredPlugins: ['ultimate-addons-for-gutenberg'],
    enableSpectraBeta: true,
    wpThemeSlug: 'astra',
  },
  {
    slug: 'astra',
    name: 'Astra (Classic Block Editor)',
    description: 'Lightweight Astra theme with standard Gutenberg blocks — no extra plugins required',
    features: ['17 Free Templates', 'No Extra Plugins', 'Lightweight'],
    recommended: false,
    builderStack: 'classic',
    requiredPlugins: [],
    enableSpectraBeta: false,
    wpThemeSlug: 'astra',
  },
  {
    slug: 'oceanwp',
    name: 'OceanWP',
    description: 'Feature-rich theme, excellent for e-commerce sites',
    features: ['E-commerce Ready', 'Highly Customizable', 'SEO Optimized'],
    recommended: false,
    builderStack: null,
    requiredPlugins: [],
    enableSpectraBeta: false,
    wpThemeSlug: 'oceanwp',
  },
  {
    slug: 'neve',
    name: 'Neve',
    description: 'Modern, clean theme with excellent performance',
    features: ['AMP Ready', 'Fast Loading', 'Mobile First'],
    recommended: false,
    builderStack: null,
    requiredPlugins: [],
    enableSpectraBeta: false,
    wpThemeSlug: 'neve',
  },
  {
    slug: 'generatepress',
    name: 'GeneratePress',
    description: 'Minimalist, developer-friendly theme',
    features: ['Lightweight (~10KB)', 'Accessibility Ready', 'Stable'],
    recommended: false,
    builderStack: null,
    requiredPlugins: [],
    enableSpectraBeta: false,
    wpThemeSlug: 'generatepress',
  },
  {
    slug: 'blocksy',
    name: 'Blocksy',
    description: 'Block editor optimized with modern design',
    features: ['Gutenberg Ready', 'Header Builder', 'Modern Design'],
    recommended: false,
    builderStack: null,
    requiredPlugins: [],
    enableSpectraBeta: false,
    wpThemeSlug: 'blocksy',
  },
];

// Default theme for new sites
export const DEFAULT_THEME = 'spectra';

export function getTheme(slug: string): ThemeDefinition | undefined {
  return THEMES.find((t) => t.slug === slug);
}

export function getRecommendedTheme(): ThemeDefinition {
  return THEMES.find((t) => t.recommended) || THEMES[0];
}
