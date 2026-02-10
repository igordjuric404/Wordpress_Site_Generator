#!/usr/bin/env tsx
/**
 * Template Sweep Generator
 *
 * Iterates through every available template in the system, creates a WordPress
 * site for each one via the same API the UI uses, and logs detailed output to
 * per-template log files in logs/.
 *
 * Usage:
 *   npx tsx scripts/template-sweep.ts                 # run all templates
 *   npx tsx scripts/template-sweep.ts --stack spectra  # only Spectra templates
 *   npx tsx scripts/template-sweep.ts --stack classic  # only Classic templates
 *   npx tsx scripts/template-sweep.ts --id 118259      # single template by ID
 *   npx tsx scripts/template-sweep.ts --limit 5        # first 5 templates only
 *
 * Requirements:
 *   - The backend server must be running (npm run server)
 *   - MySQL must be running
 *   - Apache must be running
 */

import fs from 'fs';
import path from 'path';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const API_BASE = process.env.API_BASE || 'http://localhost:3000';
const LOGS_DIR = path.resolve(import.meta.dirname, '..', 'logs');
const POLL_INTERVAL_MS = 3_000;        // How often to check job status
const JOB_TIMEOUT_MS = 10 * 60_000;    // 10 minutes max per site

// Test business info (constant across all runs)
const TEST_BUSINESS = {
  businessName: 'Sweep Test',
  address: '742 Evergreen Terrace, Springfield, IL 62704',
  phone: '(555) 867-5309',
  email: 'sweep@test.local',
};

// ---------------------------------------------------------------------------
// Types (minimal — mirrors shared/types.ts)
// ---------------------------------------------------------------------------

interface Template {
  id: string;
  slug: string;
  name: string;
  builderStack: string;
  category: string[];
}

interface Job {
  id: string;
  status: string;
  currentStep: number;
  totalSteps: number;
  sitePath?: string;
  siteUrl?: string;
  error?: string;
}

interface JobLog {
  level: string;
  message: string;
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function ts(): string {
  return new Date().toISOString();
}

class TemplateLogger {
  private lines: string[] = [];
  private filePath: string;

  constructor(slug: string) {
    this.filePath = path.join(LOGS_DIR, `${slug}.log`);
  }

  log(phase: string, message: string): void {
    const line = `[${ts()}] [${phase.padEnd(18)}] ${message}`;
    this.lines.push(line);
  }

  error(phase: string, message: string): void {
    const line = `[${ts()}] [${phase.padEnd(18)}] ERROR: ${message}`;
    this.lines.push(line);
  }

  section(title: string): void {
    this.lines.push('');
    this.lines.push(`${'='.repeat(72)}`);
    this.lines.push(`  ${title}`);
    this.lines.push(`${'='.repeat(72)}`);
    this.lines.push('');
  }

  flush(): void {
    fs.writeFileSync(this.filePath, this.lines.join('\n') + '\n', 'utf-8');
  }
}

async function apiGet<T>(endpoint: string): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`);
  if (!res.ok) throw new Error(`GET ${endpoint} → ${res.status} ${res.statusText}`);
  const body = await res.json() as { success: boolean; data: T; error?: string };
  if (!body.success) throw new Error(body.error || 'API error');
  return body.data;
}

async function apiPost<T>(endpoint: string, payload: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`POST ${endpoint} → ${res.status} ${res.statusText}: ${text}`);
  }
  const body = await res.json() as { success: boolean; data: T; error?: string };
  if (!body.success) throw new Error(body.error || 'API error');
  return body.data;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function isEcommerce(template: Template): boolean {
  return template.category.some((c) => c.toLowerCase().includes('commerce'));
}

function toSiteName(template: Template): string {
  // Convert template name to underscore-separated lowercase
  return template.name
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .toLowerCase();
}

// ---------------------------------------------------------------------------
// Core: generate one site
// ---------------------------------------------------------------------------

async function generateSite(template: Template, log: TemplateLogger): Promise<{ success: boolean; error?: string; job?: Job }> {
  const siteName = toSiteName(template);
  const ecommerce = isEcommerce(template);
  const themeSlug = template.builderStack === 'spectra' ? 'spectra' : 'astra';

  log.section(`Template: ${template.name} (ID ${template.id})`);
  log.log('config', `Slug:          ${template.slug}`);
  log.log('config', `Builder Stack: ${template.builderStack}`);
  log.log('config', `Theme:         ${themeSlug}`);
  log.log('config', `Categories:    ${template.category.join(', ')}`);
  log.log('config', `eCommerce:     ${ecommerce}`);
  log.log('config', `Site name:     ${siteName}`);

  // 1. Create the site via the API (same path as the UI)
  log.section('Phase: Site Creation');
  let job: Job;
  try {
    job = await apiPost<Job>('/api/sites', {
      ...TEST_BUSINESS,
      businessName: siteName,
      niche: template.category[0] || 'general',
      siteType: ecommerce ? 'ecommerce' : 'standard',
      theme: themeSlug,
      templateId: template.id,
      enableAiContent: false,
      dryRun: false,
    });
    log.log('create', `Job created: ${job.id}`);
    log.log('create', `Status: ${job.status}, Step: ${job.currentStep}/${job.totalSteps}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log.error('create', `Failed to create site: ${msg}`);
    return { success: false, error: msg };
  }

  // 2. Poll until completion or timeout
  log.section('Phase: Polling');
  const deadline = Date.now() + JOB_TIMEOUT_MS;
  let lastStep = 0;
  let seenLogCount = 0;  // Track how many job logs we've already written

  while (Date.now() < deadline) {
    await sleep(POLL_INTERVAL_MS);

    try {
      const status = await apiGet<Job & { logs?: JobLog[] }>(`/api/sites/${job.id}`);
      job = status;

      // Log new step transitions
      if (status.currentStep !== lastStep) {
        log.log('progress', `Step ${status.currentStep}/${status.totalSteps} — ${status.status}`);
        lastStep = status.currentStep;
      }

      // Log only NEW job logs (skip ones we've already seen)
      if (status.logs && status.logs.length > seenLogCount) {
        const newLogs = status.logs.slice(seenLogCount);
        for (const entry of newLogs) {
          log.log(`job:${entry.level}`, entry.message);
        }
        seenLogCount = status.logs.length;
      }

      if (status.status === 'completed') {
        log.log('complete', `Site URL: ${status.siteUrl}`);
        log.log('complete', `Site path: ${status.sitePath}`);
        break;
      }

      if (status.status === 'failed') {
        log.error('failed', `Job failed: ${status.error || 'unknown error'}`);
        return { success: false, error: status.error, job };
      }

      if (status.status === 'cancelled') {
        log.error('cancelled', 'Job was cancelled');
        return { success: false, error: 'Job cancelled', job };
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      log.error('poll', `Poll error: ${msg}`);
      // Continue polling — might be transient
    }
  }

  if (job.status !== 'completed') {
    log.error('timeout', `Job timed out after ${JOB_TIMEOUT_MS / 1000}s`);
    return { success: false, error: 'Timeout', job };
  }

  // 3. Post-generation validation
  log.section('Phase: Validation');
  await validateSite(job, template, log);

  log.flush();
  return { success: true, job };
}

// ---------------------------------------------------------------------------
// Post-generation validation
// ---------------------------------------------------------------------------

async function validateSite(job: Job, template: Template, log: TemplateLogger): Promise<void> {
  if (!job.sitePath) {
    log.error('validate', 'No sitePath on completed job — cannot validate');
    return;
  }

  try {
    // Check installed plugins
    const { stdout: pluginList } = await wpCli(['plugin', 'list', '--status=active', '--format=csv'], job.sitePath);
    log.log('validate:plugins', 'Active plugins:');
    for (const line of pluginList.split('\n').filter(Boolean)) {
      log.log('validate:plugins', `  ${line}`);
    }

    // Check Spectra version if applicable
    if (template.builderStack === 'spectra') {
      const { stdout: spectraVer } = await wpCli(
        ['eval', 'echo defined("UAGB_VER") ? UAGB_VER : "NOT_INSTALLED";'],
        job.sitePath
      );
      log.log('validate:spectra', `Spectra version: ${spectraVer.trim()}`);

      // Check if spectra/* blocks are registered
      const { stdout: blockCount } = await wpCli(
        ['eval', 'echo count(array_filter(array_keys(WP_Block_Type_Registry::get_instance()->get_all_registered()), function($n) { return strpos($n, "spectra/") === 0; }));'],
        job.sitePath
      );
      log.log('validate:spectra', `Registered spectra/* blocks: ${blockCount.trim()}`);
    }

    // Check homepage content rendering
    const { stdout: frontPageId } = await wpCli(['option', 'get', 'page_on_front'], job.sitePath);
    const pageId = frontPageId.trim();

    if (pageId && pageId !== '0') {
      // Get raw post_content block count
      const { stdout: rawBlockCount } = await wpCli(
        ['eval', `$p = get_post(${pageId}); echo substr_count($p->post_content, "<!-- wp:");`],
        job.sitePath
      );
      log.log('validate:content', `Homepage (ID ${pageId}) raw block count: ${rawBlockCount.trim()}`);

      // Check rendered content
      const { stdout: renderedCheck } = await wpCli(
        ['eval', `
$p = get_post(${pageId});
$html = apply_filters("the_content", $p->post_content);
$len = strlen($html);
$has_spectra = strpos($html, "spectra") !== false ? "yes" : "no";
$has_container = strpos($html, "wp-block-spectra-container") !== false ? "yes" : "no";
$has_content_block = strpos($html, "wp-block-spectra-content") !== false ? "yes" : "no";
$has_bg_color = strpos($html, "--spectra-background-color") !== false ? "yes" : "no";
$has_text_color = strpos($html, "--spectra-text-color") !== false ? "yes" : "no";
$has_root_container = strpos($html, "spectra-is-root-container") !== false ? "yes" : "no";

echo "rendered_length=$len\n";
echo "has_spectra_markup=$has_spectra\n";
echo "has_container_divs=$has_container\n";
echo "has_content_blocks=$has_content_block\n";
echo "has_bg_color_css=$has_bg_color\n";
echo "has_text_color_css=$has_text_color\n";
echo "has_root_container=$has_root_container\n";

// Count missing block types (blocks in content but not rendered)
$missing = 0;
preg_match_all('/<!-- wp:(\\S+)/', $p->post_content, $m);
$block_types = array_unique($m[1]);
$registry = WP_Block_Type_Registry::get_instance();
foreach ($block_types as $bt) {
    if (!$registry->is_registered($bt)) {
        echo "UNREGISTERED_BLOCK=$bt\n";
        $missing++;
    }
}
echo "unregistered_block_count=$missing\n";
`],
        job.sitePath
      );
      log.log('validate:render', 'Homepage render analysis:');
      for (const line of renderedCheck.trim().split('\n').filter(Boolean)) {
        log.log('validate:render', `  ${line}`);
      }
    } else {
      log.log('validate:content', 'No static front page set — using default blog');
    }

    // Check page list
    const { stdout: pageList } = await wpCli(
      ['post', 'list', '--post_type=page', '--post_status=publish', '--format=csv', '--fields=ID,post_title,post_name'],
      job.sitePath
    );
    log.log('validate:pages', 'Published pages:');
    for (const line of pageList.split('\n').filter(Boolean)) {
      log.log('validate:pages', `  ${line}`);
    }

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log.error('validate', `Validation failed: ${msg}`);
  }
}

async function wpCli(args: string[], sitePath: string): Promise<{ stdout: string }> {
  const { execaCommand } = await import('execa');
  // Build a safe shell command for wp-cli
  const escaped = args.map((a) => {
    if (a.includes(' ') || a.includes('"') || a.includes("'") || a.includes('\n') || a.includes('$') || a.includes(';')) {
      // Write multi-line args (like PHP code) to a temp approach using single-quote escaping
      return `'${a.replace(/'/g, "'\\''")}'`;
    }
    return a;
  });
  const cmd = `wp ${escaped.join(' ')} --path=${sitePath}`;
  const result = await execaCommand(cmd, { shell: true, timeout: 60_000 });
  return { stdout: result.stdout };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  // Parse args
  const args = process.argv.slice(2);
  let filterStack: string | null = null;
  let filterId: string | null = null;
  let limit: number | null = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--stack' && args[i + 1]) { filterStack = args[++i]; }
    if (args[i] === '--id' && args[i + 1]) { filterId = args[++i]; }
    if (args[i] === '--limit' && args[i + 1]) { limit = parseInt(args[++i], 10); }
  }

  // Ensure logs dir exists
  fs.mkdirSync(LOGS_DIR, { recursive: true });

  // Fetch templates from the running server
  console.log(`\n  Template Sweep Generator`);
  console.log(`  ${'─'.repeat(40)}\n`);

  let templates: Template[];
  try {
    if (filterStack) {
      templates = await apiGet<Template[]>(`/api/sites/templates?stack=${filterStack}`);
    } else {
      templates = await apiGet<Template[]>('/api/sites/templates');
    }
  } catch (err) {
    console.error(`  ERROR: Cannot reach API at ${API_BASE}. Is the server running?`);
    console.error(`  ${err instanceof Error ? err.message : err}`);
    process.exit(1);
  }

  if (filterId) {
    templates = templates.filter((t) => t.id === filterId);
  }
  if (limit && limit > 0) {
    templates = templates.slice(0, limit);
  }

  console.log(`  Templates to process: ${templates.length}`);
  console.log(`  Logs directory: ${LOGS_DIR}`);
  console.log(`  Filter: stack=${filterStack || 'all'}, id=${filterId || 'all'}, limit=${limit || 'none'}\n`);

  // Summary file
  const summaryLog = new TemplateLogger('_sweep_summary');
  summaryLog.section(`Template Sweep — ${ts()}`);
  summaryLog.log('config', `Total templates: ${templates.length}`);
  summaryLog.log('config', `Filter: stack=${filterStack || 'all'}, id=${filterId || 'all'}`);

  const results: { template: Template; success: boolean; error?: string; elapsed: number }[] = [];

  for (let i = 0; i < templates.length; i++) {
    const template = templates[i];
    const templateLog = new TemplateLogger(template.slug);
    const startTime = Date.now();

    const prefix = `  [${String(i + 1).padStart(3)}/${templates.length}]`;
    process.stdout.write(`${prefix} ${template.name.padEnd(35)} `);

    const result = await generateSite(template, templateLog);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    templateLog.flush();

    if (result.success) {
      console.log(`OK  (${elapsed}s)`);
      summaryLog.log('result', `OK   ${template.slug} (${elapsed}s)`);
    } else {
      console.log(`FAIL (${elapsed}s) — ${result.error?.substring(0, 80)}`);
      summaryLog.log('result', `FAIL ${template.slug} (${elapsed}s) — ${result.error}`);
    }

    results.push({ template, success: result.success, error: result.error, elapsed: parseFloat(elapsed) });
  }

  // Print summary
  const passed = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;
  const totalTime = results.reduce((sum, r) => sum + r.elapsed, 0).toFixed(0);

  console.log(`\n  ${'─'.repeat(40)}`);
  console.log(`  Results: ${passed} OK, ${failed} FAIL (${totalTime}s total)`);

  if (failed > 0) {
    console.log(`\n  Failed templates:`);
    for (const r of results.filter((r) => !r.success)) {
      console.log(`    - ${r.template.name}: ${r.error}`);
    }
  }

  console.log(`\n  Detailed logs: ${LOGS_DIR}/`);
  console.log(`  Summary log:   ${LOGS_DIR}/_sweep_summary.log\n`);

  summaryLog.section('Summary');
  summaryLog.log('summary', `Passed: ${passed}`);
  summaryLog.log('summary', `Failed: ${failed}`);
  summaryLog.log('summary', `Total time: ${totalTime}s`);
  summaryLog.flush();

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(2);
});
