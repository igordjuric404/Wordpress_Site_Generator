# Astra Starter Templates Integration - Implementation Plan

**Project**: WordPress Site Generator  
**Feature**: Full Integration of Astra Starter Templates for Elementor-based Site Generation  
**Date**: January 31, 2026  
**Version**: 1.0

---

## Executive Summary

This plan outlines the comprehensive integration of Astra Starter Templates into the WordPress Site Generator. The integration will replace the current manual page creation approach (Steps 7-10) with a professional template import system that provides pre-designed, production-ready sites with Elementor page builder support.

**Key Changes**:
- Replace manual page creation with Starter Templates import
- Add template selection UI
- Install Starter Templates plugin + Elementor automatically
- Post-import customization (business name, contact info replacement)
- **Phase 2**: Stock image API integration (Pexels/Unsplash/Pixabay)

---

## Table of Contents

1. [Current State Analysis](#1-current-state-analysis)
2. [Architecture Changes](#2-architecture-changes)
3. [Implementation Phases](#3-implementation-phases)
4. [Technical Specifications](#4-technical-specifications)
5. [Database Schema Updates](#5-database-schema-updates)
6. [API Endpoint Changes](#6-api-endpoint-changes)
7. [Frontend UI Changes](#7-frontend-ui-changes)
8. [Backend Service Changes](#8-backend-service-changes)
9. [Testing Strategy](#9-testing-strategy)
10. [Deployment Plan](#10-deployment-plan)
11. [Rollback Strategy](#11-rollback-strategy)
12. [Phase 2 Planning](#12-phase-2-planning)

---

## 1. Current State Analysis

### 1.1 Current Generation Flow (14 Steps)

```
Step 1:  Validate configuration
Step 2:  Create site directory
Step 3:  Create database
Step 4:  Download WordPress
Step 5:  Configure WordPress
Step 6:  Install WordPress
Step 7:  Create homepage (manual)          ← REPLACED
Step 8:  Create about page (manual)        ← REPLACED
Step 9:  Create services page (manual)     ← REPLACED
Step 10: Create contact page (manual)      ← REPLACED
Step 11: Install theme (Astra)
Step 12: Install plugins
Step 13: Finalize (WooCommerce setup)
Step 14: Post-generation plugins
```

### 1.2 Current Limitations

- ❌ Basic, unstyled pages with placeholder templates
- ❌ No visual page builder integration
- ❌ No professional imagery
- ❌ Manual menu creation with basic structure
- ❌ Generic layouts not optimized for niches
- ❌ No pre-designed sections/blocks

### 1.3 What Starter Templates Brings

- ✅ **300+ professional templates** from Astra library
- ✅ **Elementor integration** with visual page builder
- ✅ **Pre-designed pages** (Home, About, Services, Contact, etc.)
- ✅ **Professional imagery** from Pixabay (free stock photos)
- ✅ **Automatic plugin installation** (Elementor, forms, etc.)
- ✅ **WP-CLI support** for automation (`wp starter-templates`)
- ✅ **Niche-specific designs** (Plumber, Agency, eCommerce, etc.)
- ✅ **Production-ready menus** with proper structure

---

## 2. Architecture Changes

### 2.1 High-Level Architecture (After Integration)

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React)                         │
│  ┌──────────┐  ┌──────────────┐  ┌──────────┐               │
│  │Dashboard │  │   SiteForm   │  │Progress  │               │
│  │          │  │  + Template  │  │  View    │               │
│  │          │  │   Selector   │  │          │               │
│  └──────────┘  └──────────────┘  └──────────┘               │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│               Backend (Express/Node.js)                     │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ New: StarterTemplatesService                          │  │
│  │  - listTemplates()                                     │  │
│  │  - importTemplate(templateId)                          │  │
│  │  - customizeImportedSite(config)                       │  │
│  │  - replaceContentVariables(sitePath, vars)             │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ Modified: site-generator.service.ts                    │  │
│  │  - NEW STEP 7: Import Starter Template                 │  │
│  │  - NEW STEP 8: Customize imported content              │  │
│  │  - REMOVED: Manual page creation (old 7-10)            │  │
│  └────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┴─────────────────┐
        │                                   │
┌───────▼─────────┐              ┌──────────▼──────────┐
│   WP-CLI        │              │  Astra Starter      │
│                 │              │  Templates Plugin   │
│ wp starter-     │◄─────────────┤  (via WP-CLI)       │
│ templates       │              │                     │
│ list/import     │              │  - Elementor        │
│                 │              │  - WPForms          │
└─────────────────┘              │  - Demo Content     │
                                 └─────────────────────┘
```

### 2.2 New Data Flow

```
1. User selects template from UI → Template ID stored in config
2. POST /api/sites → Job created with templateId
3. Generation starts:
   - Steps 1-6: Same (validate, dirs, DB, WP install)
   - Step 7: NEW - Install Starter Templates plugin
   - Step 8: NEW - Import selected template via WP-CLI
   - Step 9: NEW - Post-import customization (replace vars)
   - Step 10: Install additional plugins (if needed)
   - Step 11: Finalize (WooCommerce, menus, rewrite rules)
   - Step 12: Post-generation plugins
4. SSE events → Frontend shows progress
5. Completion → Site ready with professional design
```

---

## 3. Implementation Phases

### Phase 1: Core Integration (Primary Focus)

**Timeline**: 2-3 weeks  
**Goal**: Replace manual page creation with Starter Templates

#### Phase 1.1: Backend Foundation (Week 1)

- [ ] **Task 1.1.1**: Create `starter-templates.service.ts`
  - Implement `listTemplates()` with WP-CLI wrapper
  - Implement `importTemplate(sitePath, templateId)`
  - Add template metadata caching
  - Handle errors gracefully

- [ ] **Task 1.1.2**: Create template configuration system
  - Map niches to recommended templates
  - Create `server/config/starter-templates.ts`
  - Define template metadata structure

- [ ] **Task 1.1.3**: Update `site-generator.service.ts`
  - Modify `GENERATION_STEPS` array
  - Replace steps 7-10 with new template import logic
  - Add post-import customization step
  - Update progress tracking

- [ ] **Task 1.1.4**: Update `wordpress.service.ts`
  - Add `installStarterTemplatesPlugin()`
  - Add `searchReplaceContent(sitePath, oldValue, newValue)`
  - Add `getPageIds(sitePath)` for menu management

#### Phase 1.2: Type System & Configuration (Week 1)

- [ ] **Task 1.2.1**: Update `shared/types.ts`
  - Add `templateId?: string` to `SiteConfig`
  - Add `StarterTemplate` interface
  - Add `TemplateCategory` enum

- [ ] **Task 1.2.2**: Update database schema
  - Add `template_id` column to `jobs` table
  - Migration script for existing jobs

- [ ] **Task 1.2.3**: Create niche-to-template mapping
  - Research best free templates for each niche
  - Document template IDs from WP-CLI
  - Create recommendation logic

#### Phase 1.3: Frontend Integration (Week 2)

- [ ] **Task 1.3.1**: Add template selection to SiteForm
  - Create `TemplateSelector` component
  - Add template preview cards
  - Integrate with form state
  - Add template filtering by niche

- [ ] **Task 1.3.2**: Update API client
  - Add `getTemplates()` endpoint call
  - Add `getTemplatesByNiche(nicheId)` endpoint call
  - Update `createSite()` to include templateId

- [ ] **Task 1.3.3**: Update ProgressView
  - Update step labels for new flow
  - Add template import progress details

#### Phase 1.4: API Layer (Week 2)

- [ ] **Task 1.4.1**: Add new routes to `server/routes/sites.ts`
  - `GET /api/templates` - List all templates
  - `GET /api/templates/:nicheId` - Templates for niche
  - `GET /api/templates/:id` - Single template details

- [ ] **Task 1.4.2**: Update existing endpoints
  - Modify `POST /api/sites` validation to include templateId
  - Update Zod schema

#### Phase 1.5: Testing & Refinement (Week 3)

- [ ] **Task 1.5.1**: Integration testing
  - Test template import for all niches
  - Verify content customization works
  - Test WooCommerce templates
  - Verify menu creation

- [ ] **Task 1.5.2**: Error handling
  - Handle template import failures gracefully
  - Add retry logic for network errors
  - Implement fallback to manual creation if needed

- [ ] **Task 1.5.3**: Documentation
  - Update README with new flow
  - Document template selection process
  - Add troubleshooting guide

### Phase 2: Stock Image Integration (Future)

**Timeline**: 1-2 weeks  
**Goal**: Dynamic image replacement using stock APIs

**Scope**:
- Integrate Pexels/Unsplash/Pixabay APIs
- Automatic image search by niche keywords
- Download and import to WordPress media library
- Replace template placeholder images
- See [Section 12](#12-phase-2-planning) for details

---

## 4. Technical Specifications

### 4.1 Starter Templates Service

**File**: `server/services/starter-templates.service.ts`

```typescript
import { execa } from 'execa';
import { createServiceLogger } from '../utils/logger.js';

const logger = createServiceLogger('starter-templates');

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
}

/**
 * List all available Starter Templates
 * Uses: wp starter-templates list --format=json
 */
export async function listTemplates(): Promise<StarterTemplate[]> {
  // Implementation
}

/**
 * Get templates for specific niche
 */
export async function getTemplatesForNiche(nicheId: string): Promise<StarterTemplate[]> {
  // Implementation with filtering
}

/**
 * Import a Starter Template by ID
 * Uses: wp starter-templates import <ID> --yes
 */
export async function importTemplate(
  sitePath: string,
  templateId: string
): Promise<void> {
  // Implementation
}

/**
 * Customize imported site content
 * - Replace placeholder business name
 * - Update contact info (phone, email, address)
 * - Update site title/tagline
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
  // Implementation using wp search-replace
}
```

### 4.2 Template Configuration

**File**: `server/config/starter-templates.ts`

```typescript
import type { NicheId } from '@shared/types';

/**
 * Maps niches to recommended Starter Template IDs
 * 
 * Template IDs found via: wp starter-templates list --format=json
 * 
 * Priority: Elementor templates for visual editing
 * Free templates only (no premium requirement)
 */
export const NICHE_TEMPLATE_MAP: Record<NicheId, string[]> = {
  plumbing: [
    'plumber-elementor',      // Primary: "Plumber" template
    'handyman-elementor',     // Fallback 1
    'construction-elementor'  // Fallback 2
  ],
  salon: [
    'beauty-salon-elementor',
    'spa-elementor',
    'wellness-elementor'
  ],
  dental: [
    'dentist-elementor',
    'medical-clinic-elementor',
    'healthcare-elementor'
  ],
  legal: [
    'law-firm-elementor',
    'attorney-elementor',
    'legal-advisor-elementor'
  ],
  restaurant: [
    'restaurant-elementor',
    'cafe-elementor',
    'food-business-elementor'
  ],
  fitness: [
    'fitness-elementor',
    'gym-elementor',
    'wellness-coach-elementor'
  ],
  realestate: [
    'real-estate-elementor',
    'property-listing-elementor',
    'realtor-elementor'
  ],
  accounting: [
    'accounting-elementor',
    'finance-consultant-elementor',
    'business-consultant-elementor'
  ],
  automotive: [
    'auto-repair-elementor',
    'car-dealer-elementor',
    'mechanic-elementor'
  ],
  general: [
    'business-elementor',          // Generic business template
    'corporate-elementor',
    'agency-elementor'
  ]
};

/**
 * Get recommended template ID for a niche
 */
export function getDefaultTemplateForNiche(nicheId: NicheId): string {
  return NICHE_TEMPLATE_MAP[nicheId]?.[0] || NICHE_TEMPLATE_MAP.general[0];
}

/**
 * Template categories for filtering
 */
export const TEMPLATE_CATEGORIES = [
  'Business',
  'Service',
  'E-commerce',
  'Portfolio',
  'Blog',
  'Medical',
  'Legal',
  'Food & Restaurant',
  'Fitness & Wellness'
] as const;
```

### 4.3 Updated Generation Steps

**File**: `server/services/site-generator.service.ts` (modified)

```typescript
const GENERATION_STEPS = [
  'Validating configuration',
  'Creating site directory',
  'Creating database',
  'Downloading WordPress',
  'Configuring WordPress',
  'Installing WordPress',
  'Installing Starter Templates plugin',     // NEW STEP 7
  'Importing professional template',         // NEW STEP 8
  'Customizing site content',                // NEW STEP 9
  'Installing additional plugins',           // MODIFIED STEP 10 (was 12)
  'Finalizing site',                         // MODIFIED STEP 11 (was 13)
  'Installing security plugins',             // MODIFIED STEP 12 (was 14)
];
```

**New Step Implementation**:

```typescript
// Step 7: Install Starter Templates plugin + Astra theme
await runStep(7, GENERATION_STEPS[6], async () => {
  const resolvedSitePath = requireValue(sitePath, 'sitePath');
  
  if (!options.dryRun) {
    // Install Astra theme first
    await wpService.installTheme(resolvedSitePath, 'astra');
    
    // Install Starter Templates plugin
    await wpService.installStarterTemplatesPlugin(resolvedSitePath);
    
    addJobLog(jobId, 'info', 'Starter Templates plugin installed');
  } else {
    await simulateStep(1500);
  }
});

// Step 8: Import selected template
await runStep(8, GENERATION_STEPS[7], async () => {
  const resolvedSitePath = requireValue(sitePath, 'sitePath');
  const templateId = config.templateId || getDefaultTemplateForNiche(config.niche);
  
  if (!options.dryRun) {
    addJobLog(jobId, 'info', `Importing template: ${templateId}`);
    await starterTemplatesService.importTemplate(resolvedSitePath, templateId);
    addJobLog(jobId, 'info', 'Template import completed');
  } else {
    await simulateStep(3000);
  }
});

// Step 9: Customize imported content
await runStep(9, GENERATION_STEPS[8], async () => {
  const resolvedSitePath = requireValue(sitePath, 'sitePath');
  
  if (!options.dryRun) {
    await starterTemplatesService.customizeImportedSite(resolvedSitePath, {
      businessName: config.businessName,
      phone: config.phone,
      email: config.email,
      address: config.address,
    });
    addJobLog(jobId, 'info', 'Site content customized');
  } else {
    await simulateStep(1000);
  }
});
```

---

## 5. Database Schema Updates

### 5.1 Jobs Table Migration

Add `template_id` column to track which template was used:

```sql
-- Migration: Add template_id column
ALTER TABLE jobs ADD COLUMN template_id TEXT;

-- Add index for analytics
CREATE INDEX idx_jobs_template ON jobs(template_id);
```

### 5.2 Updated Jobs Table Schema

```sql
CREATE TABLE jobs (
  id TEXT PRIMARY KEY,
  business_name TEXT NOT NULL,
  niche TEXT NOT NULL,
  site_type TEXT NOT NULL,
  template_id TEXT,                    -- NEW: Starter Template ID
  config_json TEXT,
  status TEXT NOT NULL CHECK(status IN (
    'pending', 'in_progress', 'completed', 
    'failed', 'cancelled', 'deleted'
  )),
  current_step INTEGER DEFAULT 0,
  total_steps INTEGER NOT NULL,
  site_path TEXT,
  site_url TEXT,
  db_name TEXT,
  admin_password TEXT,
  ai_cost_usd REAL DEFAULT 0,
  ai_tokens_input INTEGER DEFAULT 0,
  ai_tokens_output INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  started_at TEXT,
  completed_at TEXT,
  error TEXT
);
```

### 5.3 Migration Script

**File**: `server/db/migrations/001_add_template_id.ts`

```typescript
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '../../data/jobs.db');

export function migrate() {
  const db = new Database(dbPath);
  
  // Check if column exists
  const columns = db.pragma('table_info(jobs)');
  const hasTemplateId = columns.some((col: any) => col.name === 'template_id');
  
  if (!hasTemplateId) {
    console.log('Adding template_id column to jobs table...');
    db.exec('ALTER TABLE jobs ADD COLUMN template_id TEXT');
    db.exec('CREATE INDEX IF NOT EXISTS idx_jobs_template ON jobs(template_id)');
    console.log('Migration completed successfully');
  } else {
    console.log('template_id column already exists, skipping migration');
  }
  
  db.close();
}

// Run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  migrate();
}
```

---

## 6. API Endpoint Changes

### 6.1 New Endpoints

#### `GET /api/templates`

List all available Starter Templates.

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "plumber-elementor",
      "slug": "plumber",
      "name": "Plumber",
      "description": "Professional plumbing business template with service pages and contact form",
      "pageBuilder": "elementor",
      "category": ["Service", "Business"],
      "isPremium": false,
      "previewUrl": "https://websitedemos.net/plumber/",
      "thumbnailUrl": "https://cdn.example.com/templates/plumber.jpg"
    }
  ]
}
```

#### `GET /api/templates/niche/:nicheId`

Get recommended templates for a specific niche.

**Parameters**:
- `nicheId`: Niche identifier (plumbing, salon, etc.)

**Response**:
```json
{
  "success": true,
  "data": {
    "niche": "plumbing",
    "recommended": [
      {
        "id": "plumber-elementor",
        "name": "Plumber",
        "isDefault": true,
        "...": "..."
      }
    ]
  }
}
```

### 6.2 Modified Endpoints

#### `POST /api/sites` (Modified)

**Request Body** (updated):
```json
{
  "businessName": "Joe's Plumbing",
  "niche": "plumbing",
  "templateId": "plumber-elementor",    // NEW FIELD (optional)
  "address": "123 Main St",
  "phone": "(555) 123-4567",
  "email": "joe@example.com",
  "additionalContext": "Family-owned since 1985",
  "siteType": "standard",
  "theme": "astra",                     // Still used (Astra required)
  "dryRun": false
}
```

**Validation** (Zod schema):
```typescript
const siteConfigSchema = z.object({
  businessName: z.string().min(1).max(100),
  niche: z.enum([...SUPPORTED_NICHES]),
  templateId: z.string().optional(),    // NEW
  address: z.string().min(1).max(500),
  phone: z.string().min(1).max(50),
  email: z.string().email(),
  additionalContext: z.string().max(2000).optional(),
  siteType: z.enum(['standard', 'ecommerce']),
  theme: z.string().default('astra'),
  dryRun: z.boolean().optional().default(false),
});
```

---

## 7. Frontend UI Changes

### 7.1 Template Selector Component

**File**: `client/src/components/TemplateSelector.tsx` (NEW)

```tsx
import { useState, useEffect } from 'react';
import type { StarterTemplate } from '@shared/types';

interface TemplateSelectorProps {
  nicheId: string;
  selectedTemplateId?: string;
  onSelect: (templateId: string) => void;
}

export default function TemplateSelector({
  nicheId,
  selectedTemplateId,
  onSelect
}: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<StarterTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewModal, setPreviewModal] = useState<string | null>(null);

  useEffect(() => {
    // Fetch templates for niche
    fetch(`/api/templates/niche/${nicheId}`)
      .then(res => res.json())
      .then(data => {
        setTemplates(data.data.recommended);
        // Auto-select first if none selected
        if (!selectedTemplateId && data.data.recommended.length > 0) {
          onSelect(data.data.recommended[0].id);
        }
        setLoading(false);
      });
  }, [nicheId]);

  if (loading) {
    return <div>Loading templates...</div>;
  }

  return (
    <div className="template-selector">
      <h3 className="text-lg font-semibold mb-4">
        Choose a Template Design
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map(template => (
          <div
            key={template.id}
            className={`
              template-card border-2 rounded-lg p-4 cursor-pointer
              transition-all hover:shadow-lg
              ${selectedTemplateId === template.id 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200'
              }
            `}
            onClick={() => onSelect(template.id)}
          >
            {/* Thumbnail */}
            {template.thumbnailUrl && (
              <img
                src={template.thumbnailUrl}
                alt={template.name}
                className="w-full h-48 object-cover rounded mb-3"
              />
            )}
            
            {/* Template Info */}
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-semibold text-gray-900">
                  {template.name}
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                  {template.description}
                </p>
                <div className="mt-2 flex gap-2">
                  {template.category.map(cat => (
                    <span
                      key={cat}
                      className="text-xs bg-gray-100 px-2 py-1 rounded"
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
              
              {template.isDefault && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                  Recommended
                </span>
              )}
            </div>
            
            {/* Preview Button */}
            {template.previewUrl && (
              <button
                type="button"
                className="mt-3 text-blue-600 text-sm hover:underline"
                onClick={(e) => {
                  e.stopPropagation();
                  setPreviewModal(template.previewUrl);
                }}
              >
                Preview Live Demo →
              </button>
            )}
          </div>
        ))}
      </div>
      
      {/* Preview Modal */}
      {previewModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewModal(null)}
        >
          <div
            className="bg-white rounded-lg max-w-6xl w-full h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">Template Preview</h3>
              <button
                onClick={() => setPreviewModal(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <iframe
              src={previewModal}
              className="w-full h-full"
              title="Template Preview"
            />
          </div>
        </div>
      )}
    </div>
  );
}
```

### 7.2 SiteForm Integration

**File**: `client/src/components/SiteForm.tsx` (modified)

Add template selection step between niche selection and submission:

```tsx
// Add to state
const [selectedTemplate, setSelectedTemplate] = useState<string | undefined>();

// Add to form steps (after niche selection)
<section className="form-section">
  <h2>Step 3: Choose Template Design</h2>
  
  <TemplateSelector
    nicheId={watch('niche')}
    selectedTemplateId={selectedTemplate}
    onSelect={setSelectedTemplate}
  />
</section>

// Update form submission
const onSubmit = async (data: FormData) => {
  const payload = {
    ...data,
    templateId: selectedTemplate,  // Include template ID
  };
  
  // Submit to API...
};
```

### 7.3 Updated Progress Steps

**File**: `client/src/components/ProgressView.tsx` (modified)

Update step labels to match new flow:

```typescript
const stepLabels = [
  'Validating configuration',
  'Creating site directory',
  'Creating database',
  'Downloading WordPress',
  'Configuring WordPress',
  'Installing WordPress',
  'Installing Starter Templates plugin',     // Updated
  'Importing professional template',         // Updated
  'Customizing site content',                // Updated
  'Installing additional plugins',           // Updated
  'Finalizing site',
  'Installing security plugins',
];
```

---

## 8. Backend Service Changes

### 8.1 WordPress Service Additions

**File**: `server/services/wordpress.service.ts` (modified)

```typescript
/**
 * Install Starter Templates plugin
 */
export async function installStarterTemplatesPlugin(sitePath: string): Promise<void> {
  logger.info({ sitePath }, 'Installing Starter Templates plugin');
  
  await wpCli(
    ['plugin', 'install', 'astra-sites', '--activate'],
    { sitePath }
  );
  
  logger.info({ sitePath }, 'Starter Templates plugin installed');
}

/**
 * Search and replace content across site
 */
export async function searchReplaceContent(
  sitePath: string,
  searches: Array<{ old: string; new: string }>
): Promise<void> {
  logger.info({ sitePath, count: searches.length }, 'Running search-replace operations');
  
  for (const { old, new: newValue } of searches) {
    await wpCli(
      ['search-replace', old, newValue, '--all-tables', '--precise'],
      { sitePath }
    );
  }
}

/**
 * Get all page IDs and titles
 */
export async function getPages(sitePath: string): Promise<Array<{ id: number; title: string }>> {
  const { stdout } = await wpCli(
    ['post', 'list', '--post_type=page', '--format=json'],
    { sitePath }
  );
  
  return JSON.parse(stdout);
}
```

### 8.2 Starter Templates Service Implementation

**File**: `server/services/starter-templates.service.ts` (NEW)

```typescript
import { execa } from 'execa';
import { createServiceLogger } from '../utils/logger.js';
import * as wpService from './wordpress.service.js';

const logger = createServiceLogger('starter-templates');

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
}

// Cache templates for 1 hour
let templatesCache: { data: StarterTemplate[]; timestamp: number } | null = null;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

/**
 * List all available Starter Templates
 */
export async function listTemplates(): Promise<StarterTemplate[]> {
  // Check cache first
  if (templatesCache && Date.now() - templatesCache.timestamp < CACHE_DURATION) {
    logger.debug('Returning cached templates');
    return templatesCache.data;
  }
  
  logger.info('Fetching Starter Templates list from WP-CLI');
  
  try {
    // Note: This requires a temporary WP install to query the plugin
    // We'll need to maintain a static list or use the plugin's API
    // For now, return a curated list
    const templates = await getCuratedTemplateList();
    
    templatesCache = {
      data: templates,
      timestamp: Date.now()
    };
    
    return templates;
  } catch (err) {
    logger.error({ err }, 'Failed to list Starter Templates');
    throw new Error('Failed to fetch template list');
  }
}

/**
 * Get curated list of free Elementor templates
 */
async function getCuratedTemplateList(): Promise<StarterTemplate[]> {
  // This is a curated list based on the README research
  // In production, this could be fetched from Astra's API or maintained in config
  return [
    {
      id: 'plumber-elementor',
      slug: 'plumber',
      name: 'Plumber',
      description: 'Local service business template with contact forms',
      pageBuilder: 'elementor',
      category: ['Service', 'Business'],
      isPremium: false,
      previewUrl: 'https://websitedemos.net/plumber-02/',
    },
    {
      id: 'digital-agency-elementor',
      slug: 'digital-agency',
      name: 'Digital Agency',
      description: 'Modern agency template with portfolio sections',
      pageBuilder: 'elementor',
      category: ['Business', 'Agency'],
      isPremium: false,
      previewUrl: 'https://websitedemos.net/digital-agency-02/',
    },
    // ... more templates
  ];
}

/**
 * Get templates recommended for a niche
 */
export async function getTemplatesForNiche(nicheId: string): Promise<StarterTemplate[]> {
  const allTemplates = await listTemplates();
  const mapping = NICHE_TEMPLATE_MAP[nicheId as NicheId];
  
  if (!mapping) {
    return allTemplates.filter(t => t.category.includes('Business')).slice(0, 3);
  }
  
  // Filter templates that match the niche mapping
  return allTemplates.filter(t => mapping.includes(t.id));
}

/**
 * Import a Starter Template
 */
export async function importTemplate(
  sitePath: string,
  templateId: string
): Promise<void> {
  logger.info({ sitePath, templateId }, 'Importing Starter Template');
  
  // First verify the plugin is installed
  const plugins = await wpService.wpCli(
    ['plugin', 'list', '--status=active', '--format=json'],
    { sitePath }
  );
  
  const pluginList = JSON.parse(plugins.stdout);
  const hasStarterTemplates = pluginList.some(
    (p: any) => p.name === 'astra-sites'
  );
  
  if (!hasStarterTemplates) {
    throw new Error('Starter Templates plugin not installed or not active');
  }
  
  // Import the template using WP-CLI
  // Command: wp starter-templates import <template-id> --yes
  try {
    await wpService.wpCli(
      ['starter-templates', 'import', templateId, '--yes'],
      { sitePath, timeout: 180000 } // 3 minute timeout for large imports
    );
    
    logger.info({ sitePath, templateId }, 'Template import completed');
  } catch (err) {
    logger.error({ sitePath, templateId, err }, 'Template import failed');
    throw new Error(`Failed to import template: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

/**
 * Customize imported site content
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
  
  // Common placeholder strings to replace (based on template analysis)
  const replacements = [
    // Business name variations
    { old: 'Plumber', new: config.businessName },
    { old: 'Company Name', new: config.businessName },
    { old: 'Business Name', new: config.businessName },
    
    // Contact info
    { old: '555-123-4567', new: config.phone },
    { old: '(555) 123-4567', new: config.phone },
    { old: 'contact@example.com', new: config.email },
    { old: 'info@example.com', new: config.email },
  ];
  
  await wpService.searchReplaceContent(sitePath, replacements);
  
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
  
  logger.info({ sitePath }, 'Site content customization completed');
}
```

---

## 9. Testing Strategy

### 9.1 Unit Tests

**Test Files to Create**:

1. `server/services/__tests__/starter-templates.service.test.ts`
   - Test `listTemplates()` returns valid data
   - Test `getTemplatesForNiche()` filters correctly
   - Test template caching works

2. `server/services/__tests__/wordpress.service.test.ts`
   - Test `installStarterTemplatesPlugin()`
   - Test `searchReplaceContent()` with various patterns

### 9.2 Integration Tests

**Test Scenarios**:

1. **Full Generation Flow**
   ```bash
   # Test standard site with template
   curl -X POST http://localhost:3000/api/sites \
     -H "Content-Type: application/json" \
     -d '{
       "businessName": "Test Plumbing",
       "niche": "plumbing",
       "templateId": "plumber-elementor",
       "address": "123 Test St",
       "phone": "555-0001",
       "email": "test@example.com",
       "siteType": "standard"
     }'
   ```

2. **E-commerce Site**
   ```bash
   # Test e-commerce template
   curl -X POST http://localhost:3000/api/sites \
     -H "Content-Type: application/json" \
     -d '{
       "businessName": "Test Shop",
       "niche": "general",
       "templateId": "ecommerce-elementor",
       "siteType": "ecommerce",
       ...
     }'
   ```

3. **Template Fallback**
   - Test invalid templateId falls back to default
   - Test niche without template uses general template

### 9.3 Manual Testing Checklist

- [ ] Template list loads in UI
- [ ] Template selection works
- [ ] Preview modal displays correctly
- [ ] Site generation completes successfully
- [ ] Content customization replaces variables correctly
- [ ] Elementor is installed and active
- [ ] Pages are editable with Elementor
- [ ] Menus are created correctly
- [ ] WooCommerce pages added (e-commerce sites)
- [ ] Images display correctly
- [ ] Contact forms work
- [ ] Responsive design works on mobile

---

## 10. Deployment Plan

### 10.1 Pre-Deployment Checklist

- [ ] All unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed for all niches
- [ ] Database migration tested
- [ ] README updated with new flow
- [ ] Environment variables documented
- [ ] Rollback plan prepared

### 10.2 Deployment Steps

1. **Backup Current System**
   ```bash
   # Backup database
   cp data/jobs.db data/jobs.db.backup.$(date +%Y%m%d)
   
   # Backup code
   git tag -a v1.0-pre-templates -m "Before Starter Templates integration"
   git push --tags
   ```

2. **Run Database Migration**
   ```bash
   npm run migrate
   ```

3. **Install Dependencies** (if any new packages)
   ```bash
   npm install
   ```

4. **Restart Services**
   ```bash
   npm run start:all
   ```

5. **Smoke Test**
   - Create a test site with template
   - Verify generation completes
   - Check site is accessible
   - Verify admin login works

### 10.3 Post-Deployment Verification

- [ ] Health check endpoint responds
- [ ] Template list endpoint returns data
- [ ] Site creation works end-to-end
- [ ] Existing sites still accessible
- [ ] No errors in logs

---

## 11. Rollback Strategy

### 11.1 If Issues Found Post-Deployment

**Option 1: Revert Code**
```bash
# Restore previous version
git revert <commit-hash>
# Or hard reset
git reset --hard v1.0-pre-templates
git push --force

# Restart
npm run start:all
```

**Option 2: Database Rollback**
```bash
# Restore database backup
cp data/jobs.db.backup.YYYYMMDD data/jobs.db

# Restart services
npm run start:all
```

### 11.2 Gradual Rollout (Alternative)

Instead of full deployment, add a feature flag:

```typescript
// .env
ENABLE_STARTER_TEMPLATES=true

// In code
if (process.env.ENABLE_STARTER_TEMPLATES === 'true') {
  // Use new template flow
} else {
  // Use legacy manual page creation
}
```

---

## 12. Phase 2 Planning: Stock Image Integration

**Deferred to Phase 2** (outlined for future reference)

### 12.1 Goals

- Replace template placeholder images with niche-relevant stock photos
- Support Pexels, Unsplash, and Pixabay APIs
- Automatic keyword-based image search
- Import images to WordPress media library
- Update page content to use new images

### 12.2 Architecture

**New Service**: `server/services/stock-images.service.ts`

```typescript
export interface StockImageProvider {
  name: 'pexels' | 'unsplash' | 'pixabay';
  searchImages(query: string, count: number): Promise<StockImage[]>;
  downloadImage(url: string): Promise<Buffer>;
}

export interface StockImage {
  url: string;
  thumbnailUrl: string;
  photographer: string;
  source: string;
}

/**
 * Search for images across all providers
 */
export async function searchImages(
  query: string,
  count: number = 5
): Promise<StockImage[]> {
  // Try providers in order: Pexels → Unsplash → Pixabay
}

/**
 * Download image and import to WordPress
 */
export async function importImageToWordPress(
  sitePath: string,
  imageUrl: string,
  title: string
): Promise<number> {
  // Download image
  // Upload via WP-CLI: wp media import <file> --title="..."
  // Return attachment ID
}

/**
 * Replace images in imported site
 */
export async function replaceTemplateImages(
  sitePath: string,
  niche: string
): Promise<void> {
  // Get niche-specific keywords (e.g., "plumber at work")
  // Search for images
  // Download and import
  // Update page content to use new images
}
```

### 12.3 API Keys Configuration

```bash
# .env additions
PEXELS_API_KEY=your_key_here
UNSPLASH_API_KEY=your_key_here
PIXABAY_API_KEY=your_key_here

# Optional: Disable if keys not provided
ENABLE_STOCK_IMAGES=true
```

### 12.4 Integration Points

**Add to generation flow** (new Step 9.5):

```typescript
// After Step 9: Customize site content
// Before Step 10: Install additional plugins

await runStep(9.5, 'Enhancing with stock imagery', async () => {
  if (process.env.ENABLE_STOCK_IMAGES === 'true') {
    await stockImagesService.replaceTemplateImages(
      resolvedSitePath,
      config.niche
    );
  }
});
```

### 12.5 Niche Keyword Mapping

**File**: `server/config/stock-image-keywords.ts`

```typescript
export const NICHE_IMAGE_KEYWORDS: Record<NicheId, string[]> = {
  plumbing: [
    'plumber at work',
    'plumbing tools',
    'pipe repair',
    'water heater',
    'bathroom plumbing'
  ],
  salon: [
    'hair salon interior',
    'hairdresser styling hair',
    'beauty salon',
    'hair coloring',
    'salon chair'
  ],
  // ... etc
};
```

---

## 13. Success Metrics

### 13.1 Performance Metrics

**Before Integration** (Current State):
- Generation time: ~45-60 seconds
- Page quality: Basic, unstyled placeholders
- Manual customization needed: High (hours of work)

**After Integration** (Target):
- Generation time: ~60-90 seconds (+30s for template import)
- Page quality: Professional, production-ready
- Manual customization needed: Low (minor tweaks only)

### 13.2 Quality Metrics

- ✅ All niches have appropriate template mapping
- ✅ 100% of generated sites use Elementor page builder
- ✅ Content customization replaces all placeholder text
- ✅ Images are professional (from templates, Phase 2: from stock APIs)
- ✅ Menus are properly structured
- ✅ Contact forms are functional
- ✅ Mobile-responsive design

### 13.3 Error Handling

- ✅ Graceful fallback if template import fails
- ✅ Retry logic for network issues
- ✅ Detailed error logging for debugging
- ✅ Clear error messages to user

---

## 14. Open Questions & Decisions Needed

### 14.1 Template Discovery

**Question**: How to get the actual template IDs from WP-CLI?

**Options**:
1. Maintain a curated static list (recommended for Phase 1)
2. Query from a temporary WordPress install
3. Use Astra's API (if available)

**Decision**: Use static curated list, update quarterly

### 14.2 Template Versioning

**Question**: How to handle template updates from Astra?

**Options**:
1. Lock to specific versions
2. Always use latest
3. Periodic manual updates to curated list

**Decision**: Use latest, test monthly for breaking changes

### 14.3 Page Builder Lock-in

**Question**: Should we support Gutenberg templates too?

**Options**:
1. Elementor only (simpler)
2. Support both (more flexibility)
3. Let user choose builder preference

**Decision**: Elementor only for Phase 1, evaluate Gutenberg in Phase 3

### 14.4 Content Customization Scope

**Question**: How deep should content customization go?

**Options**:
1. Basic: Business name, contact info only
2. Moderate: + Services list, about text
3. Deep: AI-generated custom content for all sections

**Decision**: Basic for Phase 1, Phase 2 adds AI customization (deferred from original scope)

---

## 15. Risk Assessment & Mitigation

### 15.1 Technical Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Template import fails | High | Medium | Fallback to manual page creation |
| WP-CLI command changes | High | Low | Pin Starter Templates plugin version |
| Template removed by Astra | Medium | Low | Maintain local template archive |
| Import timeout on slow connections | Medium | Medium | Increase timeout to 5 minutes |
| Elementor conflicts | Medium | Low | Test with all other plugins |

### 15.2 UX Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| User confused by template selection | Low | Medium | Clear UI, preview modal |
| Template doesn't match niche | Medium | Low | Curated recommendations |
| Content customization incomplete | High | Medium | Comprehensive search-replace list |

### 15.3 Performance Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Generation time too long | Medium | Medium | Optimize import, show detailed progress |
| Template files too large | Low | Low | Compress, lazy-load images |

---

## 16. Timeline Summary

### Week 1: Backend Foundation
- Days 1-2: Create starter-templates.service.ts
- Days 3-4: Update site-generator.service.ts
- Day 5: Database migration + testing

### Week 2: API & Frontend
- Days 1-2: API endpoints + template routes
- Days 3-4: Frontend TemplateSelector component
- Day 5: SiteForm integration

### Week 3: Testing & Documentation
- Days 1-2: Integration testing all niches
- Days 3-4: Bug fixes, refinements
- Day 5: Documentation, deployment prep

**Total Timeline**: 3 weeks (15 working days)

---

## 17. Conclusion

This implementation plan provides a comprehensive roadmap for integrating Astra Starter Templates into the WordPress Site Generator. The integration will significantly improve the quality of generated sites while maintaining the existing automation capabilities.

**Key Benefits**:
- ✅ Professional, production-ready designs
- ✅ Elementor page builder integration
- ✅ Minimal manual customization needed
- ✅ Scalable architecture for future enhancements
- ✅ Maintains current generation speed (<2 minutes)

**Next Steps**:
1. Review and approve this plan
2. Begin Phase 1.1: Backend foundation
3. Set up development environment with test WordPress install
4. Research actual template IDs via WP-CLI
5. Create first prototype with one niche (plumbing)

---

**Document Version**: 1.0  
**Last Updated**: January 31, 2026  
**Author**: AI Assistant  
**Reviewers**: TBD  
**Status**: Pending Review
