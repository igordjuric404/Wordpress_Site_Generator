import type { NicheId } from '../../../shared/types.js';

/**
 * Product template for seeding WooCommerce stores
 */
export interface ProductTemplate {
  name: string;
  category: string;
  shortDescription: string;
  description: string;
  price: string;
  sku?: string;
}

/**
 * Category template for WooCommerce product categories
 */
export interface CategoryTemplate {
  name: string;
  slug: string;
  description: string;
}

/**
 * Niche-specific product configurations
 */
export interface NicheProductConfig {
  categories: CategoryTemplate[];
  products: ProductTemplate[];
}

/**
 * Placeholder product templates by niche
 * These provide sample products until AI-generated content is available
 */
export const NICHE_PRODUCTS: Record<NicheId, NicheProductConfig> = {
  plumbing: {
    categories: [
      { name: 'Plumbing Services', slug: 'plumbing-services', description: 'Professional plumbing service packages' },
      { name: 'Maintenance Plans', slug: 'maintenance-plans', description: 'Regular maintenance and inspection plans' },
    ],
    products: [
      {
        name: 'Drain Cleaning Service',
        category: 'Plumbing Services',
        shortDescription: 'Professional drain cleaning to restore proper flow and prevent clogs.',
        description: 'Our comprehensive drain cleaning service uses professional-grade equipment to clear blockages and restore optimal drainage. Includes inspection, cleaning, and preventive treatment.',
        price: '149.00',
      },
      {
        name: 'Water Heater Inspection',
        category: 'Plumbing Services',
        shortDescription: 'Complete water heater inspection and maintenance check.',
        description: 'Thorough inspection of your water heater including tank condition, heating elements, thermostat calibration, and safety valve testing. Helps prevent unexpected failures.',
        price: '89.00',
      },
      {
        name: 'Leak Detection Service',
        category: 'Plumbing Services',
        shortDescription: 'Advanced leak detection to find hidden water leaks.',
        description: 'Using state-of-the-art detection equipment, we locate hidden leaks in walls, floors, and underground pipes without destructive exploration. Includes detailed report.',
        price: '199.00',
      },
      {
        name: 'Annual Maintenance Plan',
        category: 'Maintenance Plans',
        shortDescription: 'Yearly plumbing maintenance package for peace of mind.',
        description: 'Comprehensive annual maintenance including two scheduled visits, priority emergency service, and 10% discount on all repairs. Keeps your plumbing system running smoothly.',
        price: '299.00',
      },
    ],
  },

  salon: {
    categories: [
      { name: 'Hair Services', slug: 'hair-services', description: 'Professional hair cutting and styling services' },
      { name: 'Color Services', slug: 'color-services', description: 'Hair coloring and treatment services' },
      { name: 'Packages', slug: 'packages', description: 'Service bundles and gift packages' },
    ],
    products: [
      {
        name: 'Signature Haircut',
        category: 'Hair Services',
        shortDescription: 'Expert haircut with consultation and styling.',
        description: 'Includes personalized consultation, precision haircut, shampoo, conditioning treatment, and professional styling. Our stylists tailor each cut to complement your features.',
        price: '65.00',
      },
      {
        name: 'Full Color Service',
        category: 'Color Services',
        shortDescription: 'Complete single-process color application.',
        description: 'Full head color application using premium color products. Includes consultation, application, processing, and styling. Gray coverage or fashion colors available.',
        price: '120.00',
      },
      {
        name: 'Balayage Highlights',
        category: 'Color Services',
        shortDescription: 'Hand-painted highlights for natural, sun-kissed look.',
        description: 'Artistically hand-painted highlights creating a natural, dimensional look. Includes toner, deep conditioning treatment, and blowout styling.',
        price: '180.00',
      },
      {
        name: 'Pamper Package',
        category: 'Packages',
        shortDescription: 'Complete salon experience gift package.',
        description: 'The ultimate salon experience including haircut, color touch-up or gloss treatment, deep conditioning, and professional styling. Perfect for special occasions or gifts.',
        price: '250.00',
      },
    ],
  },

  dental: {
    categories: [
      { name: 'General Dentistry', slug: 'general-dentistry', description: 'Routine dental care and treatments' },
      { name: 'Cosmetic Services', slug: 'cosmetic-services', description: 'Aesthetic dental treatments' },
    ],
    products: [
      {
        name: 'Comprehensive Exam & Cleaning',
        category: 'General Dentistry',
        shortDescription: 'Complete dental examination with professional cleaning.',
        description: 'Thorough oral examination including X-rays, gum health assessment, oral cancer screening, and professional cleaning. Foundation for your dental health plan.',
        price: '175.00',
      },
      {
        name: 'Teeth Whitening Treatment',
        category: 'Cosmetic Services',
        shortDescription: 'Professional in-office teeth whitening.',
        description: 'Advanced whitening treatment that brightens your smile by several shades in one visit. Includes custom-fitted trays for touch-up treatments at home.',
        price: '350.00',
      },
      {
        name: 'Dental Consultation',
        category: 'General Dentistry',
        shortDescription: 'Initial consultation for new patients.',
        description: 'Comprehensive initial consultation including discussion of dental history, concerns, and treatment options. The first step toward your best smile.',
        price: '75.00',
      },
      {
        name: 'Smile Makeover Consultation',
        category: 'Cosmetic Services',
        shortDescription: 'Cosmetic dentistry planning session.',
        description: 'In-depth consultation to discuss your cosmetic goals, review treatment options including veneers, bonding, and whitening, and create a personalized treatment plan.',
        price: '125.00',
      },
    ],
  },

  legal: {
    categories: [
      { name: 'Consultations', slug: 'consultations', description: 'Legal consultation services' },
      { name: 'Document Services', slug: 'document-services', description: 'Legal document preparation' },
    ],
    products: [
      {
        name: 'Initial Legal Consultation',
        category: 'Consultations',
        shortDescription: 'One-hour consultation to discuss your legal matter.',
        description: 'Comprehensive initial consultation to understand your situation, explain your legal options, and outline potential next steps. Confidential and professional.',
        price: '200.00',
      },
      {
        name: 'Contract Review',
        category: 'Document Services',
        shortDescription: 'Professional review of legal contracts and agreements.',
        description: 'Thorough review of contracts, leases, or agreements with written summary of key terms, potential issues, and recommended modifications.',
        price: '350.00',
      },
      {
        name: 'Will Preparation',
        category: 'Document Services',
        shortDescription: 'Basic will drafting and preparation.',
        description: 'Preparation of a simple will including consultation, document drafting, review meeting, and final execution. Protect your loved ones and assets.',
        price: '500.00',
      },
      {
        name: 'Business Formation Package',
        category: 'Document Services',
        shortDescription: 'LLC or corporation formation documents.',
        description: 'Complete business entity formation including articles of organization/incorporation, operating agreement or bylaws, EIN application assistance, and compliance checklist.',
        price: '750.00',
      },
    ],
  },

  restaurant: {
    categories: [
      { name: 'Gift Cards', slug: 'gift-cards', description: 'Restaurant gift cards' },
      { name: 'Catering', slug: 'catering', description: 'Catering services and packages' },
      { name: 'Merchandise', slug: 'merchandise', description: 'Branded merchandise' },
    ],
    products: [
      {
        name: '$50 Gift Card',
        category: 'Gift Cards',
        shortDescription: 'Gift card redeemable for dine-in or takeout.',
        description: 'A perfect gift for food lovers. Redeemable for dine-in, takeout, or delivery orders. Never expires.',
        price: '50.00',
      },
      {
        name: '$100 Gift Card',
        category: 'Gift Cards',
        shortDescription: 'Gift card for a special dining experience.',
        description: 'Treat someone to a memorable meal. Redeemable for all menu items, dine-in or takeout. Perfect for celebrations.',
        price: '100.00',
      },
      {
        name: 'Catering Package - Small',
        category: 'Catering',
        shortDescription: 'Catering for up to 15 guests.',
        description: 'Perfect for small gatherings. Includes selection of appetizers, main courses, sides, and beverages. Setup and serving supplies included.',
        price: '299.00',
      },
      {
        name: 'Catering Package - Large',
        category: 'Catering',
        shortDescription: 'Full catering for up to 50 guests.',
        description: 'Complete catering solution for larger events. Full menu selection, professional setup, serving staff available. Custom menus upon request.',
        price: '899.00',
      },
    ],
  },

  fitness: {
    categories: [
      { name: 'Memberships', slug: 'memberships', description: 'Gym membership plans' },
      { name: 'Personal Training', slug: 'personal-training', description: 'One-on-one training packages' },
      { name: 'Classes', slug: 'classes', description: 'Group fitness class packages' },
    ],
    products: [
      {
        name: 'Monthly Membership',
        category: 'Memberships',
        shortDescription: 'Full gym access for one month.',
        description: 'Unlimited access to all gym facilities including cardio area, weight room, locker rooms, and basic group classes. No long-term commitment required.',
        price: '49.00',
      },
      {
        name: 'Annual Membership',
        category: 'Memberships',
        shortDescription: 'Best value - full year of gym access.',
        description: 'Complete gym access for 12 months at our best rate. Includes all facilities, group classes, fitness assessment, and one personal training session.',
        price: '399.00',
      },
      {
        name: 'Personal Training - 4 Sessions',
        category: 'Personal Training',
        shortDescription: 'Four one-on-one training sessions.',
        description: 'Work with a certified personal trainer to achieve your fitness goals. Includes initial assessment, customized workout plan, and four hour-long sessions.',
        price: '240.00',
      },
      {
        name: '10-Class Pass',
        category: 'Classes',
        shortDescription: 'Ten group fitness classes of your choice.',
        description: 'Flexible class pass valid for any group fitness classes including yoga, spin, HIIT, strength training, and more. Use within 3 months of purchase.',
        price: '120.00',
      },
    ],
  },

  realestate: {
    categories: [
      { name: 'Buyer Services', slug: 'buyer-services', description: 'Services for home buyers' },
      { name: 'Seller Services', slug: 'seller-services', description: 'Services for home sellers' },
      { name: 'Consultations', slug: 'consultations', description: 'Real estate consultations' },
    ],
    products: [
      {
        name: 'Buyer Consultation',
        category: 'Buyer Services',
        shortDescription: 'One-hour consultation for prospective home buyers.',
        description: 'Comprehensive consultation covering the home buying process, mortgage pre-approval guidance, neighborhood analysis, and personalized search strategy.',
        price: '0.00',
      },
      {
        name: 'Home Valuation Report',
        category: 'Seller Services',
        shortDescription: 'Professional market analysis of your property.',
        description: 'Detailed comparative market analysis including recent sales data, current market trends, recommended listing price, and marketing strategy overview.',
        price: '0.00',
      },
      {
        name: 'Investment Property Analysis',
        category: 'Consultations',
        shortDescription: 'ROI analysis for investment properties.',
        description: 'In-depth analysis of potential investment properties including rental income projections, expense estimates, cap rate calculations, and market appreciation forecasts.',
        price: '199.00',
      },
      {
        name: 'Relocation Package',
        category: 'Buyer Services',
        shortDescription: 'Comprehensive relocation assistance.',
        description: 'Full-service relocation support including area orientation, school district information, neighborhood tours, and coordinated home search. Moving made easy.',
        price: '0.00',
      },
    ],
  },

  accounting: {
    categories: [
      { name: 'Tax Services', slug: 'tax-services', description: 'Tax preparation and planning' },
      { name: 'Bookkeeping', slug: 'bookkeeping', description: 'Bookkeeping and accounting services' },
      { name: 'Business Services', slug: 'business-services', description: 'Business advisory services' },
    ],
    products: [
      {
        name: 'Individual Tax Return',
        category: 'Tax Services',
        shortDescription: 'Personal tax return preparation.',
        description: 'Complete preparation of your individual tax return including W-2 income, standard deductions, and e-filing. Additional forms may require supplemental fees.',
        price: '175.00',
      },
      {
        name: 'Small Business Tax Return',
        category: 'Tax Services',
        shortDescription: 'Business tax return preparation.',
        description: 'Professional preparation of business tax returns for sole proprietors, LLCs, and S-Corps. Includes review of deductions and tax planning recommendations.',
        price: '450.00',
      },
      {
        name: 'Monthly Bookkeeping',
        category: 'Bookkeeping',
        shortDescription: 'Ongoing monthly bookkeeping services.',
        description: 'Complete monthly bookkeeping including transaction categorization, bank reconciliation, accounts payable/receivable, and monthly financial statements.',
        price: '299.00',
      },
      {
        name: 'Financial Consultation',
        category: 'Business Services',
        shortDescription: 'Business financial advisory session.',
        description: 'One-hour consultation to review your business finances, discuss tax strategies, and identify opportunities for improved financial performance.',
        price: '150.00',
      },
    ],
  },

  automotive: {
    categories: [
      { name: 'Maintenance Services', slug: 'maintenance-services', description: 'Regular vehicle maintenance' },
      { name: 'Repair Services', slug: 'repair-services', description: 'Vehicle repair services' },
      { name: 'Packages', slug: 'packages', description: 'Service packages and bundles' },
    ],
    products: [
      {
        name: 'Oil Change Service',
        category: 'Maintenance Services',
        shortDescription: 'Full synthetic oil change with inspection.',
        description: 'Premium synthetic oil change including oil filter replacement, fluid level check, tire pressure check, and comprehensive vehicle inspection.',
        price: '59.00',
      },
      {
        name: 'Brake Inspection & Service',
        category: 'Repair Services',
        shortDescription: 'Complete brake system inspection and service.',
        description: 'Thorough inspection of brake pads, rotors, calipers, and brake fluid. Includes pad replacement if needed (parts additional). Safety is our priority.',
        price: '89.00',
      },
      {
        name: 'Diagnostic Service',
        category: 'Repair Services',
        shortDescription: 'Computer diagnostic scan and analysis.',
        description: 'Full computer diagnostic scan to identify check engine light causes and other issues. Includes detailed report and repair recommendations.',
        price: '79.00',
      },
      {
        name: 'Complete Maintenance Package',
        category: 'Packages',
        shortDescription: 'Comprehensive vehicle maintenance bundle.',
        description: 'Everything your vehicle needs: oil change, tire rotation, brake inspection, fluid top-offs, battery test, and multi-point inspection. Best value for regular maintenance.',
        price: '149.00',
      },
    ],
  },

  general: {
    categories: [
      { name: 'Services', slug: 'services', description: 'Professional services' },
      { name: 'Products', slug: 'products', description: 'Available products' },
      { name: 'Packages', slug: 'packages', description: 'Service packages' },
    ],
    products: [
      {
        name: 'Consultation',
        category: 'Services',
        shortDescription: 'Initial consultation service.',
        description: 'Schedule a consultation to discuss your needs and how we can help. We take the time to understand your requirements and provide tailored recommendations.',
        price: '75.00',
      },
      {
        name: 'Standard Service',
        category: 'Services',
        shortDescription: 'Our core service offering.',
        description: 'Our most popular service option. Includes everything you need to get started. Professional quality with excellent customer support.',
        price: '150.00',
      },
      {
        name: 'Premium Service',
        category: 'Services',
        shortDescription: 'Enhanced service with additional features.',
        description: 'Our comprehensive service package with additional features and priority support. Best for those who want the complete experience.',
        price: '299.00',
      },
      {
        name: 'Monthly Package',
        category: 'Packages',
        shortDescription: 'Ongoing monthly service plan.',
        description: 'Subscribe to our monthly service for consistent quality and peace of mind. Includes regular service, priority scheduling, and exclusive member benefits.',
        price: '199.00',
      },
    ],
  },
};

/**
 * Get product configuration for a specific niche
 */
export function getProductsForNiche(niche: NicheId): NicheProductConfig {
  return NICHE_PRODUCTS[niche] || NICHE_PRODUCTS.general;
}
