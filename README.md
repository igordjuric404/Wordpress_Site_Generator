# WordPress Site Generator

A comprehensive local web application for automated WordPress site generation with AI-powered content, WooCommerce support, and real-time progress tracking. This document provides complete technical documentation for AI systems and developers.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Prerequisites](#prerequisites)
3. [Configuration](#configuration)
4. [Architecture Overview](#architecture-overview)
5. [Tech Stack](#tech-stack)
6. [Project Structure](#project-structure)
7. [Database Schema](#database-schema)
8. [API Documentation](#api-documentation)
9. [Service Layer](#service-layer)
10. [WordPress Integration](#wordpress-integration)
11. [Frontend Architecture](#frontend-architecture)
12. [Site Generation Flow](#site-generation-flow)
13. [E-commerce Features](#e-commerce-features)
14. [Performance Optimizations](#performance-optimizations)
15. [Error Handling](#error-handling)
16. [Development Guide](#development-guide)
17. [Troubleshooting](#troubleshooting)
18. [Security Considerations](#security-considerations)

---

## 🚀 Quick Start

### One-Command Setup

```bash
npm run start:all
```

This single command performs:
1. ✅ Kills processes on ports 3000 and 5173 (clean start)
2. ✅ Automatically starts MySQL and Apache (Homebrew services, fallback to XAMPP/MAMP)
3. ✅ Verifies WP-CLI installation
4. ✅ Starts Express backend (port 3000 or next available)
5. ✅ Starts React frontend (port 5173 or next available)

### Access Points

- **Frontend UI**: http://localhost:5173 (or 5174 if 5173 is busy)
- **Backend API**: http://localhost:3000 (or next available port)
- **Health Check**: http://localhost:3000/api/health

### First-Time Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Configure Apache** (for clean permalinks):
   ```bash
   ./scripts/configure-apache.sh
   ```

4. **Start Services**:
   ```bash
   npm run start:all
   ```

---

## Prerequisites

### Required Software

| Software | Version | Installation | Purpose |
|----------|---------|--------------|---------|
| **Node.js** | 22.x LTS+ | `nvm install 22` or download | Runtime environment |
| **MySQL** | 8.0+ | `brew install mysql` or XAMPP/MAMP | WordPress database |
| **Apache** | 2.4+ | `brew install httpd` or XAMPP/MAMP | Web server |
| **WP-CLI** | Latest | `brew install wp-cli` | WordPress automation |
| **PHP** | 7.4+ | Included with Homebrew/XAMPP/MAMP | WordPress runtime |

### System Requirements

- **macOS** (primary platform, tested on macOS 14+)
- **Linux** (should work with minor path adjustments)
- **Windows** (not tested, would require path modifications)

### Optional Dependencies

- **Anthropic API Key**: For AI content generation (optional, placeholders used if not provided)
- **Git**: For version control

---

## Configuration

### Environment Variables

The `.env` file controls all application behavior. Here's a complete reference:

#### MySQL Configuration

```bash
# Homebrew MySQL (default)
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=                    # Empty for Homebrew default
MYSQL_SOCKET=/tmp/mysql.sock        # Unix socket (30x faster than TCP)

# MAMP Configuration (alternative)
# MYSQL_PORT=8889
# MYSQL_PASSWORD=root
# MYSQL_SOCKET=/Applications/MAMP/tmp/mysql/mysql.sock

# XAMPP Configuration (alternative)
# MYSQL_SOCKET=/Applications/XAMPP/xamppfiles/var/mysql/mysql.sock
```

**Performance Note**: The application automatically detects and uses MySQL Unix sockets (`/tmp/mysql.sock`) instead of TCP connections (`localhost:3306`) for 30x faster database operations.

#### Web Server Configuration

```bash
# Homebrew Apache (default)
WEB_ROOT=/opt/homebrew/var/www      # Site storage directory
BASE_URL=http://localhost:8080      # Base URL for generated sites

# Intel Mac Homebrew
# WEB_ROOT=/usr/local/var/www

# MAMP Configuration
# WEB_ROOT=/Applications/MAMP/htdocs
# BASE_URL=http://localhost:8888

# XAMPP Configuration
# WEB_ROOT=/Applications/XAMPP/xamppfiles/htdocs
# BASE_URL=http://localhost
```

#### PHP & WP-CLI Configuration

```bash
# WP-CLI path (usually 'wp' if in PATH)
WPCLI_PATH=wp

# PHP path (auto-detected, override if needed)
# PHP_PATH=/opt/homebrew/bin/php
# PHP_PATH=/Applications/XAMPP/xamppfiles/bin/php
```

**Auto-Detection Order**:
1. `PHP_PATH` environment variable
2. `WP_CLI_PHP` environment variable
3. `/opt/homebrew/bin/php` (Homebrew)
4. `/Applications/XAMPP/xamppfiles/bin/php` (XAMPP)
5. System PHP (`php` command)

#### AI Configuration

```bash
# Anthropic API Key (optional)
ANTHROPIC_API_KEY=sk-ant-xxxxx

# Cost limits (prevents accidental over-spending)
AI_COST_HARD_LIMIT_USD=1.00        # Hard limit per generation
```

**Behavior**: If API key is missing or cost limit exceeded, the system uses placeholder templates instead of AI-generated content.

#### Server Configuration

```bash
PORT=3000                           # Backend server port
LOG_LEVEL=info                      # Logging level (debug, info, warn, error)
```

### Configuration Files

#### Apache Configuration

For clean permalinks (no `/index.php/` prefix), run:
```bash
./scripts/configure-apache.sh
```

This script:
1. Enables `mod_rewrite` module
2. Sets `AllowOverride All` for web root directory
3. Creates backup of `httpd.conf`
4. Restarts Apache

Manual configuration:
- File: `/opt/homebrew/etc/httpd/httpd.conf` (Homebrew)
- Enable: `LoadModule rewrite_module lib/httpd/modules/mod_rewrite.so`
- Set: `AllowOverride All` in `<Directory>` section

---

## Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                     │
│  ┌──────────┐  ┌─────────-─┐  ┌──────────┐  ┌─────────-─┐   │
│  │Dashboard │  │SiteForm   │  │Progress  │  │  SSE      │   │
│  │          │  │           │  │  View    │  │  Hook     │   │
│  └────┬─────┘  └────┬──────┘  └────┬─────┘  └────┬──────┘   │
│       │             │              │             │          │
│       └─────────────┴──────────────┴─────────────┘          │
│                          │                                  │
│                    HTTP/REST API                            │
│                    Server-Sent Events                       │
└──────────────────────────┼──────────────────────────────────┘
                           │
┌──────────────────────────▼────────────────────────────────────┐
│                    Backend (Express/Node.js)                  │
│  ┌──────────────┐  ┌─────────────-─┐  ┌──────────────┐        │
│  │   Routes     │  │   Services    │  │   Database   │        │
│  │              │  │               │  │              │        │
│  │ /api/sites   │  │ Site Generator│  │   SQLite     │        │
│  │ /api/progress│  │ WordPress     │  │   (Jobs)     │        │
│  │ /api/preflight│ │ Database      │  │              │        │
│  └──────┬───────┘  │ Filesystem    │  └──────┬───────┘        │
│         │          │ Progress      │         │                │
│         │          │ Preflight     │         │                │
│         └──────────┴───────────────┴─────────┘                │
│                          │                                    │
└──────────────────────────┼────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
┌───────▼──────┐  ┌────────▼────────┐  ┌─────▼──────┐
│   WordPress  │  │     MySQL       │  │   Apache   │
│   (WP-CLI)   │  │   Database      │  │   Server   │
│              │  │                 │  │            │
│  Site Files  │  │  WordPress DBs  │  │  Web Root  │
└──────────────┘  └─────────────────┘  └────────────┘
```

### Data Flow

1. **User Input** → React Form (`SiteForm.tsx`)
2. **Form Submission** → POST `/api/sites` → Express Route (`routes/sites.ts`)
3. **Validation** → Zod schema validation
4. **Job Creation** → SQLite database (`db/jobs.ts`)
5. **Generation Start** → Service layer (`site-generator.service.ts`)
6. **Progress Updates** → SSE events (`progress.service.ts`) → Frontend (`useSSE.ts`)
7. **WordPress Operations** → WP-CLI wrapper (`wordpress.service.ts`)
8. **File Operations** → Filesystem service (`filesystem.service.ts`)
9. **Database Operations** → MySQL service (`database.service.ts`)
10. **Completion** → Job status updated → Frontend notified via SSE

---

## Tech Stack

### Frontend Stack

| Technology | Version | Purpose | Key Files |
|------------|---------|---------|-----------|
| **React** | 19.0.0 | UI framework | `client/src/components/*` |
| **TypeScript** | 5.7.2 | Type safety | `*.tsx`, `*.ts` |
| **Vite** | 6.0.7 | Build tool & dev server | `vite.config.ts` |
| **Tailwind CSS** | 3.4.17 | Utility-first CSS | `tailwind.config.js` |
| **React Router** | 7.1.1 | Client-side routing | `App.tsx` |
| **React Hook Form** | 7.54.2 | Form management | `SiteForm.tsx` |
| **Zod** | 3.24.1 | Schema validation | `routes/sites.ts` |
| **Server-Sent Events** | Native | Real-time progress | `useSSE.ts`, `progress.ts` |

### Backend Stack

| Technology | Version | Purpose | Key Files |
|------------|---------|---------|-----------|
| **Node.js** | 22.x | Runtime | `server/index.ts` |
| **Express** | 4.21.2 | Web framework | `server/routes/*` |
| **TypeScript** | 5.7.2 | Type safety | `server/**/*.ts` |
| **tsx** | 4.19.2 | TypeScript execution | `package.json` |
| **SQLite** | better-sqlite3 11.6.0 | Job persistence | `server/db/jobs.ts` |
| **MySQL2** | 3.11.5 | WordPress databases | `server/services/database.service.ts` |
| **execa** | 9.5.2 | Process execution | `server/services/wordpress.service.ts` |
| **Pino** | 9.6.0 | Structured logging | `server/utils/logger.ts` |
| **dotenv** | 16.4.7 | Environment variables | `.env` |

### External Tools

| Tool | Purpose | Integration |
|------|---------|-------------|
| **WP-CLI** | WordPress automation | Executed via `execa` |
| **MySQL** | Database server | Connection via `mysql2` |
| **Apache** | Web server | Serves WordPress sites |
| **PHP** | WordPress runtime | Executed via WP-CLI |

---

## Project Structure

### Complete Directory Tree

```
wordpress-site-generator/
├── client/                          # React frontend application
│   ├── public/                      # Static assets
│   │   └── favicon.svg
│   ├── src/
│   │   ├── components/              # React components
│   │   │   ├── Dashboard.tsx       # Main dashboard (site list)
│   │   │   ├── SiteForm.tsx         # Site creation form
│   │   │   └── ProgressView.tsx     # Real-time progress display
│   │   ├── hooks/                   # Custom React hooks
│   │   │   └── useSSE.ts           # Server-Sent Events hook
│   │   ├── api/                     # API client
│   │   │   └── client.ts           # Axios-like fetch wrapper
│   │   ├── App.tsx                  # Root component
│   │   ├── main.tsx                 # Entry point
│   │   └── index.css                # Global styles
│   ├── index.html                   # HTML template
│   └── vite.config.ts              # Vite configuration
│
├── server/                          # Express backend application
│   ├── config/                      # Configuration files
│   │   ├── plugins.ts              # Plugin definitions
│   │   ├── themes.ts               # Theme definitions
│   │   ├── placeholders.ts         # Content templates
│   │   └── ecommerce/
│   │       └── products.ts         # Product templates
│   │
│   ├── services/                    # Business logic layer
│   │   ├── site-generator.service.ts    # Main orchestration
│   │   ├── wordpress.service.ts         # WP-CLI wrapper
│   │   ├── database.service.ts          # MySQL operations
│   │   ├── filesystem.service.ts        # File operations
│   │   ├── preflight.service.ts         # System checks
│   │   └── progress.service.ts          # SSE event emitter
│   │
│   ├── routes/                      # Express route handlers
│   │   ├── sites.ts                 # Site CRUD operations
│   │   ├── progress.ts              # SSE progress endpoint
│   │   └── preflight.ts             # System checks endpoint
│   │
│   ├── db/                          # Database layer
│   │   └── jobs.ts                  # SQLite job storage
│   │
│   ├── utils/                       # Utility functions
│   │   ├── logger.ts                # Pino logger setup
│   │   └── sanitize.ts              # String sanitization
│   │
│   └── index.ts                     # Express server entry point
│
├── shared/                          # Shared TypeScript types
│   └── types.ts                     # Common interfaces
│
├── scripts/                         # Utility scripts
│   ├── start-all.js                 # Main startup script
│   ├── start-xampp.js               # XAMPP startup helper
│   ├── start-mysql-auto.js          # MySQL auto-start
│   ├── kill-ports.js                # Port cleanup
│   ├── configure-apache.sh          # Apache configuration
│   └── fix-wordfence.sh             # Wordfence removal
│
├── docs/                            # Documentation
│   ├── apache-configuration.md      # Apache setup guide
│   └── wordfence-fix.md             # Wordfence issue resolution
│
├── data/                            # Runtime data (gitignored)
│   ├── jobs.db                      # SQLite database
│   └── temp/                        # Temporary files
│
├── .env                             # Environment variables (gitignored)
├── .env.example                     # Environment template
├── .gitignore                       # Git ignore rules
├── package.json                     # Dependencies & scripts
├── tsconfig.json                    # TypeScript configuration
├── tailwind.config.js               # Tailwind CSS configuration
├── postcss.config.js                # PostCSS configuration
└── README.md                         # This file
```

### Key File Descriptions

#### Frontend Files

- **`client/src/components/Dashboard.tsx`**: Main dashboard displaying all sites, filtering, bulk operations
- **`client/src/components/SiteForm.tsx`**: Multi-step form for site creation with validation
- **`client/src/components/ProgressView.tsx`**: Real-time progress display with SSE connection
- **`client/src/hooks/useSSE.ts`**: Custom hook for Server-Sent Events connection management
- **`client/src/api/client.ts`**: API client with typed request/response handling

#### Backend Files

- **`server/index.ts`**: Express server setup, middleware, route registration, port management
- **`server/services/site-generator.service.ts`**: Main orchestration service, 14-step generation process
- **`server/services/wordpress.service.ts`**: WP-CLI wrapper, WordPress operations (install, config, plugins, themes, pages, menus)
- **`server/services/database.service.ts`**: MySQL database creation/deletion, connection management
- **`server/services/filesystem.service.ts`**: Site directory management, URL generation, temp file handling
- **`server/services/preflight.service.ts`**: System validation (WP-CLI, PHP, MySQL, Apache, API keys)
- **`server/services/progress.service.ts`**: SSE event emitter for real-time progress updates
- **`server/db/jobs.ts`**: SQLite database operations, job CRUD, job logs

#### Configuration Files

- **`server/config/plugins.ts`**: Plugin definitions (core, e-commerce, niche-specific, post-generation)
- **`server/config/themes.ts`**: Theme definitions with metadata
- **`server/config/placeholders.ts`**: Content templates for all niches
- **`server/config/ecommerce/products.ts`**: Product templates for WooCommerce seeding

---

## Database Schema

### SQLite Database (`data/jobs.db`)

#### `jobs` Table

Stores all site generation jobs.

```sql
CREATE TABLE jobs (
  id TEXT PRIMARY KEY,                    -- Unique job ID (nanoid)
  business_name TEXT NOT NULL,           -- Business name
  niche TEXT NOT NULL,                    -- Niche ID (plumbing, salon, etc.)
  site_type TEXT NOT NULL,                -- 'standard' or 'ecommerce'
  config_json TEXT,                       -- Full SiteConfig JSON
  status TEXT NOT NULL CHECK(status IN (
    'pending', 'in_progress', 'completed', 
    'failed', 'cancelled', 'deleted'
  )),
  current_step INTEGER DEFAULT 0,         -- Current generation step (0-14)
  total_steps INTEGER NOT NULL,           -- Total steps (always 14)
  site_path TEXT,                         -- Filesystem path to WordPress install
  site_url TEXT,                          -- Full URL (e.g., http://localhost:8080/site-name-1)
  db_name TEXT,                           -- MySQL database name
  admin_password TEXT,                    -- WordPress admin password (generated)
  ai_cost_usd REAL DEFAULT 0,             -- AI API cost in USD
  ai_tokens_input INTEGER DEFAULT 0,      -- AI input tokens used
  ai_tokens_output INTEGER DEFAULT 0,     -- AI output tokens used
  created_at TEXT NOT NULL,               -- ISO timestamp
  started_at TEXT,                        -- ISO timestamp (when generation started)
  completed_at TEXT,                      -- ISO timestamp (when generation finished)
  error TEXT                              -- Error message if failed
);

CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_created ON jobs(created_at DESC);
```

#### `job_logs` Table

Stores detailed logs for each job step.

```sql
CREATE TABLE job_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id TEXT NOT NULL,                   -- Foreign key to jobs.id
  timestamp TEXT NOT NULL,                -- ISO timestamp
  level TEXT NOT NULL CHECK(level IN (
    'info', 'warning', 'error'
  )),
  message TEXT NOT NULL,                  -- Log message
  metadata TEXT,                          -- JSON metadata (optional)
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
);

CREATE INDEX idx_job_logs_job_id ON job_logs(job_id);
```

### MySQL Databases

Each generated WordPress site gets its own MySQL database:

- **Naming**: `{slugified_business_name}_{increment}` (e.g., `joes_plumbing_1`)
- **User**: `root` (configurable via `MYSQL_USER`)
- **Password**: Empty or from `MYSQL_PASSWORD`
- **Host**: `localhost:/tmp/mysql.sock` (Unix socket) or `localhost:3306` (TCP fallback)

---

## API Documentation

### Base URL

```
http://localhost:3000/api
```

### Authentication

Currently none - all endpoints are open. For production, add authentication middleware.

### Endpoints

#### `GET /api/health`

Health check endpoint.

**Response**:
```json
{
  "status": "ok",
  "timestamp": "2026-01-29T12:00:00.000Z"
}
```

#### `GET /api/sites`

List recent sites (last 20).

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "abc123",
      "businessName": "Joe's Plumbing",
      "niche": "plumbing",
      "siteType": "standard",
      "status": "completed",
      "currentStep": 14,
      "totalSteps": 14,
      "sitePath": "/opt/homebrew/var/www/joes-plumbing-1",
      "siteUrl": "http://localhost:8080/joes-plumbing-1",
      "dbName": "joes_plumbing_1",
      "adminPassword": "generated_password",
      "aiCostUsd": 0.05,
      "createdAt": "2026-01-29T10:00:00.000Z",
      "completedAt": "2026-01-29T10:05:00.000Z"
    }
  ]
}
```

#### `GET /api/sites/failed`

List all failed jobs.

**Response**: Same format as `GET /api/sites`

#### `GET /api/sites/niches`

List available niches.

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "plumbing",
      "label": "Plumbing",
      "pages": ["Home", "Services", "About", "Contact"],
      "services": ["Emergency Repairs", "Installation", "Maintenance", "Inspection"]
    }
  ]
}
```

#### `GET /api/sites/themes`

List available themes.

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "slug": "astra",
      "name": "Astra",
      "description": "Lightweight, fast, extremely customizable theme",
      "features": ["PageSpeed 90+", "Block Editor Ready", "WooCommerce Compatible"],
      "recommended": true
    }
  ],
  "default": "astra"
}
```

#### `GET /api/sites/:id`

Get site details including logs.

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "abc123",
    "businessName": "Joe's Plumbing",
    "status": "completed",
    "logs": [
      {
        "id": 1,
        "jobId": "abc123",
        "timestamp": "2026-01-29T10:00:00.000Z",
        "level": "info",
        "message": "Site generation started",
        "metadata": null
      }
    ]
  }
}
```

#### `POST /api/sites`

Create a new site.

**Request Body**:
```json
{
  "businessName": "Joe's Plumbing",
  "niche": "plumbing",
  "address": "123 Main St, City, State 12345",
  "phone": "(555) 123-4567",
  "email": "joe@joesplumbing.com",
  "additionalContext": "Family-owned business since 1985",
  "siteType": "standard",
  "theme": "astra",
  "dryRun": false
}
```

**Validation Rules**:
- `businessName`: Required, 1-100 characters
- `niche`: Required, must be valid niche ID
- `address`: Required, 1-500 characters
- `phone`: Required, 1-50 characters
- `email`: Required, valid email format
- `additionalContext`: Optional, max 2000 characters
- `siteType`: Required, `'standard'` or `'ecommerce'`
- `theme`: Optional, defaults to `'astra'`
- `dryRun`: Optional boolean, defaults to `false`

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "abc123",
    "businessName": "Joe's Plumbing",
    "status": "in_progress",
    "currentStep": 0,
    "totalSteps": 14
  }
}
```

**Error Response**:
```json
{
  "success": false,
  "error": "Validation failed",
  "details": {
    "businessName": "Business name is required"
  }
}
```

#### `DELETE /api/sites/:id`

Delete a site (files and database).

**Response**:
```json
{
  "success": true,
  "message": "Site deleted successfully"
}
```

#### `POST /api/sites/bulk-delete`

Bulk delete multiple sites.

**Request Body**:
```json
{
  "ids": ["abc123", "def456"]
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "deleted": 2,
    "failed": 0,
    "errors": []
  }
}
```

#### `GET /api/progress/:jobId`

Server-Sent Events stream for real-time progress.

**Headers**:
```
Accept: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
```

**Event Format**:
```
data: {"jobId":"abc123","step":5,"totalSteps":14,"status":"in_progress","message":"Installing WordPress","timestamp":"2026-01-29T10:02:00.000Z"}

data: {"jobId":"abc123","step":14,"totalSteps":14,"status":"completed","message":"Site generation completed successfully","timestamp":"2026-01-29T10:05:00.000Z"}

```

**Event Types**:
- `in_progress`: Step completed, moving to next
- `completed`: All steps finished successfully
- `failed`: Error occurred, generation stopped
- `cancelled`: User cancelled generation

#### `GET /api/preflight`

Run system preflight checks.

**Response**:
```json
{
  "status": "ready",
  "checks": {
    "wpCliInstalled": true,
    "wpCliVersion": "2.8.1",
    "phpPath": "/opt/homebrew/bin/php",
    "phpVersion": "8.4.13",
    "phpMeetsRequirements": true,
    "mysqlConnected": true,
    "mysqlSocket": true,
    "apacheRunning": true,
    "anthropicKeyValid": true,
    "webRootValid": true,
    "webRootWritable": true
  },
  "errors": [],
  "warnings": []
}
```

**Status Values**:
- `ready`: All checks passed
- `warning`: Some warnings but can proceed
- `error`: Critical errors, generation may fail

---

## Service Layer

### Site Generator Service (`site-generator.service.ts`)

**Purpose**: Orchestrates the entire site generation process.

**Key Functions**: `generateSite`, `deleteSite`, `resumeJob`, `cancelJob`, `bulkDeleteSites`

**Generation Steps** (14 total):

1. **Validating configuration** - Check required fields
2. **Creating site directory** - Generate unique directory name
3. **Creating database** - Create MySQL database
4. **Downloading WordPress** - Download WordPress core via WP-CLI
5. **Configuring WordPress** - Create `wp-config.php` with performance optimizations
6. **Installing WordPress** - Run `wp core install`
7. **Creating homepage** - Create and set homepage
8. **Creating about page** - Create About page with template
9. **Creating services page** - Create Services page with template
10. **Creating contact page** - Create Contact page with template
11. **Installing theme** - Install and activate selected theme, create menu
12. **Installing plugins** - Install core and niche-specific plugins
13. **Finalizing site** - WooCommerce setup (if e-commerce), add WooCommerce pages to menu, flush rewrite rules
14. **Installing security plugins** - Install post-generation plugins (currently empty)

### WordPress Service (`wordpress.service.ts`)

**Purpose**: Wrapper around WP-CLI commands.

**Key Functions**: `wpCli`, `downloadWordPress`, `createConfig`, `installCore`, `installTheme`, `installPlugins`, `createPage`, `setHomepage`, `setupWooCommerce`, `seedProducts`, `createMenu`, `addPageToMenu`, `setPermalinks`, `flushRewriteRules`

**WP-CLI Execution Details**:

- **PHP Path**: Auto-detected (Homebrew → XAMPP → system)
- **Memory Limit**: Set to 512M via `-d memory_limit=512M`
- **Timeout**: 120 seconds per command
- **PATH Enhancement**: Adds Homebrew/XAMPP binaries to PATH
- **Error Handling**: Throws errors with stderr output

### Database Service (`database.service.ts`)

**Purpose**: MySQL database operations.

**Key Functions**: `createDatabase`, `dropDatabase`, `getNextAvailableDbName`, `testConnection`

**Connection Details**:

- **Host**: `localhost:/tmp/mysql.sock` (Unix socket) or `localhost:3306` (TCP)
- **User**: From `MYSQL_USER` env var (default: `root`)
- **Password**: From `MYSQL_PASSWORD` env var (default: empty)
- **Socket Detection**: Automatically detects socket path

### Filesystem Service (`filesystem.service.ts`)

**Purpose**: File and directory operations.

**Key Functions**: `getWebRoot`, `getBaseUrl`, `getSiteUrl`, `siteExists`, `getNextAvailableSiteName`, `createSiteDirectory`, `removeSiteDirectory`, `writeTempContent`, `removeTempFile`

**Site Naming**:

- Format: `{slugified_business_name}-{increment}`
- Example: `joes-plumbing-1`, `joes-plumbing-2`
- Increment starts at 1, increases until unique name found

### Preflight Service (`preflight.service.ts`)

**Purpose**: System validation before generation.

**Checks Performed**:

1. **WP-CLI**: Installed, version extracted
2. **PHP**: Path detected, version checked (>= 7.4)
3. **MySQL Socket**: Exists at `/tmp/mysql.sock` or alternatives
4. **MySQL Connection**: Port listening or socket exists
5. **Apache**: Responds to HTTP requests
6. **Anthropic API Key**: Valid format (`sk-ant-` prefix)
7. **Web Root**: Exists and is writable

**Caching**: Results cached for 5 minutes to avoid repeated checks.

### Progress Service (`progress.service.ts`)

**Purpose**: Server-Sent Events for real-time updates.

**Key Functions**: `subscribeToProgress`, `emitProgress`, `createProgressHelper`

**Progress Helper Methods**: `start`, `advance`, `complete`, `fail`, `cancel`

---

## WordPress Integration

### WP-CLI Usage

All WordPress operations use WP-CLI via the `execa` package. Commands are executed with proper PHP path detection, memory limits, and error handling.

### WordPress Configuration

**wp-config.php** is automatically configured with:

```php
// Database settings
define('DB_NAME', 'database_name');
define('DB_USER', 'root');
define('DB_PASSWORD', '');
define('DB_HOST', 'localhost:/tmp/mysql.sock'); // Unix socket

// Performance optimizations (auto-added)
define('WP_CACHE', true);
define('CONCATENATE_SCRIPTS', false);
define('WP_MEMORY_LIMIT', '256M');
define('WP_MAX_MEMORY_LIMIT', '512M');
```

### Permalink Structure

- **Structure**: `/%postname%/` (clean URLs)
- **.htaccess**: Automatically created with correct `RewriteBase`
- **Apache Requirements**: `mod_rewrite` enabled, `AllowOverride All`

### Installed Plugins

**Core Plugins** (all sites):
- Contact Form 7
- Yoast SEO (WordPress SEO)
- UpdraftPlus
- WP Super Cache

**E-commerce Plugins** (e-commerce sites only):
- WooCommerce (required)

**Post-Generation Plugins** (currently empty):
- None (Wordfence removed due to local dev incompatibility)

### Theme Installation

Themes are installed from WordPress.org repository:

```bash
wp theme install {theme-slug} --activate --path={sitePath}
```

**Available Themes**:
- Astra (default, recommended)
- OceanWP
- Neve
- GeneratePress
- Blocksy

### Menu Creation

Navigation menus are automatically created:

1. **Menu Creation**: `wp menu create "Main Menu"`
2. **Location Assignment**: Assigned to primary menu location
3. **Page Addition**: Home, About, Services, Contact pages added
4. **WooCommerce Pages** (e-commerce): Shop, Cart, My Account added

### WooCommerce Setup

For e-commerce sites:

1. **WooCommerce Installation**: Installed and activated
2. **Onboarding Disabled**: Skips setup wizard
3. **Default Settings**:
   - Currency: USD
   - Guest checkout: Enabled
   - Permalinks: Set to `/%postname%/`
4. **Pages Created**: Shop, Cart, Checkout, My Account
5. **Product Seeding**: 3 categories, 4 products per category (12 total)

---

## Frontend Architecture

### Component Structure

```
App.tsx (Root)
├── Dashboard.tsx (Route: /)
│   ├── Preflight Status
│   ├── In Progress Sites
│   ├── Completed Sites
│   └── Failed Sites
├── SiteForm.tsx (Route: /create)
│   ├── Business Info Form
│   ├── Niche Selection
│   ├── Theme Selection
│   └── Site Type Selection
└── ProgressView.tsx (Route: /progress/:id)
    ├── Progress Steps
    ├── Real-time Logs
    └── Site Info Display
```

### State Management

**React Hooks**:
- `useState`: Component-level state
- `useEffect`: Side effects, data fetching
- `useForm` (React Hook Form): Form state and validation
- `useSSE` (custom): Server-Sent Events connection

**No Global State**: No Redux/Zustand - all state is local or fetched via API.

### API Client (`client/src/api/client.ts`)

Typed API client with error handling. Provides functions for all API endpoints: `getSites`, `createSite`, `getSite`, `deleteSite`, `getNiches`, `getThemes`, `subscribeToProgress`.

### Server-Sent Events (`useSSE.ts`)

Custom hook for SSE connections. Returns `events` array, `error` state, and `reconnect` function. Auto-reconnects on disconnect and handles connection errors gracefully.

### Styling

**Tailwind CSS** with custom CSS variables:

```css
:root {
  --color-primary: #3b82f6;
  --color-success: #10b981;
  --color-error: #ef4444;
  /* ... more variables */
}
```

**Responsive Design**: Mobile-first approach with Tailwind breakpoints.

---

## Site Generation Flow

### Complete Flow Diagram

```
User submits form
    ↓
POST /api/sites
    ↓
Zod validation
    ↓
Create job in SQLite (status: 'pending')
    ↓
Return job ID immediately
    ↓
[Async] Start generation
    ↓
Update status: 'in_progress'
    ↓
Step 1: Validate config
    ↓
Step 2: Create site directory
    ↓
Step 3: Create MySQL database
    ↓
Step 4: Download WordPress core
    ↓
Step 5: Create wp-config.php
    ↓
Step 6: Install WordPress core
    ↓
Step 7: Create homepage
    ↓
Step 8: Create about page
    ↓
Step 9: Create services page
    ↓
Step 10: Create contact page
    ↓
Step 11: Install theme + create menu
    ↓
Step 12: Install plugins
    ↓
Step 13: Finalize (WooCommerce if e-commerce)
    ↓
Step 14: Post-generation plugins
    ↓
Update status: 'completed'
    ↓
Emit completion event via SSE
```

### Step-by-Step Details

#### Step 1: Validation
- Check required fields (businessName, niche)
- Validate email format
- Check niche is supported

#### Step 2: Site Directory
- Slugify business name: `"Joe's Plumbing"` → `"joes-plumbing"`
- Find next available: `joes-plumbing-1`, `joes-plumbing-2`, etc.
- Create directory: `/opt/homebrew/var/www/joes-plumbing-1`
- Generate URL: `http://localhost:8080/joes-plumbing-1`

#### Step 3: Database
- Slugify business name: `"Joe's Plumbing"` → `"joes_plumbing"`
- Find next available: `joes_plumbing_1`, `joes_plumbing_2`, etc.
- Create MySQL database

#### Step 4: WordPress Download
- Execute: `wp core download --path={sitePath}`
- Downloads latest WordPress version

#### Step 5: Configuration
- Create `wp-config.php` with database credentials
- Add performance optimizations
- Use MySQL socket if available

#### Step 6: Installation
- Execute: `wp core install --url={siteUrl} --title={businessName} ...`
- Creates admin user: `admin` / `{generated_password}`
- Sets admin email from config

#### Steps 7-10: Pages
- Create pages with template content
- Replace template variables (businessName, city, phone, email)
- Set homepage as static page

#### Step 11: Theme & Menu
- Install theme: `wp theme install {theme} --activate`
- Get menu locations: `wp menu location list`
- Create menu: `wp menu create "Main Menu"`
- Assign location: `wp menu location assign {menuId} {location}`
- Add pages: `wp menu item add-post {menuId} {pageId}`

#### Step 12: Plugins
- Get plugin list from config
- Install each: `wp plugin install {plugin} --activate`
- Track installed vs failed
- For e-commerce: Verify WooCommerce installed

#### Step 13: Finalization
- **If e-commerce**:
  - Setup WooCommerce (pages, settings, permalinks)
  - Get WooCommerce page IDs
  - Add to menu (Shop, Cart, My Account)
- Set permalinks: `wp rewrite structure '/%postname%/'`
- Flush rewrite rules: `wp rewrite flush --hard`
- Create `.htaccess` if missing

#### Step 14: Post-Generation
- Install post-generation plugins (currently empty)
- Reserved for plugins that should install last

---

## E-commerce Features

### WooCommerce Integration

**Installation**:
- Installed via WP-CLI: `wp plugin install woocommerce --activate`
- Required for e-commerce sites (generation fails if installation fails)

**Setup Process**:

1. **Disable Onboarding**: Sets options to skip WooCommerce setup wizard
2. **Configure Defaults**: Sets currency to USD, enables guest checkout

3. **Create Pages**:
   - Shop (products listing)
   - Cart (shopping cart)
   - Checkout (checkout process)
   - My Account (customer account)

4. **Set Permalinks**: Required for WooCommerce to work properly

### Product Seeding

**Template Structure**:

Each niche has:
- **3 Categories**: Industry-specific categories
- **4 Products per Category**: 12 total products

**Example (Fitness Niche)**:

**Categories**:
1. Equipment
2. Apparel
3. Accessories

**Products** (Equipment category):
1. Adjustable Dumbbells - $199.99
2. Resistance Bands Set - $29.99
3. Yoga Mat Premium - $49.99
4. Pull-Up Bar - $39.99

**Product Fields**:
- Name
- Category
- Short Description
- Full Description
- Price (string format: "199.99")
- SKU (auto-generated if not provided)

**Seeding Process**: Creates categories via WP-CLI, then creates products and links them to categories. Featured images use placeholder URLs.

### Navigation Menu Integration

WooCommerce pages are automatically added to the main navigation menu:

- **Shop**: Products listing page
- **Cart**: Shopping cart page
- **My Account**: Customer account page
- **Checkout**: Not added (typically accessed via Cart)

**Menu Order**: Basic pages first, then WooCommerce pages.

---

## Performance Optimizations

### MySQL Socket Connection

**Problem**: TCP connections (`localhost:3306`) are slow (6-30 seconds per query).

**Solution**: Use Unix socket (`/tmp/mysql.sock`) for 30x faster queries.

**Implementation**: Automatically detects `/tmp/mysql.sock` and uses Unix socket format `localhost:/tmp/mysql.sock` instead of TCP `localhost:3306`.

### WordPress Configuration

**Performance Settings** (auto-added to `wp-config.php`):

**Performance Settings**: `WP_CACHE`, `CONCATENATE_SCRIPTS`, `WP_MEMORY_LIMIT` (256M), `WP_MAX_MEMORY_LIMIT` (512M)

### Plugin Installation Order

**Strategy**: Install heavy plugins last to avoid slowing generation.

**Order**:
1. Core plugins (Contact Form 7, SEO, etc.)
2. E-commerce plugins (WooCommerce)
3. Post-generation plugins (currently empty)

**Wordfence Removal**: Removed entirely due to 30+ second delays per WP-CLI command.

### PHP Memory Limits

**WP-CLI Execution**:
- Set via command-line: `php -d memory_limit=512M wp ...`
- Prevents "memory exhausted" errors

**WordPress Runtime**:
- Set in `wp-config.php`: `WP_MEMORY_LIMIT = '256M'`
- Max for admin: `WP_MAX_MEMORY_LIMIT = '512M'`

### Caching

**Preflight Checks**: Cached for 5 minutes to avoid repeated system checks.

**Plugin Cache**: (Currently unused, reserved for future plugin version caching)

---

## Error Handling

### Error Types

1. **Validation Errors**: Zod schema validation failures
2. **System Errors**: WP-CLI failures, file system errors
3. **Database Errors**: MySQL connection failures
4. **Network Errors**: API request failures
5. **Timeout Errors**: WP-CLI command timeouts (120s limit)

### Error Handling Strategy

**Backend**:
- Try-catch blocks around all async operations
- Log errors with context (Pino structured logging)
- Return user-friendly error messages
- Update job status to `'failed'` with error message

**Frontend**:
- Display error messages to user
- Retry logic for SSE connections
- Graceful degradation (show cached data if API fails)

### Error Recovery

**Failed Jobs**:
- Can be resumed: `POST /api/sites/:id/resume`
- Cleans up partial resources before retry
- Skips completed steps

**Cancelled Jobs**:
- Can be cancelled: `POST /api/sites/:id/cancel`
- Stops generation immediately
- Cleans up resources

**Cleanup on Failure**:
- Database dropped
- Site directory removed
- Job marked as `'failed'`

---

## Development Guide

### Adding a New Niche

1. **Add to Types** (`shared/types.ts`): Add niche definition with label, pages, and services
2. **Add Placeholder Templates** (`server/config/placeholders.ts`): Add homepage, about, services, and contact templates
3. **Add Product Templates** (`server/config/ecommerce/products.ts`): If e-commerce, add categories and products

### Adding a New Theme

1. **Add to Themes Config** (`server/config/themes.ts`): Add theme definition with slug, name, description, features, and recommended flag
2. **Theme must be available on WordPress.org** (free themes only)

### Adding a New Plugin

1. **Add to Plugin Config** (`server/config/plugins.ts`): Add plugin slug to `CORE_PLUGINS` or `NICHE_PLUGINS` array
2. **Plugin must be available on WordPress.org** (free plugins only)

### Testing

**Manual Testing**:
1. Start server: `npm run start:all`
2. Create test site via UI
3. Verify site generation completes
4. Check WordPress admin works
5. Verify pages/content correct

**Dry Run Testing**: Create site with `dryRun: true` to simulate generation without creating files or databases.

### Debugging

**Enable Debug Logging**:
```bash
LOG_LEVEL=debug npm start
```

**View Logs**:
- Backend: Console output (Pino pretty printer)
- Frontend: Browser console
- WordPress: `/opt/homebrew/var/log/httpd/error_log`

**WP-CLI Debugging**:
```bash
# Test WP-CLI manually
wp --info --path=/opt/homebrew/var/www/site-name-1

# Check WordPress installation
wp core version --path=/opt/homebrew/var/www/site-name-1
```

---

## Troubleshooting

### Common Issues

#### 1. "WP-CLI not found"

**Symptoms**: Preflight check fails, generation fails.

**Solutions**:
```bash
# Install WP-CLI
brew install wp-cli

# Verify installation
wp --info

# Check PATH
which wp
```

#### 2. "MySQL connection failed"

**Symptoms**: Database creation fails, WordPress installation fails.

**Solutions**:
```bash
# Start MySQL
brew services start mysql
# Or
npm run start:mysql

# Check MySQL is running
mysql -u root -e "SELECT 1"

# Verify socket exists
ls -la /tmp/mysql.sock
```

#### 3. "Apache not running"

**Symptoms**: Sites return 404, preflight check fails.

**Solutions**:
```bash
# Start Apache
brew services start httpd

# Check Apache is running
curl http://localhost:8080

# Check Apache logs
tail -f /opt/homebrew/var/log/httpd/error_log
```

#### 4. "Clean permalinks not working"

**Symptoms**: URLs return 404, `/index.php/` prefix appears.

**Solutions**:
```bash
# Run Apache configuration script
./scripts/configure-apache.sh

# Or manually edit httpd.conf
# Enable: LoadModule rewrite_module
# Set: AllowOverride All
# Restart Apache
```

#### 5. "WordPress admin loading slowly"

**Symptoms**: "localhost didn't send any data", timeouts.

**Solutions**:
```bash
# Deactivate Wordfence (if installed)
./scripts/fix-wordfence.sh

# Or manually
wp plugin deactivate wordfence --path=/path/to/site
```

#### 6. "Port already in use"

**Symptoms**: Server fails to start.

**Solutions**:
```bash
# Kill processes on ports
npm run kill-ports

# Or manually
lsof -ti:3000 | xargs kill
lsof -ti:5173 | xargs kill
```

#### 7. "PHP memory exhausted"

**Symptoms**: WP-CLI commands fail with memory errors.

**Solutions**:
- Already handled automatically (512M limit set)
- If persists, increase PHP memory in `php.ini`:
  ```ini
  memory_limit = 512M
  ```

#### 8. "WooCommerce pages not in menu"

**Symptoms**: E-commerce sites missing Shop/Cart links.

**Solutions**:
- Check generation completed successfully
- Verify WooCommerce installed: `wp plugin list --path={sitePath}`
- Manually add to menu if needed: `wp menu item add-post {menuId} {pageId}`

### Debug Mode

**Enable verbose logging**:
```bash
LOG_LEVEL=debug npm start
```

**Check specific service logs**:
- Site Generator: Look for `[site-generator]` in logs
- WordPress: Look for `[wordpress]` in logs
- Database: Look for `[database]` in logs

---

## Security Considerations

### Current Security Posture

**Development Environment**: Designed for local use only.

**No Authentication**: All API endpoints are open. For production:
- Add authentication middleware
- Use JWT tokens or session-based auth
- Implement rate limiting

**Password Generation**: WordPress admin passwords are randomly generated (16 characters, alphanumeric + symbols).

**Database Security**: 
- Uses local MySQL with root user (development only)
- For production: Create dedicated MySQL user with limited permissions

**File Permissions**: 
- Site directories: `755` (readable/executable by all, writable by owner)
- WordPress files: Standard WordPress permissions

### Production Deployment Considerations

**Required Changes**:

1. **Authentication**: Add authentication middleware to API routes
2. **HTTPS**: Use SSL/TLS certificates
3. **Environment Variables**: Store secrets securely (not in `.env`)
4. **Database User**: Create dedicated MySQL user with limited permissions
5. **Rate Limiting**: Implement rate limiting on API endpoints
6. **Input Validation**: Already implemented via Zod schemas
7. **SQL Injection**: Prevented by parameterized queries (MySQL2)
8. **XSS**: Prevented by React's automatic escaping

### WordPress Security

**Generated Sites**:
- Use strong admin passwords (auto-generated)
- Install security plugins (currently none, Wordfence removed)
- Keep WordPress updated (manual process)

**Recommendations for Production**:
- Install security plugin (iThemes Security, Sucuri)
- Enable automatic updates
- Use strong passwords
- Limit login attempts
- Enable two-factor authentication

---

## Additional Resources

### Documentation Files

- **`docs/apache-configuration.md`**: Detailed Apache setup guide
- **`docs/wordfence-fix.md`**: Wordfence issue resolution

### Scripts

- **`scripts/start-all.js`**: Main startup script
- **`scripts/configure-apache.sh`**: Apache configuration automation
- **`scripts/fix-wordfence.sh`**: Wordfence removal script

### External Documentation

- **WP-CLI**: https://wp-cli.org/
- **WordPress**: https://wordpress.org/
- **WooCommerce**: https://woocommerce.com/
- **React**: https://react.dev/
- **Express**: https://expressjs.com/
- **TypeScript**: https://www.typescriptlang.org/

---

## Support

For issues, questions, or contributions:
1. Check troubleshooting section
2. Review error logs
3. Check GitHub issues (if applicable)
4. Review code comments for implementation details

---

**Last Updated**: January 29, 2026
**Version**: 1.0.0
**Status**: Production Ready (Local Development)
