import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs-extra';
import type { Job, JobStatus } from '../../shared/types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '../../data');
const DB_PATH = path.join(DATA_DIR, 'jobs.db');

let db: Database.Database;

export function initDatabase(): void {
  // Ensure data directory exists
  fs.ensureDirSync(DATA_DIR);

  db = new Database(DB_PATH);
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      business_name TEXT NOT NULL,
      niche TEXT NOT NULL,
      site_type TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('pending', 'in_progress', 'completed', 'failed', 'cancelled', 'deleted')),
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
    
    CREATE TABLE IF NOT EXISTS job_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      level TEXT NOT NULL CHECK(level IN ('info', 'warning', 'error')),
      message TEXT NOT NULL,
      metadata TEXT,
      FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
    );
    
    CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
    CREATE INDEX IF NOT EXISTS idx_jobs_created ON jobs(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_job_logs_job_id ON job_logs(job_id);
  `);
}

export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

// Convert database row to Job type
function rowToJob(row: any): Job {
  return {
    id: row.id,
    businessName: row.business_name,
    niche: row.niche,
    siteType: row.site_type,
    status: row.status,
    currentStep: row.current_step,
    totalSteps: row.total_steps,
    sitePath: row.site_path || undefined,
    siteUrl: row.site_url || undefined,
    dbName: row.db_name || undefined,
    adminPassword: row.admin_password || undefined,
    aiCostUsd: row.ai_cost_usd,
    aiTokensInput: row.ai_tokens_input,
    aiTokensOutput: row.ai_tokens_output,
    createdAt: row.created_at,
    startedAt: row.started_at || undefined,
    completedAt: row.completed_at || undefined,
    error: row.error || undefined,
  };
}

export function createJob(job: {
  id: string;
  businessName: string;
  niche: string;
  siteType: 'standard' | 'ecommerce';
  totalSteps: number;
}): Job {
  const stmt = getDatabase().prepare(`
    INSERT INTO jobs (id, business_name, niche, site_type, status, total_steps, created_at)
    VALUES (?, ?, ?, ?, 'pending', ?, ?)
  `);
  
  const createdAt = new Date().toISOString();
  stmt.run(job.id, job.businessName, job.niche, job.siteType, job.totalSteps, createdAt);
  
  return {
    id: job.id,
    businessName: job.businessName,
    niche: job.niche as any,
    siteType: job.siteType,
    status: 'pending',
    currentStep: 0,
    totalSteps: job.totalSteps,
    aiCostUsd: 0,
    aiTokensInput: 0,
    aiTokensOutput: 0,
    createdAt,
  };
}

export function getJob(jobId: string): Job | null {
  const stmt = getDatabase().prepare('SELECT * FROM jobs WHERE id = ?');
  const row = stmt.get(jobId);
  return row ? rowToJob(row) : null;
}

export function updateJobProgress(jobId: string, step: number, status?: JobStatus): void {
  const updates: string[] = ['current_step = ?'];
  const values: any[] = [step];
  
  if (status) {
    updates.push('status = ?');
    values.push(status);
    
    if (status === 'in_progress') {
      updates.push('started_at = ?');
      values.push(new Date().toISOString());
    } else if (status === 'completed' || status === 'failed') {
      updates.push('completed_at = ?');
      values.push(new Date().toISOString());
    }
  }
  
  values.push(jobId);
  
  const stmt = getDatabase().prepare(`
    UPDATE jobs SET ${updates.join(', ')} WHERE id = ?
  `);
  stmt.run(...values);
}

export function updateJobStatus(jobId: string, status: JobStatus, error?: string): void {
  const updates: string[] = ['status = ?'];
  const values: any[] = [status];
  
  if (error) {
    updates.push('error = ?');
    values.push(error);
  }
  
  if (status === 'completed' || status === 'failed') {
    updates.push('completed_at = ?');
    values.push(new Date().toISOString());
  }
  
  values.push(jobId);
  
  const stmt = getDatabase().prepare(`
    UPDATE jobs SET ${updates.join(', ')} WHERE id = ?
  `);
  stmt.run(...values);
}

export function updateJobSiteInfo(
  jobId: string,
  info: { sitePath?: string; siteUrl?: string; dbName?: string; adminPassword?: string }
): void {
  const updates: string[] = [];
  const values: any[] = [];
  
  if (info.sitePath !== undefined) {
    updates.push('site_path = ?');
    values.push(info.sitePath);
  }
  if (info.siteUrl !== undefined) {
    updates.push('site_url = ?');
    values.push(info.siteUrl);
  }
  if (info.dbName !== undefined) {
    updates.push('db_name = ?');
    values.push(info.dbName);
  }
  if (info.adminPassword !== undefined) {
    updates.push('admin_password = ?');
    values.push(info.adminPassword);
  }
  
  if (updates.length === 0) return;
  
  values.push(jobId);
  
  const stmt = getDatabase().prepare(`
    UPDATE jobs SET ${updates.join(', ')} WHERE id = ?
  `);
  stmt.run(...values);
}

export function updateJobAiCost(jobId: string, inputTokens: number, outputTokens: number, costUsd: number): void {
  const stmt = getDatabase().prepare(`
    UPDATE jobs 
    SET ai_tokens_input = ai_tokens_input + ?, 
        ai_tokens_output = ai_tokens_output + ?,
        ai_cost_usd = ai_cost_usd + ?
    WHERE id = ?
  `);
  stmt.run(inputTokens, outputTokens, costUsd, jobId);
}

export function getRecentJobs(limit: number = 20): Job[] {
  const stmt = getDatabase().prepare(`
    SELECT * FROM jobs 
    WHERE status != 'deleted'
    ORDER BY created_at DESC 
    LIMIT ?
  `);
  const rows = stmt.all(limit);
  return rows.map(rowToJob);
}

export function getFailedJobs(): Job[] {
  const stmt = getDatabase().prepare(`
    SELECT * FROM jobs 
    WHERE status = 'failed'
    ORDER BY created_at DESC
  `);
  const rows = stmt.all();
  return rows.map(rowToJob);
}

export function addJobLog(
  jobId: string,
  level: 'info' | 'warning' | 'error',
  message: string,
  metadata?: Record<string, any>
): void {
  const stmt = getDatabase().prepare(`
    INSERT INTO job_logs (job_id, timestamp, level, message, metadata)
    VALUES (?, ?, ?, ?, ?)
  `);
  stmt.run(jobId, new Date().toISOString(), level, message, metadata ? JSON.stringify(metadata) : null);
}

export function getJobLogs(jobId: string): Array<{
  timestamp: string;
  level: string;
  message: string;
  metadata?: Record<string, any>;
}> {
  const stmt = getDatabase().prepare(`
    SELECT timestamp, level, message, metadata
    FROM job_logs
    WHERE job_id = ?
    ORDER BY timestamp ASC
  `);
  const rows = stmt.all(jobId) as any[];
  return rows.map((row) => ({
    timestamp: row.timestamp,
    level: row.level,
    message: row.message,
    metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
  }));
}
