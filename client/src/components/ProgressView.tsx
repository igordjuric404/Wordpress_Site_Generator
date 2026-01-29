import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import type { Job } from '@shared/types';
import { getSite, cancelSite } from '../api/client';
import { useSSE } from '../hooks/useSSE';

// Icons
const IconArrowLeft = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

const IconCheck = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IconX = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const IconGlobe = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const IconSettings = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const IconCopy = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const IconEye = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const IconEyeOff = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const IconPlus = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const IconLoader = () => (
  <svg className="w-4 h-4 animate-spin-slow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="2" x2="12" y2="6" />
    <line x1="12" y1="18" x2="12" y2="22" />
    <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
    <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
    <line x1="2" y1="12" x2="6" y2="12" />
    <line x1="18" y1="12" x2="22" y2="12" />
    <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
    <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
  </svg>
);

// Vertical Progress Bar Component
interface VerticalProgressBarProps {
  steps: string[];
  currentStep: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled' | 'deleted';
  latestMessage?: string;
}

function VerticalProgressBar({ steps, currentStep, status, latestMessage }: VerticalProgressBarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [lineHeights, setLineHeights] = useState({ track: 0, fill: 0 });
  const isJobComplete = status === 'completed' || status === 'failed' || status === 'cancelled';
  
  function getStepStatus(stepIndex: number): 'completed' | 'in_progress' | 'pending' {
    const stepNumber = stepIndex + 1;
    
    if (stepNumber < currentStep) {
      return 'completed';
    }
    
    if (stepNumber === currentStep) {
      if (isJobComplete) {
        return 'completed';
      }
      return 'in_progress';
    }
    
    return 'pending';
  }

  // Calculate line heights based on actual node positions
  useLayoutEffect(() => {
    if (!containerRef.current) return;
    
    const nodes = containerRef.current.querySelectorAll('.vertical-progress-node');
    if (nodes.length < 2) return;
    
    const firstNode = nodes[0] as HTMLElement;
    const lastNode = nodes[nodes.length - 1] as HTMLElement;
    const containerRect = containerRef.current.getBoundingClientRect();
    
    // Get center positions of first and last nodes
    const firstNodeRect = firstNode.getBoundingClientRect();
    const lastNodeRect = lastNode.getBoundingClientRect();
    
    const firstCenter = firstNodeRect.top + firstNodeRect.height / 2 - containerRect.top;
    const lastCenter = lastNodeRect.top + lastNodeRect.height / 2 - containerRect.top;
    
    // Track goes from first to last node center
    const trackHeight = lastCenter - firstCenter;
    
    // Fill goes from first node to current step node (or end if complete)
    let fillHeight = 0;
    if (currentStep > 0 && nodes.length > 0) {
      const targetIndex = isJobComplete 
        ? nodes.length - 1 
        : Math.min(currentStep - 1, nodes.length - 1);
      const targetNode = nodes[targetIndex] as HTMLElement;
      const targetRect = targetNode.getBoundingClientRect();
      const targetCenter = targetRect.top + targetRect.height / 2 - containerRect.top;
      fillHeight = targetCenter - firstCenter;
    }
    
    setLineHeights({ track: trackHeight, fill: Math.max(0, fillHeight) });
  }, [currentStep, status, steps.length, isJobComplete]);

  return (
    <div className="vertical-progress-container" ref={containerRef}>
      {/* Background track line */}
      <div 
        className="vertical-progress-track" 
        style={{ height: lineHeights.track > 0 ? `${lineHeights.track}px` : undefined }}
      />
      
      {/* Filled progress line */}
      <div 
        className="vertical-progress-fill"
        style={{ 
          height: `${lineHeights.fill}px`,
          transition: 'height 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      />
      
      {/* Step nodes */}
      <div className="vertical-progress-steps">
        {steps.map((stepName, index) => {
          const stepStatus = getStepStatus(index);
          const isCompleted = stepStatus === 'completed';
          const isActive = stepStatus === 'in_progress';

          return (
            <div
              key={index}
              className={`vertical-progress-step ${stepStatus}`}
              style={{
                animationDelay: `${index * 0.05}s`
              }}
            >
              {/* Node container */}
              <div className="vertical-progress-node-wrapper">
                {/* Pulse rings for active step */}
                {isActive && (
                  <>
                    <div className="vertical-progress-pulse-ring pulse-1" />
                    <div className="vertical-progress-pulse-ring pulse-2" />
                  </>
                )}
                
                {/* The node itself */}
                <div 
                  className={`vertical-progress-node ${stepStatus}`}
                  role="listitem"
                  aria-label={`Step ${index + 1}: ${stepName} - ${stepStatus}`}
                  aria-current={isActive ? 'step' : undefined}
                >
                  {isCompleted ? (
                    <IconCheck />
                  ) : isActive ? (
                    <div className="vertical-progress-spinner" />
                  ) : (
                    <span className="vertical-progress-number">{index + 1}</span>
                  )}
                </div>
              </div>
              
              {/* Step label */}
              <div className="vertical-progress-label-container">
                <span className={`vertical-progress-label ${stepStatus}`}>
                  {stepName}
                </span>
              </div>
              
              {/* Completion indicator for completed steps */}
              {isCompleted && (
                <div className="vertical-progress-check-indicator" aria-hidden="true" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ProgressView() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCredentials, setShowCredentials] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [copied, setCopied] = useState(false);

  const { latestEvent, progress, isComplete, error } = useSSE(jobId || null);

  useEffect(() => {
    if (jobId) {
      loadJob();
    }
  }, [jobId]);

  useEffect(() => {
    if (isComplete && jobId) {
      loadJob();
    }
  }, [isComplete, jobId]);

  async function loadJob() {
    try {
      const data = await getSite(jobId!);
      setJob(data);
    } catch (err) {
      console.error('Failed to load job:', err);
    } finally {
      setLoading(false);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleCancel() {
    if (!jobId || !job) return;
    
    if (!confirm(`Cancel generation for "${job.businessName}"? This will stop the process and clean up any partial resources.`)) {
      return;
    }

    setCancelling(true);
    try {
      const updatedJob = await cancelSite(jobId);
      setJob(updatedJob);
      await loadJob();
    } catch (err) {
      console.error('Failed to cancel job:', err);
      alert('Failed to cancel generation');
    } finally {
      setCancelling(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div 
          className="w-10 h-10 rounded-full animate-spin-slow"
          style={{ 
            border: '3px solid var(--color-border)',
            borderTopColor: 'var(--color-accent)'
          }}
        />
        <span className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>Loading...</span>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="text-center py-16 animate-fade-in">
        <div 
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: 'var(--color-surface-sunken)', color: 'var(--color-text-tertiary)' }}
        >
          <IconX />
        </div>
        <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
          Job not found
        </h2>
        <Link to="/" className="btn btn-secondary mt-4">
          <IconArrowLeft />
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const isInProgress = job.status === 'in_progress' || job.status === 'pending';
  const isSuccess = job.status === 'completed';
  const isFailed = job.status === 'failed';
  const isCancelled = job.status === 'cancelled';

  const ALL_STEPS = [
    'Validating configuration',
    'Creating site directory',
    'Creating database',
    'Downloading WordPress',
    'Configuring WordPress',
    'Installing WordPress',
    'Creating homepage',
    'Creating about page',
    'Creating services page',
    'Creating contact page',
    'Installing theme',
    'Installing plugins',
    'Finalizing site',
  ];

  const currentStep = latestEvent?.step ?? job.currentStep ?? 0;

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      {/* Back Button */}
      <button
        onClick={() => navigate('/')}
        className="btn btn-ghost mb-6"
      >
        <IconArrowLeft />
        Dashboard
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Left Column (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status Header - Compact */}
          <div className="card-elevated">
            <div className="p-5">
              <div className="flex items-center justify-between gap-4">
                {/* Left: Status & Info */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {/* Status Icon */}
                  <div 
                    className="relative shrink-0"
                    style={{
                      animation: isInProgress ? 'pulse-ring 1.5s ease-out infinite' : 'none'
                    }}
                  >
                    {isInProgress && (
                      <div 
                        className="absolute inset-0 rounded-xl"
                        style={{
                          background: 'var(--color-accent)',
                          opacity: 0.2,
                          animation: 'pulse-ring 1.5s ease-out infinite'
                        }}
                      />
                    )}
                    <div 
                      className="relative w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ 
                        background: isSuccess 
                          ? 'var(--color-success)'
                          : isFailed 
                          ? 'var(--color-error)'
                          : isCancelled
                          ? 'var(--color-warning)'
                          : 'var(--color-accent)',
                        color: 'white'
                      }}
                    >
                      {isSuccess && <IconCheck />}
                      {isFailed && <IconX />}
                      {isCancelled && <IconX />}
                      {isInProgress && (
                        <div 
                          className="w-5 h-5 rounded-full animate-spin-slow"
                          style={{ 
                            border: '2px solid rgba(255, 255, 255, 0.3)',
                            borderTopColor: 'white'
                          }}
                        />
                      )}
                    </div>
                  </div>

                  {/* Title & Business Name */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 
                        className="text-base font-semibold"
                        style={{ color: 'var(--color-text-primary)' }}
                      >
                        {isSuccess 
                          ? 'Site Generated' 
                          : isFailed 
                          ? 'Generation Failed' 
                          : isCancelled
                          ? 'Generation Cancelled'
                          : 'Generating Site'}
                      </h1>
                      {isSuccess && (
                        <span 
                          className="px-2 py-0.5 text-xs font-medium rounded-md"
                          style={{
                            background: 'var(--color-success-subtle)',
                            color: 'var(--color-success)'
                          }}
                        >
                          Complete
                        </span>
                      )}
                    </div>
                    <p 
                      className="text-sm mt-0.5 truncate"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      {job.businessName}
                    </p>
                  </div>
                </div>

                {/* Right: Progress or Actions */}
                {isInProgress && (
                  <div className="flex items-center gap-4 shrink-0">
                    {/* Progress Info */}
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <span 
                          className="text-lg font-bold tabular-nums"
                          style={{ color: 'var(--color-accent)' }}
                        >
                          {progress}%
                        </span>
                      </div>
                      <div 
                        className="text-xs mt-0.5 truncate max-w-[120px]"
                        style={{ color: 'var(--color-text-tertiary)' }}
                        title={latestEvent?.message || 'Starting...'}
                      >
                        {latestEvent?.message || 'Starting...'}
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="w-24">
                      <div 
                        className="w-full h-2 rounded-full overflow-hidden"
                        style={{ 
                          background: 'var(--color-surface-sunken)'
                        }}
                      >
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ 
                            width: `${progress}%`,
                            background: 'var(--color-accent)'
                          }}
                        />
                      </div>
                    </div>

                    {/* Cancel Button */}
                    <button
                      onClick={handleCancel}
                      disabled={cancelling}
                      className="btn btn-danger btn-icon"
                      title="Cancel generation"
                    >
                      {cancelling ? <IconLoader /> : <IconX />}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Steps Timeline - Vertical Progress Bar */}
          <div className="card-elevated overflow-hidden">
            <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
              <span className="section-title">Generation Pipeline</span>
            </div>
            
            <div className="p-6">
              <VerticalProgressBar
                steps={ALL_STEPS}
                currentStep={currentStep}
                status={job.status}
                latestMessage={latestEvent?.message}
              />
            </div>
          </div>
        </div>

        {/* Sidebar - Right Column (1/3) */}
        <div className="lg:col-span-1 space-y-6">
          {/* Quick Stats */}
          {isInProgress && (
            <div 
              className="card p-6"
              style={{ 
                background: 'linear-gradient(135deg, var(--color-surface-elevated) 0%, var(--color-surface-sunken) 100%)',
                borderColor: 'var(--color-accent)',
                borderWidth: '1px'
              }}
            >
              <span className="section-title block mb-4">Live Stats</span>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                      Progress
                    </span>
                    <span 
                      className="text-2xl font-bold tabular-nums"
                      style={{ color: 'var(--color-accent)' }}
                    >
                      {progress}%
                    </span>
                  </div>
                </div>
                <div className="pt-3" style={{ borderTop: '1px solid var(--color-border-subtle)' }}>
                  <div className="text-xs mb-2" style={{ color: 'var(--color-text-tertiary)' }}>
                    Steps Complete
                  </div>
                  <div className="text-xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                    {currentStep - 1} / {ALL_STEPS.length}
                  </div>
                </div>
                <div className="pt-3" style={{ borderTop: '1px solid var(--color-border-subtle)' }}>
                  <div className="text-xs mb-2" style={{ color: 'var(--color-text-tertiary)' }}>
                    Current Step
                  </div>
                  <div className="text-sm font-medium line-clamp-2" style={{ color: 'var(--color-accent)' }}>
                    {ALL_STEPS[currentStep - 1] || 'Starting...'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Success Content - Credentials & Actions */}
          {isSuccess && (
            <>
              {/* Quick Actions */}
              <div className="card p-6">
                <span className="section-title block mb-4">Quick Actions</span>
                <div className="space-y-2">
                  <a
                    href={job.siteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary w-full justify-start"
                  >
                    <IconGlobe />
                    Open Site
                  </a>
                  <a
                    href={`${job.siteUrl}/wp-admin`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary w-full justify-start"
                  >
                    <IconSettings />
                    WordPress Admin
                  </a>
                  <Link
                    to="/create"
                    className="btn btn-ghost w-full justify-start"
                  >
                    <IconPlus />
                    Create Another Site
                  </Link>
                </div>
              </div>

              {/* Admin Credentials */}
              <div 
                className="card p-6"
                style={{ 
                  background: 'linear-gradient(135deg, var(--color-warning-subtle) 0%, #fef3c7 100%)',
                  borderColor: 'rgba(217, 119, 6, 0.3)'
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                    Admin Access
                  </span>
                  <button
                    onClick={() => setShowCredentials(!showCredentials)}
                    className="btn btn-ghost btn-icon"
                  >
                    {showCredentials ? <IconEyeOff /> : <IconEye />}
                  </button>
                </div>
                <div className="space-y-3">
                  <div>
                    <span className="text-xs font-medium" style={{ color: 'var(--color-text-tertiary)' }}>
                      Username
                    </span>
                    <div className="font-mono text-sm mt-1" style={{ color: 'var(--color-text-primary)' }}>
                      admin
                    </div>
                  </div>
                  <div>
                    <span className="text-xs font-medium" style={{ color: 'var(--color-text-tertiary)' }}>
                      Password
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-mono text-sm flex-1" style={{ color: 'var(--color-text-primary)' }}>
                        {showCredentials ? job.adminPassword : '••••••••••••'}
                      </span>
                      <button
                        onClick={() => copyToClipboard(job.adminPassword || '')}
                        className="btn btn-ghost btn-icon"
                        title="Copy password"
                      >
                        {copied ? <IconCheck /> : <IconCopy />}
                      </button>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() =>
                    copyToClipboard(
                      `URL: ${job.siteUrl}\nAdmin: ${job.siteUrl}/wp-admin\nUsername: admin\nPassword: ${job.adminPassword}`
                    )
                  }
                  className="btn btn-secondary w-full mt-4 text-sm"
                >
                  <IconCopy />
                  Copy All Credentials
                </button>
              </div>
            </>
          )}

          {/* Failed Content */}
          {isFailed && (
            <div className="space-y-4">
              <div 
                className="card p-6"
                style={{ 
                  background: 'var(--color-error-subtle)',
                  borderColor: 'rgba(220, 38, 38, 0.3)'
                }}
              >
                <div className="flex items-start gap-3 mb-4">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: 'var(--color-error)', color: 'white' }}
                  >
                    <IconX />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1" style={{ color: 'var(--color-error)' }}>
                      Generation Failed
                    </h3>
                    <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      {job.error || error || 'An unknown error occurred'}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Link to="/create" className="btn btn-primary w-full">
                    Try Again
                  </Link>
                  <Link to="/" className="btn btn-secondary w-full">
                    Back to Dashboard
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Cancelled Content */}
          {isCancelled && (
            <div className="space-y-4">
              <div 
                className="card p-6"
                style={{ 
                  background: 'var(--color-warning-subtle)',
                  borderColor: 'rgba(217, 119, 6, 0.3)'
                }}
              >
                <div className="flex items-start gap-3 mb-4">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: 'var(--color-warning)', color: 'white' }}
                  >
                    <IconX />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1" style={{ color: 'var(--color-warning)' }}>
                      Generation Cancelled
                    </h3>
                    <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      {job.error || 'Generation was cancelled. Partial resources have been cleaned up.'}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Link to="/create" className="btn btn-primary w-full">
                    <IconPlus />
                    Create New Site
                  </Link>
                  <Link to="/" className="btn btn-secondary w-full">
                    Back to Dashboard
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
