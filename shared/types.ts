// Site configuration types
export interface SiteConfig {
  businessName: string;
  niche: string;           // Free-form niche text (e.g. "plumbing", "organic bakery", "dog grooming")
  address: string;
  phone: string;
  email: string;
  additionalContext?: string;
  siteType: 'standard' | 'ecommerce';
  theme?: string;
  templateId?: string; // Astra Starter Template numeric ID (e.g. "17988")
}

// Starter Template types
export interface StarterTemplate {
  id: string;
  slug: string;
  name: string;
  description: string;
  pageBuilder: 'elementor' | 'gutenberg';
  category: string[];
  isPremium: boolean;
  previewUrl?: string;
  thumbnailUrl?: string;
  pages: string[];
  isDefault?: boolean; // True if this is the recommended template for a niche
}

// Legacy niches kept for backward compatibility with existing DB records
// and for the plugins/products lookup tables
export const SUPPORTED_NICHES = {
  plumbing: {
    label: 'Plumbing',
    pages: ['Home', 'Services', 'About', 'Contact'],
    services: ['Emergency Repairs', 'Installation', 'Maintenance', 'Inspection'],
  },
  salon: {
    label: 'Hair Salon / Barber',
    pages: ['Home', 'Services', 'About', 'Contact'],
    services: ['Haircuts', 'Coloring', 'Styling', 'Treatments'],
  },
  dental: {
    label: 'Dental Practice',
    pages: ['Home', 'Services', 'About', 'Contact'],
    services: ['General Dentistry', 'Cosmetic', 'Emergency Care', 'Preventive Care'],
  },
  legal: {
    label: 'Law Firm',
    pages: ['Home', 'Practice Areas', 'About', 'Contact'],
    services: ['Consultation', 'Representation', 'Legal Advice', 'Document Preparation'],
  },
  restaurant: {
    label: 'Restaurant / Cafe',
    pages: ['Home', 'About', 'Contact'],
    services: ['Dine-in', 'Takeout', 'Catering', 'Delivery'],
  },
  fitness: {
    label: 'Fitness Studio / Gym',
    pages: ['Home', 'Classes', 'About', 'Contact'],
    services: ['Personal Training', 'Group Classes', 'Membership', 'Nutrition Coaching'],
  },
  realestate: {
    label: 'Real Estate Agency',
    pages: ['Home', 'Services', 'About', 'Contact'],
    services: ['Buying', 'Selling', 'Property Management', 'Consultation'],
  },
  accounting: {
    label: 'Accounting / Bookkeeping',
    pages: ['Home', 'Services', 'About', 'Contact'],
    services: ['Tax Preparation', 'Bookkeeping', 'Payroll', 'Business Advisory'],
  },
  automotive: {
    label: 'Auto Repair / Mechanic',
    pages: ['Home', 'Services', 'About', 'Contact'],
    services: ['Oil Change', 'Brake Service', 'Diagnostics', 'Tire Service'],
  },
  general: {
    label: 'General / Other',
    pages: ['Home', 'Services', 'About', 'Contact'],
    services: ['Service 1', 'Service 2', 'Service 3', 'Service 4'],
  },
} as const;

export type NicheId = keyof typeof SUPPORTED_NICHES;

// Job types
export type JobStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled' | 'deleted';

export interface Job {
  id: string;
  businessName: string;
  niche: string;           // Free-form niche string
  siteType: 'standard' | 'ecommerce';
  templateId?: string; // Astra Starter Template ID used
  config?: SiteConfig;
  status: JobStatus;
  currentStep: number;
  totalSteps: number;
  sitePath?: string;
  siteUrl?: string;
  dbName?: string;
  adminPassword?: string;
  aiCostUsd: number;
  aiTokensInput: number;
  aiTokensOutput: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

// Progress event for SSE
export interface ProgressEvent {
  jobId: string;
  step: number;
  totalSteps: number;
  status: 'in_progress' | 'completed' | 'failed' | 'cancelled';
  message: string;
  timestamp: string;
  aiCost?: number;
}

// Preflight check types
export interface PreflightResult {
  status: 'ready' | 'error' | 'warning';
  checks: {
    wpCliInstalled: boolean;
    wpCliVersion?: string;
    phpPath?: string;
    phpVersion?: string;
    phpMeetsRequirements: boolean;
    mysqlConnected: boolean;
    mysqlSocket: boolean;
    apacheRunning: boolean;
    anthropicKeyValid: boolean;
    webRootValid: boolean;
    webRootWritable: boolean;
  };
  errors: string[];
  warnings: string[];
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface GenerationResult {
  job: Job;
  siteUrl: string;
  adminUrl: string;
  adminUsername: string;
  adminPassword: string;
}
