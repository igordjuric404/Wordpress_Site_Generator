/**
 * Astra Starter Templates Configuration
 *
 * Templates are classified by their **builder stack** — the combination of
 * theme + page-builder plugin that the template was designed for:
 *
 *   - "spectra"  → Astra theme + Spectra plugin (modern, -09/-10 URL suffix)
 *   - "classic"  → Astra theme only, basic Gutenberg blocks (-07/-08 suffix)
 *
 * The compatibility signal is derived from the real API data:
 *   wp astra-sites list_sites --per-page=100
 * The URL suffix on websitedemos.net is the reliable discriminator.
 *
 * IDs are used with: wp astra-sites import <id> --reset --yes
 */

/**
 * Builder stack — determines which plugins must be installed.
 *
 *   spectra  → Astra theme + spectra-one (Spectra) plugin
 *   classic  → Astra theme + no extra builder plugin
 */
export type BuilderStack = 'spectra' | 'classic';

/**
 * Starter Template interface
 */
export interface StarterTemplate {
  id: string;            // Numeric Astra API ID
  slug: string;
  name: string;
  description: string;
  builderStack: BuilderStack;
  category: string[];
  isPremium: boolean;
  previewUrl: string;
  pages: string[];
}

// ---------------------------------------------------------------------------
// Spectra templates  (Astra theme + Spectra blocks, -09 / -10 URL suffix)
// All IDs from:  wp astra-sites list_sites --per-page=100
// ---------------------------------------------------------------------------

const SPECTRA_TEMPLATES: StarterTemplate[] = [
  // --- eCommerce ---
  { id: '124464', slug: 'organic-store', name: 'Organic Store', description: 'Natural products eCommerce template with a fresh, organic look.', builderStack: 'spectra', category: ['eCommerce'], isPremium: false, previewUrl: 'https://websitedemos.net/organic-shop-09/', pages: ['Home', 'Shop', 'About', 'Contact'] },
  { id: '125050', slug: 'skin-cleanser-store', name: 'Skin Cleanser Store', description: 'Beauty product eCommerce template with modern design.', builderStack: 'spectra', category: ['eCommerce', 'Beauty'], isPremium: false, previewUrl: 'https://websitedemos.net/skin-cleanser-store-09/', pages: ['Home', 'Shop', 'About', 'Contact'] },
  { id: '118259', slug: 'plant-shop', name: 'Plant Shop', description: 'Elegant plant shop eCommerce template.', builderStack: 'spectra', category: ['eCommerce', 'Business'], isPremium: false, previewUrl: 'https://websitedemos.net/plant-shop-09/', pages: ['Home', 'Shop', 'About', 'Contact'] },
  { id: '126132', slug: 'fashion-designer', name: 'Fashion Designer', description: 'Fashion boutique eCommerce template with stylish layout.', builderStack: 'spectra', category: ['eCommerce', 'Beauty'], isPremium: false, previewUrl: 'https://websitedemos.net/fashion-designer-boutique-09/', pages: ['Home', 'Shop', 'About', 'Contact'] },
  { id: '125124', slug: 'simply-natural', name: 'Simply Natural', description: 'Natural products store with a clean, minimal design.', builderStack: 'spectra', category: ['eCommerce'], isPremium: false, previewUrl: 'https://websitedemos.net/plant-store-09/', pages: ['Home', 'Shop', 'About', 'Contact'] },
  { id: '124786', slug: 'home-garden-decor', name: 'Home & Garden Decor', description: 'Home decor and garden products eCommerce template.', builderStack: 'spectra', category: ['eCommerce'], isPremium: false, previewUrl: 'https://websitedemos.net/home-garden-decor-09/', pages: ['Home', 'Shop', 'About', 'Contact'] },
  { id: '161267', slug: 'cycles-shop', name: 'Cycles Shop', description: 'Bicycle and cycling gear eCommerce template.', builderStack: 'spectra', category: ['eCommerce'], isPremium: false, previewUrl: 'https://websitedemos.net/cycles-shop-09/', pages: ['Home', 'Shop', 'About', 'Contact'] },
  { id: '156866', slug: 'books-store', name: 'Books Store', description: 'Online bookstore template with a literary aesthetic.', builderStack: 'spectra', category: ['eCommerce'], isPremium: false, previewUrl: 'https://websitedemos.net/books-store-09/', pages: ['Home', 'Shop', 'About', 'Contact'] },
  { id: '156850', slug: 'cosmetics-store-sc', name: 'Cosmetics Store', description: 'Beauty and cosmetics eCommerce template.', builderStack: 'spectra', category: ['eCommerce', 'Beauty'], isPremium: false, previewUrl: 'https://websitedemos.net/cosmetic-store-09/', pages: ['Home', 'Shop', 'About', 'Contact'] },
  { id: '151694', slug: 'jewellery', name: 'Jewellery', description: 'Elegant jewellery store eCommerce template.', builderStack: 'spectra', category: ['eCommerce'], isPremium: true, previewUrl: 'https://websitedemos.net/jewellery-10/', pages: ['Home', 'Shop', 'About', 'Contact'] },
  { id: '142846', slug: 'ayurvedic-products', name: 'Ayurvedic Products', description: 'Natural and ayurvedic products store template.', builderStack: 'spectra', category: ['eCommerce'], isPremium: false, previewUrl: 'https://websitedemos.net/ayurveda-09/', pages: ['Home', 'Shop', 'About', 'Contact'] },
  { id: '132846', slug: 'cosmetics-store', name: 'Cosmetics Store (Alt)', description: 'Another cosmetics store variation.', builderStack: 'spectra', category: ['eCommerce'], isPremium: false, previewUrl: 'https://websitedemos.net/cosmetics-store-09/', pages: ['Home', 'Shop', 'About', 'Contact'] },

  // --- Business & Agency ---
  { id: '123962', slug: 'local-business', name: 'Local Business', description: 'Versatile local business template suitable for any industry.', builderStack: 'spectra', category: ['Business'], isPremium: false, previewUrl: 'https://websitedemos.net/local-business-09/', pages: ['Home', 'About', 'Services', 'Contact'] },
  { id: '125105', slug: 'digital-agency', name: 'Digital Agency', description: 'Modern digital agency template with portfolio sections.', builderStack: 'spectra', category: ['Agency', 'Business'], isPremium: false, previewUrl: 'https://websitedemos.net/agency-09/', pages: ['Home', 'About', 'Services', 'Portfolio', 'Contact'] },
  { id: '124967', slug: 'marketing-agency', name: 'Marketing Agency', description: 'Professional marketing agency template with case studies.', builderStack: 'spectra', category: ['Agency', 'Business'], isPremium: false, previewUrl: 'https://websitedemos.net/marketing-agency-09/', pages: ['Home', 'About', 'Services', 'Contact'] },
  { id: '125566', slug: 'web-design-agency', name: 'Web Design Agency', description: 'Creative web design agency template.', builderStack: 'spectra', category: ['Agency', 'Business'], isPremium: false, previewUrl: 'https://websitedemos.net/web-design-agency-09/', pages: ['Home', 'About', 'Services', 'Portfolio', 'Contact'] },
  { id: '125077', slug: 'business-coaching', name: 'Business Coaching & Consulting', description: 'Professional coaching and consulting business template.', builderStack: 'spectra', category: ['Business'], isPremium: false, previewUrl: 'https://websitedemos.net/business-consulting-09/', pages: ['Home', 'About', 'Services', 'Contact'] },
  { id: '125597', slug: 'generic', name: 'Generic Business', description: 'Clean, generic business template that fits any niche.', builderStack: 'spectra', category: ['Business'], isPremium: false, previewUrl: 'https://websitedemos.net/generic-09/', pages: ['Home', 'About', 'Services', 'Contact'] },
  { id: '150693', slug: 'sierra-industry', name: 'Sierra Industry', description: 'Industrial and manufacturing business template.', builderStack: 'spectra', category: ['Business'], isPremium: false, previewUrl: 'https://websitedemos.net/sierra-industry-09/', pages: ['Home', 'About', 'Services', 'Contact'] },
  { id: '130458', slug: 'coach', name: 'Coach', description: 'Life and business coaching template.', builderStack: 'spectra', category: ['Business'], isPremium: false, previewUrl: 'https://websitedemos.net/coach-09/', pages: ['Home', 'About', 'Services', 'Contact'] },

  // --- Service / Trade ---
  { id: '126155', slug: 'construction-company', name: 'Construction Company', description: 'Construction and building company template with project showcase.', builderStack: 'spectra', category: ['Service', 'Business'], isPremium: false, previewUrl: 'https://websitedemos.net/construction-company-09/', pages: ['Home', 'About', 'Services', 'Projects', 'Contact'] },
  { id: '133172', slug: 'roofing-agency', name: 'Roofing Agency', description: 'Roofing and exterior services business template.', builderStack: 'spectra', category: ['Service', 'Business'], isPremium: false, previewUrl: 'https://websitedemos.net/roofing-agency-09/', pages: ['Home', 'About', 'Services', 'Contact'] },
  { id: '126078', slug: 'electrician', name: 'Electrician', description: 'Electrician and electrical services business template.', builderStack: 'spectra', category: ['Service', 'Business'], isPremium: false, previewUrl: 'https://websitedemos.net/electrician-09/', pages: ['Home', 'About', 'Services', 'Contact'] },
  { id: '133206', slug: 'locksmith', name: 'Locksmith', description: 'Locksmith and security services business template.', builderStack: 'spectra', category: ['Service', 'Business'], isPremium: false, previewUrl: 'https://websitedemos.net/locksmith-09/', pages: ['Home', 'About', 'Services', 'Contact'] },
  { id: '128448', slug: 'custom-printing', name: 'Custom Printing', description: 'Custom printing and design services template.', builderStack: 'spectra', category: ['Service', 'Business'], isPremium: false, previewUrl: 'https://websitedemos.net/custom-printing-09/', pages: ['Home', 'About', 'Services', 'Contact'] },
  { id: '142973', slug: 'heating-ac-technician', name: 'Heating & AC Technician', description: 'HVAC and heating services template.', builderStack: 'spectra', category: ['Service'], isPremium: false, previewUrl: 'https://websitedemos.net/heating-and-ac-technician-09/', pages: ['Home', 'About', 'Services', 'Contact'] },
  { id: '142950', slug: 'ac-technician', name: 'AC Technician', description: 'Air conditioning services template.', builderStack: 'spectra', category: ['Service'], isPremium: false, previewUrl: 'https://websitedemos.net/ac-technician-09/', pages: ['Home', 'About', 'Services', 'Contact'] },
  { id: '138775', slug: 'gardening-landscaping', name: 'Gardening & Landscaping', description: 'Landscaping and garden services template.', builderStack: 'spectra', category: ['Service'], isPremium: false, previewUrl: 'https://websitedemos.net/gardener-09/', pages: ['Home', 'About', 'Services', 'Contact'] },
  { id: '142579', slug: 'interior-design-firm', name: 'Interior Design Firm', description: 'Interior design and decor services template.', builderStack: 'spectra', category: ['Service', 'Business'], isPremium: false, previewUrl: 'https://websitedemos.net/interior-firm-09/', pages: ['Home', 'About', 'Services', 'Contact'] },

  // --- Medical & Wellness ---
  { id: '126165', slug: 'dental-clinic', name: 'Dental Clinic', description: 'Professional dental practice template.', builderStack: 'spectra', category: ['Medical', 'Service'], isPremium: false, previewUrl: 'https://websitedemos.net/dental-09/', pages: ['Home', 'About', 'Services', 'Contact'] },
  { id: '142894', slug: 'online-health-coach', name: 'Online Health Coach', description: 'Health coaching and wellness consulting template.', builderStack: 'spectra', category: ['Medical', 'Wellness'], isPremium: false, previewUrl: 'https://websitedemos.net/online-health-coach-09/', pages: ['Home', 'About', 'Services', 'Contact'] },
  { id: '131916', slug: 'diagnostic-lab', name: 'Diagnostic Lab', description: 'Medical diagnostic laboratory template.', builderStack: 'spectra', category: ['Medical'], isPremium: false, previewUrl: 'https://websitedemos.net/diagnostics-lab-09/', pages: ['Home', 'About', 'Services', 'Contact'] },
  { id: '131928', slug: 'lotus-spa', name: 'Lotus Spa', description: 'Spa and wellness center template.', builderStack: 'spectra', category: ['Beauty', 'Wellness'], isPremium: false, previewUrl: 'https://websitedemos.net/lotus-spa-09/', pages: ['Home', 'About', 'Services', 'Contact'] },
  { id: '135329', slug: 'salon-spa', name: 'Salon & Spa', description: 'Beauty salon and spa services template.', builderStack: 'spectra', category: ['Beauty'], isPremium: false, previewUrl: 'https://websitedemos.net/stylist-09/', pages: ['Home', 'About', 'Services', 'Contact'] },

  // --- Legal ---
  { id: '125736', slug: 'injury-lawyer', name: 'Injury & Accident Lawyer', description: 'Personal injury and accident lawyer template.', builderStack: 'spectra', category: ['Legal', 'Business'], isPremium: false, previewUrl: 'https://websitedemos.net/injury-accident-lawyer-09/', pages: ['Home', 'About', 'Practice Areas', 'Contact'] },
  { id: '142829', slug: 'family-lawyer', name: 'Family Lawyer', description: 'Family law practice template.', builderStack: 'spectra', category: ['Legal', 'Business'], isPremium: false, previewUrl: 'https://websitedemos.net/family-lawyer-09/', pages: ['Home', 'About', 'Practice Areas', 'Contact'] },

  // --- Restaurant & Food ---
  { id: '126179', slug: 'deli-restaurant', name: 'Deli Restaurant', description: 'Restaurant and deli template with menu display.', builderStack: 'spectra', category: ['Food & Restaurant'], isPremium: false, previewUrl: 'https://websitedemos.net/deli-restaurant-09/', pages: ['Home', 'About', 'Menu', 'Contact'] },
  { id: '143019', slug: 'italian-restaurant', name: 'Italian Restaurant', description: 'Italian restaurant and pizzeria template.', builderStack: 'spectra', category: ['Food & Restaurant'], isPremium: false, previewUrl: 'https://websitedemos.net/italian-restaurant-09/', pages: ['Home', 'About', 'Menu', 'Contact'] },

  // --- Automotive ---
  { id: '149299', slug: 'car-repair', name: 'Car Repair', description: 'Auto repair shop template.', builderStack: 'spectra', category: ['Automotive', 'Service'], isPremium: false, previewUrl: 'https://websitedemos.net/car-repair-09/', pages: ['Home', 'About', 'Services', 'Contact'] },

  // --- Accounting ---
  { id: '156826', slug: 'chartered-accountant', name: 'Chartered Accountant', description: 'Accounting and finance professional services template.', builderStack: 'spectra', category: ['Business', 'Service'], isPremium: false, previewUrl: 'https://websitedemos.net/accountant-09/', pages: ['Home', 'About', 'Services', 'Contact'] },

  // --- Education ---
  { id: '125619', slug: 'day-care-services', name: 'Day Care Services', description: 'Childcare and day care center template.', builderStack: 'spectra', category: ['Education'], isPremium: false, previewUrl: 'https://websitedemos.net/daycare-09/', pages: ['Home', 'About', 'Services', 'Contact'] },
  { id: '131920', slug: 'piano-tutor', name: 'Piano Tutor', description: 'Music lessons and piano tutoring template.', builderStack: 'spectra', category: ['Education'], isPremium: false, previewUrl: 'https://websitedemos.net/piano-tutor-09/', pages: ['Home', 'About', 'Services', 'Contact'] },

  // --- Hospitality ---
  { id: '142858', slug: 'hotel-bnb', name: 'Hotel & BnB', description: 'Hotel and bed-and-breakfast template.', builderStack: 'spectra', category: ['Hospitality'], isPremium: false, previewUrl: 'https://websitedemos.net/hotel-09/', pages: ['Home', 'About', 'Rooms', 'Contact'] },

  // --- Events ---
  { id: '125593', slug: 'webinar', name: 'Webinar', description: 'Online webinar and course hosting template.', builderStack: 'spectra', category: ['Education', 'Business'], isPremium: false, previewUrl: 'https://websitedemos.net/webinar-09/', pages: ['Home', 'About', 'Events', 'Contact'] },
  { id: '122965', slug: 'event-landing-page', name: 'Event Landing Page', description: 'Event and conference landing page template.', builderStack: 'spectra', category: ['Business'], isPremium: false, previewUrl: 'https://websitedemos.net/event-09/', pages: ['Home', 'About', 'Contact'] },
  { id: '122929', slug: 'conference-event', name: 'Conference Event', description: 'Conference and event management template.', builderStack: 'spectra', category: ['Business'], isPremium: false, previewUrl: 'https://websitedemos.net/conference-event-09/', pages: ['Home', 'About', 'Contact'] },

  // --- Portfolio & Creative ---
  { id: '125004', slug: 'personal-portfolio', name: 'Personal Portfolio', description: 'Personal portfolio template for freelancers and creatives.', builderStack: 'spectra', category: ['Portfolio'], isPremium: false, previewUrl: 'https://websitedemos.net/personal-portfolio-09/', pages: ['Home', 'About', 'Portfolio', 'Contact'] },
  { id: '134103', slug: 'freelance-copywriter', name: 'Freelance Copywriter', description: 'Freelance writer portfolio template.', builderStack: 'spectra', category: ['Portfolio', 'Business'], isPremium: false, previewUrl: 'https://websitedemos.net/freelance-copywriter-09/', pages: ['Home', 'About', 'Services', 'Portfolio', 'Contact'] },
  { id: '123953', slug: 'creative-cv', name: 'Creative CV', description: 'Creative resume and CV template.', builderStack: 'spectra', category: ['Portfolio'], isPremium: false, previewUrl: 'https://websitedemos.net/creative-cv-09/', pages: ['Home', 'About', 'Resume', 'Contact'] },
  { id: '144126', slug: 'portfolio-cv', name: 'Portfolio & CV', description: 'Modern portfolio and CV template.', builderStack: 'spectra', category: ['Portfolio'], isPremium: false, previewUrl: 'https://websitedemos.net/portfolio-09/', pages: ['Home', 'About', 'Portfolio', 'Contact'] },
  { id: '144110', slug: 'theatre-artist', name: 'Theatre Artist', description: 'Performing arts and theatre portfolio.', builderStack: 'spectra', category: ['Portfolio'], isPremium: false, previewUrl: 'https://websitedemos.net/theatre-artist-09/', pages: ['Home', 'About', 'Portfolio', 'Contact'] },

  // --- Blog & Nature ---
  { id: '125675', slug: 'creative-blog', name: 'Creative Blog', description: 'Beautiful blog template for writers and content creators.', builderStack: 'spectra', category: ['Blog'], isPremium: false, previewUrl: 'https://websitedemos.net/creative-blog-09/', pages: ['Home', 'About', 'Blog', 'Contact'] },
  { id: '125526', slug: 'love-nature', name: 'Love Nature', description: 'Nature and environment focused template.', builderStack: 'spectra', category: ['Blog', 'Business'], isPremium: false, previewUrl: 'https://websitedemos.net/love-nature-09/', pages: ['Home', 'About', 'Blog', 'Contact'] },
  { id: '125135', slug: 'planet-earth', name: 'Planet Earth', description: 'Environmental and sustainability focused template.', builderStack: 'spectra', category: ['Blog', 'Business'], isPremium: false, previewUrl: 'https://websitedemos.net/earth-09/', pages: ['Home', 'About', 'Blog', 'Contact'] },
  { id: '127694', slug: 'mountain', name: 'Mountain', description: 'Outdoor adventure and mountain lifestyle template.', builderStack: 'spectra', category: ['Blog'], isPremium: false, previewUrl: 'https://websitedemos.net/mountain-09/', pages: ['Home', 'About', 'Blog', 'Contact'] },
  { id: '144144', slug: 'sierra-nature', name: 'Sierra Nature', description: 'Nature and eco-tourism template.', builderStack: 'spectra', category: ['Blog', 'Business'], isPremium: false, previewUrl: 'https://websitedemos.net/sierra-nature-09/', pages: ['Home', 'About', 'Blog', 'Contact'] },

  // --- Other ---
  { id: '134997', slug: 'galatic', name: 'Galatic', description: 'Space-themed creative template with bold design.', builderStack: 'spectra', category: ['Business'], isPremium: false, previewUrl: 'https://websitedemos.net/galatic-09/', pages: ['Home', 'About', 'Services', 'Contact'] },
  { id: '147926', slug: 'vlogger', name: 'Vlogger', description: 'Video blogger and content creator template.', builderStack: 'spectra', category: ['Blog', 'Portfolio'], isPremium: false, previewUrl: 'https://websitedemos.net/vlogger-09/', pages: ['Home', 'About', 'Videos', 'Contact'] },
];

// ---------------------------------------------------------------------------
// Classic Block Editor templates  (Astra theme only, -07 / -08 URL suffix)
// These use standard Gutenberg blocks — NO Spectra dependency.
// ---------------------------------------------------------------------------

const CLASSIC_TEMPLATES: StarterTemplate[] = [
  { id: '48050', slug: 'brandstore-classic', name: 'Brandstore', description: 'Clean, mobile-friendly eCommerce store template.', builderStack: 'classic', category: ['eCommerce'], isPremium: false, previewUrl: 'https://websitedemos.net/brandstore-08/', pages: ['Home', 'Store', 'About', 'Contact'] },
  { id: '59760', slug: 'love-nature-classic', name: 'Love Nature', description: 'Nature-themed multipurpose template.', builderStack: 'classic', category: ['Blog', 'Business'], isPremium: false, previewUrl: 'https://websitedemos.net/love-nature-08/', pages: ['Home', 'About', 'Blog', 'Contact'] },
  { id: '94611', slug: 'agency-classic', name: 'Agency', description: 'Professional web agency template.', builderStack: 'classic', category: ['Agency', 'Business'], isPremium: true, previewUrl: 'https://websitedemos.net/web-agency-07/', pages: ['Home', 'About', 'Services', 'Contact'] },
  { id: '48078', slug: 'outdoor-adventure-classic', name: 'Outdoor Adventure', description: 'Multipurpose outdoor and adventure template.', builderStack: 'classic', category: ['Business'], isPremium: false, previewUrl: 'https://websitedemos.net/outdoor-adventure-08/', pages: ['Home', 'About', 'Services', 'Contact'] },
  { id: '94584', slug: 'wellness-coach-classic', name: 'Wellness Coach', description: 'Coaching and wellness platform template.', builderStack: 'classic', category: ['Business'], isPremium: false, previewUrl: 'https://websitedemos.net/wellness-coach-08/', pages: ['Home', 'About', 'Services', 'Contact'] },
  { id: '100934', slug: 'clothing-store-classic', name: 'Clothing Store', description: 'Stylish clothing eCommerce template.', builderStack: 'classic', category: ['eCommerce', 'Business'], isPremium: true, previewUrl: 'https://websitedemos.net/clothing-store-07/', pages: ['Home', 'Shop', 'About', 'Contact'] },
  { id: '48121', slug: 'organic-store-classic', name: 'Organic Store', description: 'Organic products eCommerce template.', builderStack: 'classic', category: ['eCommerce'], isPremium: false, previewUrl: 'https://websitedemos.net/organic-shop-08/', pages: ['Home', 'Shop', 'About', 'Contact'] },
  { id: '69916', slug: 'planet-earth-classic', name: 'Planet Earth', description: 'Environmental and nature focused template.', builderStack: 'classic', category: ['Blog', 'Business'], isPremium: false, previewUrl: 'https://websitedemos.net/earth-08/', pages: ['Home', 'About', 'Blog', 'Contact'] },
  { id: '59775', slug: 'digital-agency-classic', name: 'Digital Agency', description: 'Modern digital agency template.', builderStack: 'classic', category: ['Agency'], isPremium: false, previewUrl: 'https://websitedemos.net/agency-08/', pages: ['Home', 'About', 'Services', 'Contact'] },
  { id: '95492', slug: 'clothing-store-alt', name: 'Clothing Store (Alt)', description: 'Alternative clothing store template.', builderStack: 'classic', category: ['eCommerce', 'Business'], isPremium: false, previewUrl: 'https://websitedemos.net/clothing-store-08/', pages: ['Home', 'Shop', 'About', 'Contact'] },
  { id: '117124', slug: 'professional-consultant', name: 'Professional Consultant', description: 'Professional consulting services template.', builderStack: 'classic', category: ['Business'], isPremium: true, previewUrl: 'https://websitedemos.net/professional-consultant-07/', pages: ['Home', 'About', 'Services', 'Contact'] },
  { id: '59219', slug: 'personal-portfolio-classic', name: 'Personal Portfolio', description: 'Personal portfolio for freelancers.', builderStack: 'classic', category: ['Portfolio'], isPremium: false, previewUrl: 'https://websitedemos.net/personal-portfolio-08/', pages: ['Home', 'About', 'Portfolio', 'Contact'] },
  { id: '48348', slug: 'mountain-classic', name: 'Mountain', description: 'Outdoor lifestyle and adventure template.', builderStack: 'classic', category: ['Blog'], isPremium: false, previewUrl: 'https://websitedemos.net/mountain-08/', pages: ['Home', 'About', 'Blog', 'Contact'] },
  { id: '110799', slug: 'construction-company-classic', name: 'Construction Company', description: 'Construction company template.', builderStack: 'classic', category: ['Service', 'Business'], isPremium: true, previewUrl: 'https://websitedemos.net/brikly-construction-company-07/', pages: ['Home', 'About', 'Services', 'Contact'] },
  { id: '104295', slug: 'saas-landing-page', name: 'SaaS Landing Page', description: 'Software-as-a-Service landing page template.', builderStack: 'classic', category: ['Business'], isPremium: true, previewUrl: 'https://websitedemos.net/saas-landing-page-07/', pages: ['Home', 'About', 'Contact'] },
  { id: '71300', slug: 'dental-clinic-classic', name: 'Dental Clinic', description: 'Professional dental practice template.', builderStack: 'classic', category: ['Medical', 'Service'], isPremium: false, previewUrl: 'https://websitedemos.net/dental-08/', pages: ['Home', 'About', 'Services', 'Contact'] },
  { id: '113488', slug: 'electrician-company', name: 'Electrician Company', description: 'Electrician services business template.', builderStack: 'classic', category: ['Service', 'Business'], isPremium: true, previewUrl: 'https://websitedemos.net/electrician-company-07/', pages: ['Home', 'About', 'Services', 'Contact'] },
];

// ---------------------------------------------------------------------------
// Combined & Lookup Helpers
// ---------------------------------------------------------------------------

/** All curated templates (both stacks) */
export const CURATED_TEMPLATES: StarterTemplate[] = [
  ...SPECTRA_TEMPLATES,
  ...CLASSIC_TEMPLATES,
];

/** Default template when user doesn't select one (Spectra — Local Business) */
export const DEFAULT_TEMPLATE_ID = '123962';

export function getTemplateById(templateId: string): StarterTemplate | undefined {
  return CURATED_TEMPLATES.find((t) => t.id === templateId);
}

export function getAllTemplates(): StarterTemplate[] {
  return CURATED_TEMPLATES.filter((t) => !t.isPremium);
}

export function getTemplatesByStack(stack: BuilderStack): StarterTemplate[] {
  return CURATED_TEMPLATES.filter((t) => !t.isPremium && t.builderStack === stack);
}

export function getDefaultTemplateForNiche(_niche: string): string {
  return DEFAULT_TEMPLATE_ID;
}
