import { useState, useEffect, useRef, useLayoutEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import type { Job, SubStep } from '@shared/types';
import { getSite, cancelSite } from '../api/client';
import { useSSE } from '../hooks/useSSE';

// ─── Icons ────────────────────────────────────────────────────────────────────
const IconArrowLeft = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
  </svg>
);
const IconCheck = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const IconX = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const IconGlobe = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);
const IconSettings = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);
const IconCopy = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);
const IconEye = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
  </svg>
);
const IconEyeOff = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);
const IconPlus = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const IconLoader = () => (
  <svg className="w-4 h-4 animate-spin-slow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="2" x2="12" y2="6" /><line x1="12" y1="18" x2="12" y2="22" />
    <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" /><line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
    <line x1="2" y1="12" x2="6" y2="12" /><line x1="18" y1="12" x2="22" y2="12" />
    <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" /><line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
  </svg>
);
const IconChevronDown = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);
const SmallCheck = () => (
  <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const SmallCheckSuccess = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const SmallXError = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// ─── Step definitions with sub-step keywords ─────────────────────────────────
const ALL_STEPS = [
  { label: 'Validating configuration', keywords: ['validat'] },
  { label: 'Creating site directory', keywords: ['site dir', 'directory'] },
  { label: 'Creating database', keywords: ['database'] },
  { label: 'Downloading WordPress', keywords: ['download'] },
  { label: 'Configuring WordPress', keywords: ['wp-config', 'writing wp'] },
  { label: 'Installing WordPress', keywords: ['wordpress installer', 'running wordpress'] },
  { label: 'Installing theme & plugins', keywords: ['theme', 'starter templates plugin', 'builder plugin', 'installing builder'] },
  { label: 'Importing template', keywords: ['importing template', 'upgrading spectra'] },
  { label: 'Customizing content', keywords: ['replacing placeholder', 'setting site title', 'configuring contact', 'tagline', 'blog name', 'homepage set', 'menu'] },
  { label: 'Installing additional plugins', keywords: ['installing plugin:', 'failed optional'] },
  { label: 'Finalizing site', keywords: ['flushing rewrite', 'disabling wp cron', 'enabling page cach', 'configuring woocommerce', 'adding woocommerce', 'seeding sample', 'created.*products', 'site finalized'] },
  { label: 'Security setup', keywords: ['security'] },
  { label: 'AI content generation', keywords: ['ai content', 'ai rewrite', 'ai copywriting', 'ai:', 'rewriting page', 'copy generation'] },
];

const EXCLUDED_MESSAGES = [
  'site generation started',
  'site generation completed',
  'site generation failed',
];

function classifyLog(msg: string): number {
  const lower = msg.toLowerCase();
  if (EXCLUDED_MESSAGES.some((ex) => lower.includes(ex))) return 0;

  // AI step
  if (lower.startsWith('ai:') || lower.includes('ai content') || lower.includes('ai rewrite') ||
      lower.includes('ai copywriting') || lower.includes('rewriting page') ||
      (lower.includes('ai') && lower.includes('skipped')) ||
      lower.includes('additional context') ||
      lower.includes('sending') && lower.includes('batch') && lower.includes('ai') ||
      lower.includes('ai response') || lower.includes('text blocks rewritten') ||
      lower.includes('found') && lower.includes('published pages')) return 13;

  // Spectra upgrade => importing template
  if (lower.includes('upgrading spectra') || lower.includes('spectra beta')) return 8;

  // Finalization
  if (lower.includes('flushing rewrite') || lower.includes('disabling wp cron') ||
      lower.includes('enabling page cach') || lower.includes('site finalized') ||
      lower.includes('configuring woocommerce') || lower.includes('adding woocommerce') ||
      lower.includes('seeding sample') || lower.match(/created.*products/) ||
      lower.includes('cleaning up duplicate') || lower.includes('cleaning up navigation') ||
      lower.includes('disabling admin bar') || lower.includes('detecting template product') ||
      lower.includes('found template product')) return 11;

  // Plugin install (step 10 — matches "installing plugin: contact-form-7" etc.)
  if (lower.includes('installing plugin:') || lower.includes('failed optional')) return 10;

  // Customizing content
  if (lower.includes('replacing placeholder') || lower.includes('setting site title') ||
      lower.includes('configuring contact form')) return 9;

  // Importing template
  if (lower.includes('importing template')) return 8;

  // Theme & plugins (step 7)
  if (lower.includes('installing theme') || lower.includes('starter templates plugin') ||
      lower.includes('installing builder')) return 7;

  // Generic keyword fallback
  for (let i = ALL_STEPS.length - 1; i >= 0; i--) {
    if (ALL_STEPS[i].keywords.some((kw) => {
      if (kw.includes('.*')) return new RegExp(kw).test(lower);
      return lower.includes(kw);
    })) return i + 1;
  }
  return 0;
}

// ─── Vertical Progress Bar ───────────────────────────────────────────────────
interface VerticalProgressBarProps {
  steps: typeof ALL_STEPS;
  currentStep: number;
  status: Job['status'];
  subStepsByStep: Map<number, SubStep[]>;
}

function VerticalProgressBar({ steps, currentStep, status, subStepsByStep }: VerticalProgressBarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [lineHeights, setLineHeights] = useState({ track: 0, fill: 0 });
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());
  const isJobComplete = status === 'completed' || status === 'failed' || status === 'cancelled';

  function getStepStatus(stepIndex: number): 'completed' | 'in_progress' | 'pending' {
    const stepNumber = stepIndex + 1;
    if (stepNumber < currentStep) return 'completed';
    if (stepNumber === currentStep) return isJobComplete ? 'completed' : 'in_progress';
    return 'pending';
  }

  function toggleExpand(stepIndex: number) {
    setExpandedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(stepIndex)) next.delete(stepIndex); else next.add(stepIndex);
      return next;
    });
  }

  // Auto-expand active step
  useEffect(() => {
    if (currentStep > 0 && !isJobComplete) {
      setExpandedSteps((prev) => {
        const next = new Set(prev);
        next.add(currentStep - 1);
        return next;
      });
    }
  }, [currentStep, isJobComplete]);

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const nodes = containerRef.current.querySelectorAll('.vertical-progress-node');
    if (nodes.length < 2) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const firstNode = nodes[0] as HTMLElement;
    const lastNode = nodes[nodes.length - 1] as HTMLElement;
    const firstCenter = firstNode.getBoundingClientRect().top + firstNode.getBoundingClientRect().height / 2 - containerRect.top;
    const lastCenter = lastNode.getBoundingClientRect().top + lastNode.getBoundingClientRect().height / 2 - containerRect.top;
    const trackHeight = lastCenter - firstCenter;
    let fillHeight = 0;
    if (currentStep > 0 && nodes.length > 0) {
      const targetIndex = isJobComplete ? nodes.length - 1 : Math.min(currentStep - 1, nodes.length - 1);
      const targetNode = nodes[targetIndex] as HTMLElement;
      const targetCenter = targetNode.getBoundingClientRect().top + targetNode.getBoundingClientRect().height / 2 - containerRect.top;
      fillHeight = targetCenter - firstCenter;
    }
    setLineHeights({ track: trackHeight, fill: Math.max(0, fillHeight) });
  }, [currentStep, status, steps.length, isJobComplete, expandedSteps]);

  return (
    <div className="vertical-progress-container" ref={containerRef}>
      <div className="vertical-progress-track" style={{ height: lineHeights.track > 0 ? `${lineHeights.track}px` : undefined }} />
      <div className="vertical-progress-fill" style={{ height: `${lineHeights.fill}px`, transition: 'height 0.5s cubic-bezier(0.4, 0, 0.2, 1)' }} />
      <div className="vertical-progress-steps">
        {steps.map((step, index) => {
          const stepStatus = getStepStatus(index);
          const isCompleted = stepStatus === 'completed';
          const isActive = stepStatus === 'in_progress';
          const subs = subStepsByStep.get(index + 1) || [];
          // Only show sub-steps if 2 or more
          const showSubs = subs.length >= 2;
          const isExpanded = expandedSteps.has(index);

          return (
            <div key={index} className={`vertical-progress-step ${stepStatus}`} style={{ animationDelay: `${index * 0.05}s` }}>
              {/* Node */}
              <div className="vertical-progress-node-wrapper">
                {isActive && (
                  <>
                    <div className="vertical-progress-pulse-ring pulse-1" />
                    <div className="vertical-progress-pulse-ring pulse-2" />
                  </>
                )}
                <div className={`vertical-progress-node ${stepStatus}`} role="listitem">
                  {isCompleted ? <IconCheck /> : isActive ? <div className="vertical-progress-spinner" /> : <span className="vertical-progress-number">{index + 1}</span>}
                </div>
              </div>

              {/* Label + chevron */}
              <div className="vertical-progress-label-container" style={{ flex: 1, minWidth: 0 }}>
                <div className="flex items-center gap-2" style={{ minHeight: '24px' }}>
                  <span className={`vertical-progress-label ${stepStatus}`}>
                    {step.label}
                  </span>
                  {showSubs && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); toggleExpand(index); }}
                      className={`flex items-center justify-center w-5 h-5 rounded transition-transform duration-200 shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
                      style={{ color: 'var(--color-text-tertiary)' }}
                    >
                      <IconChevronDown />
                    </button>
                  )}
                </div>

                {/* Expanded sub-steps — no vertical line */}
                {isExpanded && showSubs && (
                  <div className="mt-1.5 ml-1 space-y-0.5 text-xs animate-slide-up">
                    {subs.map((sub, si) => {
                      const subDone = isCompleted || (isActive && si < subs.length - 1);
                      return (
                        <div key={si} className="flex items-center gap-2 py-0.5">
                          <span className="flex items-center justify-center w-3 h-3 shrink-0" style={{
                            color: sub.level === 'error' ? 'var(--color-error)' : sub.level === 'warning' ? 'var(--color-warning)' : 'var(--color-success)',
                          }}>
                            {sub.level === 'error' ? '×' : sub.level === 'warning' ? '!' : subDone ? <SmallCheck /> : <span className="block w-2 h-2 rounded-full" style={{ border: '1.5px solid var(--color-text-tertiary)' }} />}
                          </span>
                          <span style={{ color: sub.level === 'error' ? 'var(--color-error)' : 'var(--color-text-secondary)' }}>
                            {sub.message}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── ProgressView ────────────────────────────────────────────────────────────
export default function ProgressView() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [jobLogs, setJobLogs] = useState<SubStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCredentials, setShowCredentials] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [copied, setCopied] = useState(false);

  const { latestEvent, progress, isComplete, error, currentStep } = useSSE(jobId || null, {
    initialStep: job?.currentStep,
    initialTotalSteps: job?.totalSteps,
    initialStatus: job?.status,
  });

  const loadJob = useCallback(async () => {
    if (!jobId) return;
    try {
      const data = await getSite(jobId);
      setJob(data);
      if ((data as any).logs) {
        setJobLogs(
          ((data as any).logs as Array<{ timestamp: string; level: string; message: string }>).map((l) => ({
            timestamp: l.timestamp,
            level: l.level as SubStep['level'],
            message: l.message,
          }))
        );
      }
    } catch (err) { console.error('Failed to load job:', err); }
    finally { setLoading(false); }
  }, [jobId]);

  useEffect(() => { loadJob(); }, [loadJob]);
  useEffect(() => { if (isComplete && jobId) loadJob(); }, [isComplete, jobId, loadJob]);

  // Merge SSE events into logs in real-time
  useEffect(() => {
    if (latestEvent && latestEvent.message) {
      setJobLogs((prev) => {
        const isDup = prev.some((l) => l.message === latestEvent.message && l.timestamp === latestEvent.timestamp);
        if (isDup) return prev;
        return [...prev, { timestamp: latestEvent.timestamp, level: latestEvent.status === 'failed' ? 'error' : 'info', message: latestEvent.message }];
      });
    }
  }, [latestEvent]);

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleCancel() {
    if (!jobId || !job) return;
    if (!confirm(`Cancel generation for "${job.businessName}"?`)) return;
    setCancelling(true);
    try { setJob(await cancelSite(jobId)); await loadJob(); }
    catch { alert('Failed to cancel generation'); }
    finally { setCancelling(false); }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="w-10 h-10 rounded-full animate-spin-slow" style={{ border: '3px solid var(--color-border)', borderTopColor: 'var(--color-accent)' }} />
        <span className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>Loading...</span>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="text-center py-16 animate-fade-in">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--color-surface-sunken)', color: 'var(--color-text-tertiary)' }}><IconX /></div>
        <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>Job not found</h2>
        <Link to="/" className="btn btn-secondary mt-4"><IconArrowLeft /> Return to Dashboard</Link>
      </div>
    );
  }

  const isInProgress = job.status === 'in_progress' || job.status === 'pending';
  const isSuccess = job.status === 'completed';
  const isFailed = job.status === 'failed';
  const isCancelled = job.status === 'cancelled';

  const subStepsByStep = new Map<number, SubStep[]>();
  for (const log of jobLogs) {
    const step = classifyLog(log.message);
    if (step > 0) {
      const arr = subStepsByStep.get(step) || [];
      arr.push(log);
      subStepsByStep.set(step, arr);
    }
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <button onClick={() => navigate('/')} className="btn btn-ghost mb-6"><IconArrowLeft /> Dashboard</button>

      {/* ─── Header: 3 mini-cards in a row ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {/* Card 1: Title + Status */}
        <div className="card-elevated px-4 py-3 flex items-center gap-3 min-w-0">
          <div className="min-w-0 flex-1">
            <h1 className="text-base font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>{job.businessName}</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              {isSuccess && <><span className="shrink-0" style={{ color: 'var(--color-success)' }}><SmallCheckSuccess /></span><span className="text-xs" style={{ color: 'var(--color-success)' }}>Completed</span></>}
              {isFailed && <><span className="shrink-0" style={{ color: 'var(--color-error)' }}><SmallXError /></span><span className="text-xs" style={{ color: 'var(--color-error)' }}>Failed</span></>}
              {isCancelled && <><span className="shrink-0" style={{ color: 'var(--color-warning)' }}><SmallXError /></span><span className="text-xs" style={{ color: 'var(--color-warning)' }}>Cancelled</span></>}
              {isInProgress && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold tabular-nums" style={{ color: 'var(--color-accent)' }}>{progress}%</span>
                  <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-surface-sunken)' }}>
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: 'var(--color-accent)' }} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Card 2: Admin Credentials */}
        <div className="card-elevated px-4 py-3">
          <span className="text-[10px] uppercase tracking-wider font-medium" style={{ color: 'var(--color-text-tertiary)' }}>Admin Access</span>
          {isSuccess ? (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>admin</span>
              <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>/</span>
              <span className="text-xs font-mono" style={{ color: 'var(--color-text-secondary)' }}>{showCredentials ? job.adminPassword : '••••••'}</span>
              <button onClick={() => setShowCredentials(!showCredentials)} className="btn btn-ghost btn-icon" title={showCredentials ? 'Hide' : 'Show'}>
                {showCredentials ? <IconEyeOff /> : <IconEye />}
              </button>
              <button onClick={() => copyToClipboard(job.adminPassword || '')} className="btn btn-ghost btn-icon" title="Copy password">
                {copied ? <SmallCheck /> : <IconCopy />}
              </button>
            </div>
          ) : (
            <div className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
              {isInProgress ? 'Generating...' : 'Unavailable'}
            </div>
          )}
        </div>

        {/* Card 3: Quick Actions */}
        <div className="card-elevated px-4 py-3">
          <span className="text-[10px] uppercase tracking-wider font-medium" style={{ color: 'var(--color-text-tertiary)' }}>Actions</span>
          <div className="flex items-center gap-1 mt-1">
            {isSuccess && job.siteUrl && (
              <>
                <a href={job.siteUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-icon" title="View site"><IconGlobe /></a>
                <a href={`${job.siteUrl}/wp-admin`} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-icon" title="WP Admin"><IconSettings /></a>
              </>
            )}
            <Link to="/create" className="btn btn-ghost btn-icon" title="New Site"><IconPlus /></Link>
            {isInProgress && (
              <button onClick={handleCancel} disabled={cancelling} className="btn btn-ghost btn-icon" style={{ color: 'var(--color-error)' }} title="Cancel">
                {cancelling ? <IconLoader /> : <IconX />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ─── Pipeline (full width) ─── */}
      <div className="card-elevated overflow-hidden">
        <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
          <span className="section-title">Generation Pipeline</span>
        </div>
        <div className="p-6">
          <VerticalProgressBar steps={ALL_STEPS} currentStep={currentStep} status={job.status} subStepsByStep={subStepsByStep} />
        </div>
      </div>

      {/* Error / Cancelled info below pipeline */}
      {isFailed && (
        <div className="card p-4 mt-4" style={{ background: 'var(--color-error-subtle)', borderColor: 'rgba(220,38,38,0.3)' }}>
          <p className="text-sm" style={{ color: 'var(--color-error)' }}>{job.error || error || 'An unknown error occurred'}</p>
        </div>
      )}
      {isCancelled && (
        <div className="card p-4 mt-4" style={{ background: 'var(--color-warning-subtle)', borderColor: 'rgba(217,119,6,0.3)' }}>
          <p className="text-sm" style={{ color: 'var(--color-warning)' }}>{job.error || 'Generation was cancelled.'}</p>
        </div>
      )}
    </div>
  );
}
