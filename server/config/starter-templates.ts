/**
 * Astra Starter Templates Configuration
 *
 * Uses REAL numeric IDs from the Astra Starter Templates API.
 * These IDs are used with: wp astra-sites import <id> --reset --yes
 *
 * Template list fetched via: wp astra-sites list_sites --per-page=50
 * Preview URLs from websitedemos.net
 */

/**
 * Starter Template interface
 */
export interface StarterTemplate {
  id: string;           // Numeric Astra API ID (e.g. "17988")
  slug: string;
  name: string;
  description: string;
  pageBuilder: 'elementor' | 'gutenberg';
  category: string[];
  isPremium: boolean;
  previewUrl: string;
  pages: string[];
}

/**
 * All free starter templates from Astra's library.
 * IDs verified via: wp astra-sites list_sites
 */
export const CURATED_TEMPLATES: StarterTemplate[] = [
  // --- eCommerce ---
  {
    id: '17988',
    slug: 'brandstore',
    name: 'Brandstore',
    description: 'Clean, mobile-friendly eCommerce store template with WooCommerce integration.',
    pageBuilder: 'elementor',
    category: ['eCommerce', 'Business'],
    isPremium: false,
    previewUrl: 'https://websitedemos.net/brandstore-02/',
    pages: ['Home', 'Store', 'About', 'Contact'],
  },
  {
    id: '124464',
    slug: 'organic-store',
    name: 'Organic Store',
    description: 'Natural products eCommerce template with a fresh, organic look.',
    pageBuilder: 'gutenberg',
    category: ['eCommerce'],
    isPremium: false,
    previewUrl: 'https://websitedemos.net/organic-shop-09/',
    pages: ['Home', 'Shop', 'About', 'Contact'],
  },
  {
    id: '125050',
    slug: 'skin-cleanser-store',
    name: 'Skin Cleanser Store',
    description: 'Beauty product eCommerce template with modern design.',
    pageBuilder: 'gutenberg',
    category: ['eCommerce', 'Beauty'],
    isPremium: false,
    previewUrl: 'https://websitedemos.net/skin-cleanser-store-09/',
    pages: ['Home', 'Shop', 'About', 'Contact'],
  },
  {
    id: '118259',
    slug: 'plant-shop',
    name: 'Plant Shop',
    description: 'Elegant plant shop eCommerce template.',
    pageBuilder: 'gutenberg',
    category: ['eCommerce', 'Business'],
    isPremium: false,
    previewUrl: 'https://websitedemos.net/plant-shop-09/',
    pages: ['Home', 'Shop', 'About', 'Contact'],
  },
  {
    id: '126132',
    slug: 'fashion-designer',
    name: 'Fashion Designer',
    description: 'Fashion boutique eCommerce template with stylish layout.',
    pageBuilder: 'gutenberg',
    category: ['eCommerce', 'Beauty'],
    isPremium: false,
    previewUrl: 'https://websitedemos.net/fashion-designer-boutique-09/',
    pages: ['Home', 'Shop', 'About', 'Contact'],
  },
  {
    id: '125124',
    slug: 'simply-natural',
    name: 'Simply Natural',
    description: 'Natural products store with a clean, minimal design.',
    pageBuilder: 'gutenberg',
    category: ['eCommerce'],
    isPremium: false,
    previewUrl: 'https://websitedemos.net/plant-store-09/',
    pages: ['Home', 'Shop', 'About', 'Contact'],
  },
  {
    id: '124786',
    slug: 'home-garden-decor',
    name: 'Home & Garden Decor',
    description: 'Home decor and garden products eCommerce template.',
    pageBuilder: 'gutenberg',
    category: ['eCommerce'],
    isPremium: false,
    previewUrl: 'https://websitedemos.net/home-garden-decor-09/',
    pages: ['Home', 'Shop', 'About', 'Contact'],
  },
  {
    id: '161267',
    slug: 'cycles-shop',
    name: 'Cycles Shop',
    description: 'Bicycle and cycling gear eCommerce template.',
    pageBuilder: 'gutenberg',
    category: ['eCommerce'],
    isPremium: false,
    previewUrl: 'https://websitedemos.net/cycles-shop-09/',
    pages: ['Home', 'Shop', 'About', 'Contact'],
  },
  {
    id: '156866',
    slug: 'books-store',
    name: 'Books Store',
    description: 'Online bookstore template with a literary aesthetic.',
    pageBuilder: 'gutenberg',
    category: ['eCommerce'],
    isPremium: false,
    previewUrl: 'https://websitedemos.net/books-store-09/',
    pages: ['Home', 'Shop', 'About', 'Contact'],
  },
  {
    id: '156850',
    slug: 'cosmetics-store',
    name: 'Cosmetics Store',
    description: 'Beauty and cosmetics eCommerce template.',
    pageBuilder: 'gutenberg',
    category: ['eCommerce', 'Beauty'],
    isPremium: false,
    previewUrl: 'https://websitedemos.net/cosmetic-store-09/',
    pages: ['Home', 'Shop', 'About', 'Contact'],
  },
  {
    id: '48050',
    slug: 'brandstore-gutenberg',
    name: 'Brandstore (Gutenberg)',
    description: 'Brandstore template built with Gutenberg block editor.',
    pageBuilder: 'gutenberg',
    category: ['eCommerce'],
    isPremium: false,
    previewUrl: 'https://websitedemos.net/brandstore-08/',
    pages: ['Home', 'Shop', 'About', 'Contact'],
  },

  // --- Business & Agency ---
  {
    id: '123962',
    slug: 'local-business',
    name: 'Local Business',
    description: 'Versatile local business template suitable for any industry.',
    pageBuilder: 'gutenberg',
    category: ['Business'],
    isPremium: false,
    previewUrl: 'https://websitedemos.net/local-business-09/',
    pages: ['Home', 'About', 'Services', 'Contact'],
  },
  {
    id: '125105',
    slug: 'digital-agency',
    name: 'Digital Agency',
    description: 'Modern digital agency template with portfolio sections.',
    pageBuilder: 'gutenberg',
    category: ['Agency', 'Business'],
    isPremium: false,
    previewUrl: 'https://websitedemos.net/agency-09/',
    pages: ['Home', 'About', 'Services', 'Portfolio', 'Contact'],
  },
  {
    id: '124967',
    slug: 'marketing-agency',
    name: 'Marketing Agency',
    description: 'Professional marketing agency template with case studies.',
    pageBuilder: 'gutenberg',
    category: ['Agency', 'Business'],
    isPremium: false,
    previewUrl: 'https://websitedemos.net/marketing-agency-09/',
    pages: ['Home', 'About', 'Services', 'Contact'],
  },
  {
    id: '125566',
    slug: 'web-design-agency',
    name: 'Web Design Agency',
    description: 'Creative web design agency template.',
    pageBuilder: 'gutenberg',
    category: ['Agency', 'Business'],
    isPremium: false,
    previewUrl: 'https://websitedemos.net/web-design-agency-09/',
    pages: ['Home', 'About', 'Services', 'Portfolio', 'Contact'],
  },
  {
    id: '125077',
    slug: 'business-coaching',
    name: 'Business Coaching & Consulting',
    description: 'Professional coaching and consulting business template.',
    pageBuilder: 'gutenberg',
    category: ['Business'],
    isPremium: false,
    previewUrl: 'https://websitedemos.net/business-consulting-09/',
    pages: ['Home', 'About', 'Services', 'Contact'],
  },
  {
    id: '125597',
    slug: 'generic',
    name: 'Generic Business',
    description: 'Clean, generic business template that fits any niche.',
    pageBuilder: 'gutenberg',
    category: ['Business'],
    isPremium: false,
    previewUrl: 'https://websitedemos.net/generic-09/',
    pages: ['Home', 'About', 'Services', 'Contact'],
  },
  {
    id: '150693',
    slug: 'sierra-industry',
    name: 'Sierra Industry',
    description: 'Industrial and manufacturing business template.',
    pageBuilder: 'gutenberg',
    category: ['Business'],
    isPremium: false,
    previewUrl: 'https://websitedemos.net/sierra-industry-09/',
    pages: ['Home', 'About', 'Services', 'Contact'],
  },

  // --- Service / Trade ---
  {
    id: '48208',
    slug: 'plumber',
    name: 'Plumber',
    description: 'Professional plumbing business template with service pages.',
    pageBuilder: 'gutenberg',
    category: ['Service', 'Business'],
    isPremium: false,
    previewUrl: 'https://websitedemos.net/plumber-08/',
    pages: ['Home', 'About', 'Services', 'Contact'],
  },
  {
    id: '126155',
    slug: 'construction-company',
    name: 'Construction Company',
    description: 'Construction and building company template with project showcase.',
    pageBuilder: 'gutenberg',
    category: ['Service', 'Business'],
    isPremium: false,
    previewUrl: 'https://websitedemos.net/construction-company-09/',
    pages: ['Home', 'About', 'Services', 'Projects', 'Contact'],
  },
  {
    id: '133172',
    slug: 'roofing-agency',
    name: 'Roofing Agency',
    description: 'Roofing and exterior services business template.',
    pageBuilder: 'gutenberg',
    category: ['Service', 'Business'],
    isPremium: false,
    previewUrl: 'https://websitedemos.net/roofing-agency-09/',
    pages: ['Home', 'About', 'Services', 'Contact'],
  },
  {
    id: '126078',
    slug: 'electrician',
    name: 'Electrician',
    description: 'Electrician and electrical services business template.',
    pageBuilder: 'gutenberg',
    category: ['Service', 'Business'],
    isPremium: false,
    previewUrl: 'https://websitedemos.net/electrician-09/',
    pages: ['Home', 'About', 'Services', 'Contact'],
  },
  {
    id: '133206',
    slug: 'locksmith',
    name: 'Locksmith',
    description: 'Locksmith and security services business template.',
    pageBuilder: 'gutenberg',
    category: ['Service', 'Business'],
    isPremium: false,
    previewUrl: 'https://websitedemos.net/locksmith-09/',
    pages: ['Home', 'About', 'Services', 'Contact'],
  },
  {
    id: '128448',
    slug: 'custom-printing',
    name: 'Custom Printing',
    description: 'Custom printing and design services template.',
    pageBuilder: 'gutenberg',
    category: ['Service', 'Business'],
    isPremium: false,
    previewUrl: 'https://websitedemos.net/custom-printing-09/',
    pages: ['Home', 'About', 'Services', 'Contact'],
  },

  // --- Medical & Dental ---
  {
    id: '126165',
    slug: 'dental-clinic',
    name: 'Dental Clinic',
    description: 'Professional dental practice template with appointment booking.',
    pageBuilder: 'gutenberg',
    category: ['Medical', 'Service'],
    isPremium: false,
    previewUrl: 'https://websitedemos.net/dental-09/',
    pages: ['Home', 'About', 'Services', 'Contact'],
  },
  {
    id: '142894',
    slug: 'online-health-coach',
    name: 'Online Health Coach',
    description: 'Health coaching and wellness consulting template.',
    pageBuilder: 'gutenberg',
    category: ['Medical', 'Fitness & Wellness'],
    isPremium: false,
    previewUrl: 'https://websitedemos.net/online-health-coach-09/',
    pages: ['Home', 'About', 'Services', 'Contact'],
  },

  // --- Legal ---
  {
    id: '125736',
    slug: 'injury-lawyer',
    name: 'Injury & Accident Lawyer',
    description: 'Personal injury and accident lawyer template.',
    pageBuilder: 'gutenberg',
    category: ['Legal', 'Business'],
    isPremium: false,
    previewUrl: 'https://websitedemos.net/injury-accident-lawyer-09/',
    pages: ['Home', 'About', 'Practice Areas', 'Contact'],
  },
  {
    id: '142829',
    slug: 'family-lawyer',
    name: 'Family Lawyer',
    description: 'Family law practice template with consultation booking.',
    pageBuilder: 'gutenberg',
    category: ['Legal', 'Business'],
    isPremium: false,
    previewUrl: 'https://websitedemos.net/family-lawyer-09/',
    pages: ['Home', 'About', 'Practice Areas', 'Contact'],
  },

  // --- Restaurant & Food ---
  {
    id: '126179',
    slug: 'deli-restaurant',
    name: 'Deli Restaurant',
    description: 'Restaurant and deli template with menu display.',
    pageBuilder: 'gutenberg',
    category: ['Food & Restaurant'],
    isPremium: false,
    previewUrl: 'https://websitedemos.net/deli-restaurant-09/',
    pages: ['Home', 'About', 'Menu', 'Contact'],
  },

  // --- Automotive ---
  {
    id: '149299',
    slug: 'car-repair',
    name: 'Car Repair',
    description: 'Auto repair shop template with services and appointment booking.',
    pageBuilder: 'gutenberg',
    category: ['Automotive', 'Service'],
    isPremium: false,
    previewUrl: 'https://websitedemos.net/car-repair-09/',
    pages: ['Home', 'About', 'Services', 'Contact'],
  },

  // --- Accounting & Finance ---
  {
    id: '156826',
    slug: 'chartered-accountant',
    name: 'Chartered Accountant',
    description: 'Accounting and finance professional services template.',
    pageBuilder: 'gutenberg',
    category: ['Business', 'Service'],
    isPremium: false,
    previewUrl: 'https://websitedemos.net/accountant-09/',
    pages: ['Home', 'About', 'Services', 'Contact'],
  },

  // --- Education & Childcare ---
  {
    id: '125619',
    slug: 'day-care-services',
    name: 'Day Care Services',
    description: 'Childcare and day care center template.',
    pageBuilder: 'gutenberg',
    category: ['Education'],
    isPremium: false,
    previewUrl: 'https://websitedemos.net/daycare-09/',
    pages: ['Home', 'About', 'Services', 'Contact'],
  },

  // --- Portfolio & Creative ---
  {
    id: '125004',
    slug: 'personal-portfolio',
    name: 'Personal Portfolio',
    description: 'Personal portfolio template for freelancers and creatives.',
    pageBuilder: 'gutenberg',
    category: ['Portfolio'],
    isPremium: false,
    previewUrl: 'https://websitedemos.net/personal-portfolio-09/',
    pages: ['Home', 'About', 'Portfolio', 'Contact'],
  },
  {
    id: '134103',
    slug: 'freelance-copywriter',
    name: 'Freelance Copywriter',
    description: 'Freelance writer and copywriter portfolio template.',
    pageBuilder: 'gutenberg',
    category: ['Portfolio', 'Business'],
    isPremium: false,
    previewUrl: 'https://websitedemos.net/freelance-copywriter-09/',
    pages: ['Home', 'About', 'Services', 'Portfolio', 'Contact'],
  },
  {
    id: '123953',
    slug: 'creative-cv',
    name: 'Creative CV',
    description: 'Creative resume and CV template for job seekers.',
    pageBuilder: 'gutenberg',
    category: ['Portfolio'],
    isPremium: false,
    previewUrl: 'https://websitedemos.net/creative-cv-09/',
    pages: ['Home', 'About', 'Resume', 'Contact'],
  },

  // --- Blog ---
  {
    id: '125675',
    slug: 'creative-blog',
    name: 'Creative Blog',
    description: 'Beautiful blog template for writers and content creators.',
    pageBuilder: 'gutenberg',
    category: ['Blog'],
    isPremium: false,
    previewUrl: 'https://websitedemos.net/creative-blog-09/',
    pages: ['Home', 'About', 'Blog', 'Contact'],
  },

  // --- Nature & Lifestyle ---
  {
    id: '125526',
    slug: 'love-nature',
    name: 'Love Nature',
    description: 'Nature and environment focused template with beautiful imagery.',
    pageBuilder: 'gutenberg',
    category: ['Blog', 'Business'],
    isPremium: false,
    previewUrl: 'https://websitedemos.net/love-nature-09/',
    pages: ['Home', 'About', 'Blog', 'Contact'],
  },
  {
    id: '125135',
    slug: 'planet-earth',
    name: 'Planet Earth',
    description: 'Environmental and sustainability focused template.',
    pageBuilder: 'gutenberg',
    category: ['Blog', 'Business'],
    isPremium: false,
    previewUrl: 'https://websitedemos.net/earth-09/',
    pages: ['Home', 'About', 'Blog', 'Contact'],
  },
  {
    id: '127694',
    slug: 'mountain',
    name: 'Mountain',
    description: 'Outdoor adventure and mountain lifestyle template.',
    pageBuilder: 'gutenberg',
    category: ['Blog'],
    isPremium: false,
    previewUrl: 'https://websitedemos.net/mountain-09/',
    pages: ['Home', 'About', 'Blog', 'Contact'],
  },

  // --- Other ---
  {
    id: '134997',
    slug: 'galatic',
    name: 'Galatic',
    description: 'Space-themed creative template with bold design.',
    pageBuilder: 'gutenberg',
    category: ['Business'],
    isPremium: false,
    previewUrl: 'https://websitedemos.net/galatic-09/',
    pages: ['Home', 'About', 'Services', 'Contact'],
  },
  {
    id: '147926',
    slug: 'vlogger',
    name: 'Vlogger',
    description: 'Video blogger and content creator template.',
    pageBuilder: 'gutenberg',
    category: ['Blog', 'Portfolio'],
    isPremium: false,
    previewUrl: 'https://websitedemos.net/vlogger-09/',
    pages: ['Home', 'About', 'Videos', 'Contact'],
  },
  {
    id: '125593',
    slug: 'webinar',
    name: 'Webinar',
    description: 'Online webinar and course hosting template.',
    pageBuilder: 'gutenberg',
    category: ['Education', 'Business'],
    isPremium: false,
    previewUrl: 'https://websitedemos.net/webinar-09/',
    pages: ['Home', 'About', 'Events', 'Contact'],
  },
];

// Default template when user doesn't select one
export const DEFAULT_TEMPLATE_ID = '123962'; // Local Business

/**
 * Get a template by its numeric ID
 */
export function getTemplateById(templateId: string): StarterTemplate | undefined {
  return CURATED_TEMPLATES.find((t) => t.id === templateId);
}

/**
 * Get all available (non-premium) templates
 */
export function getAllTemplates(): StarterTemplate[] {
  return CURATED_TEMPLATES.filter((t) => !t.isPremium);
}

/**
 * Get the default template ID (used when user doesn't pick one)
 */
export function getDefaultTemplateForNiche(_niche: string): string {
  return DEFAULT_TEMPLATE_ID;
}
