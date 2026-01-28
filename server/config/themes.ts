// Curated theme list - free, actively maintained, high performance
export interface ThemeDefinition {
  slug: string;
  name: string;
  description: string;
  features: string[];
  recommended: boolean;
}

export const THEMES: ThemeDefinition[] = [
  {
    slug: 'astra',
    name: 'Astra',
    description: 'Lightweight, fast, extremely customizable theme',
    features: ['PageSpeed 90+', 'Block Editor Ready', 'WooCommerce Compatible'],
    recommended: true,
  },
  {
    slug: 'oceanwp',
    name: 'OceanWP',
    description: 'Feature-rich theme, excellent for e-commerce sites',
    features: ['E-commerce Ready', 'Highly Customizable', 'SEO Optimized'],
    recommended: false,
  },
  {
    slug: 'neve',
    name: 'Neve',
    description: 'Modern, clean theme with excellent performance',
    features: ['AMP Ready', 'Fast Loading', 'Mobile First'],
    recommended: false,
  },
  {
    slug: 'generatepress',
    name: 'GeneratePress',
    description: 'Minimalist, developer-friendly theme',
    features: ['Lightweight (~10KB)', 'Accessibility Ready', 'Stable'],
    recommended: false,
  },
  {
    slug: 'blocksy',
    name: 'Blocksy',
    description: 'Block editor optimized with modern design',
    features: ['Gutenberg Ready', 'Header Builder', 'Modern Design'],
    recommended: false,
  },
];

// Default theme for Phase 1
export const DEFAULT_THEME = 'astra';

/**
 * Get theme by slug
 */
export function getTheme(slug: string): ThemeDefinition | undefined {
  return THEMES.find((t) => t.slug === slug);
}

/**
 * Get the recommended theme
 */
export function getRecommendedTheme(): ThemeDefinition {
  return THEMES.find((t) => t.recommended) || THEMES[0];
}
