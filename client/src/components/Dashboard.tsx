import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Job, PreflightResult } from '@shared/types';
import { getSites, getFailedSites, deleteSite, resumeSite, getPreflight, refreshPreflight, bulkDeleteSites } from '../api/client';

// Icons
const IconPlus = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
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

const IconTrash = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const IconRefresh = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" />
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>
);

const IconChevronDown = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const IconCheck = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IconX = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const IconAlertTriangle = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const IconPlay = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="5 3 19 12 5 21 5 3" />
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

export default function Dashboard() {
  const navigate = useNavigate();
  const [sites, setSites] = useState<Job[]>([]);
  const [failedSites, setFailedSites] = useState<Job[]>([]);
  const [preflight, setPreflight] = useState<PreflightResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [resuming, setResuming] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showFailedSection, setShowFailedSection] = useState(true);
  const [refreshingPreflight, setRefreshingPreflight] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [sitesData, failedData, preflightData] = await Promise.all([
        getSites(),
        getFailedSites(),
        getPreflight(),
      ]);
      setSites(sitesData);
      setFailedSites(failedData);
      setPreflight(preflightData);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleRefreshPreflight() {
    setRefreshingPreflight(true);
    try {
      const data = await refreshPreflight();
      setPreflight(data);
    } catch (err) {
      console.error('Failed to refresh preflight:', err);
    } finally {
      setRefreshingPreflight(false);
    }
  }

  async function handleDelete(id: string, businessName: string) {
    if (!confirm(`Delete "${businessName}"? This will remove the WordPress files and database.`)) {
      return;
    }

    setDeleting(id);
    try {
      await deleteSite(id);
      setSites((prev) => prev.filter((s) => s.id !== id));
      setFailedSites((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error('Failed to delete site:', err);
      alert('Failed to delete site');
    } finally {
      setDeleting(null);
    }
  }

  async function handleResume(id: string) {
    setResuming(id);
    try {
      const job = await resumeSite(id);
      setFailedSites((prev) => prev.filter((s) => s.id !== id));
      setSites((prev) => {
        const exists = prev.some((s) => s.id === job.id);
        if (exists) {
          return prev.map((s) => (s.id === job.id ? job : s));
        }
        return [job, ...prev];
      });
      navigate(`/progress/${job.id}`);
    } catch (err) {
      console.error('Failed to resume job:', err);
      alert('Failed to resume generation');
    } finally {
      setResuming(null);
    }
  }

  function toggleSelection(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function selectAll(ids: string[]) {
    setSelectedIds(new Set(ids));
  }

  function selectNone() {
    setSelectedIds(new Set());
  }

  async function handleBulkDelete(filter?: 'completed' | 'failed' | 'all', specificIds?: string[]) {
    let idsToDelete: string[] = [];

    if (specificIds) {
      idsToDelete = specificIds;
    } else if (filter) {
      if (filter === 'completed') {
        idsToDelete = recentSites.filter((s) => s.status === 'completed').map((s) => s.id);
      } else if (filter === 'failed') {
        idsToDelete = failedSites.map((s) => s.id);
      } else {
        idsToDelete = [...recentSites.map((s) => s.id), ...failedSites.map((s) => s.id)];
      }
    } else {
      idsToDelete = Array.from(selectedIds);
    }

    if (idsToDelete.length === 0) {
      alert('No sites selected');
      return;
    }

    const filterText = filter === 'completed' ? 'all completed sites' : filter === 'failed' ? 'all failed sites' : filter === 'all' ? 'all sites' : `${idsToDelete.length} selected sites`;
    if (!confirm(`Delete ${filterText}? This will remove WordPress files and databases. This action cannot be undone.`)) {
      return;
    }

    setBulkDeleting(true);
    try {
      const result = await bulkDeleteSites(idsToDelete);
      if (result.failed > 0) {
        alert(`Deleted ${result.deleted} sites. ${result.failed} failed. Check console for details.`);
        console.error('Bulk delete errors:', result.errors);
      } else {
        alert(`Successfully deleted ${result.deleted} sites`);
      }
      setSelectedIds(new Set());
      await loadData();
    } catch (err) {
      console.error('Failed to bulk delete sites:', err);
      alert('Failed to delete sites');
    } finally {
      setBulkDeleting(false);
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function getStatusBadge(status: Job['status']) {
    const config: Record<string, { class: string; label: string; icon?: React.ReactNode }> = {
      completed: { class: 'status-badge-success', label: 'Completed', icon: <IconCheck /> },
      in_progress: { class: 'status-badge-info', label: 'In Progress', icon: <IconLoader /> },
      failed: { class: 'status-badge-error', label: 'Failed', icon: <IconX /> },
      pending: { class: 'status-badge-warning', label: 'Pending' },
      cancelled: { class: 'status-badge-neutral', label: 'Cancelled' },
    };

    const { class: className, label, icon } = config[status] || config.pending;

    return (
      <span className={`status-badge ${className}`}>
        {icon}
        {label}
      </span>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="relative">
          <div 
            className="w-10 h-10 rounded-full animate-spin-slow"
            style={{ 
              border: '3px solid var(--color-border)',
              borderTopColor: 'var(--color-accent)'
            }}
          />
        </div>
        <span className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>Loading...</span>
      </div>
    );
  }

  const recentSites = sites.filter((site) => site.status !== 'failed');
  const inProgressSites = recentSites.filter((site) => site.status === 'in_progress');
  const completedSites = recentSites.filter((site) => site.status === 'completed');
  const hasSystemError = preflight?.status === 'error';

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Section - Create New Site */}
      <section 
        className="card-elevated p-8 text-center animate-slide-up"
        style={{ 
          background: hasSystemError 
            ? 'linear-gradient(135deg, var(--color-surface-elevated) 0%, var(--color-surface-sunken) 100%)'
            : 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)'
        }}
      >
        <div className="max-w-md mx-auto">
          <div 
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ 
              background: hasSystemError ? 'var(--color-surface-sunken)' : 'var(--color-accent)',
              color: hasSystemError ? 'var(--color-text-tertiary)' : 'white',
              boxShadow: hasSystemError ? 'none' : '0 4px 12px rgba(37, 99, 235, 0.3)'
            }}
          >
            <IconGlobe />
          </div>
          <h1 
            className="text-2xl font-semibold mb-2"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Create WordPress Site
          </h1>
          <p 
            className="text-sm mb-6"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Generate a complete WordPress site with AI-powered content, customized for your business.
          </p>
          <Link
            to="/create"
            className={`btn ${hasSystemError ? 'btn-secondary opacity-50 cursor-not-allowed' : 'btn-primary'} px-6 py-3`}
            onClick={(e) => {
              if (hasSystemError) {
                e.preventDefault();
                alert('Please fix system configuration errors before creating sites');
              }
            }}
          >
            <IconPlus />
            New Site
          </Link>
        </div>
      </section>

      {/* System Status - Compact when healthy */}
      {preflight && (
        <section className="animate-slide-up stagger-1">
          <div 
            className={`card p-4 ${preflight.status === 'error' ? '' : preflight.status === 'warning' ? '' : ''}`}
            style={{ 
              background: preflight.status === 'error' 
                ? 'var(--color-error-subtle)' 
                : preflight.status === 'warning' 
                ? 'var(--color-warning-subtle)' 
                : 'var(--color-surface-elevated)',
              borderColor: preflight.status === 'error' 
                ? 'rgba(220, 38, 38, 0.2)' 
                : preflight.status === 'warning' 
                ? 'rgba(217, 119, 6, 0.2)' 
                : 'var(--color-border-subtle)'
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="section-title">System Status</span>
                {preflight.status === 'ok' && (
                  <span className="status-badge status-badge-success">
                    <IconCheck />
                    All Systems Go
                  </span>
                )}
                {preflight.status === 'warning' && (
                  <span className="status-badge status-badge-warning">
                    <IconAlertTriangle />
                    Warning
                  </span>
                )}
                {preflight.status === 'error' && (
                  <span className="status-badge status-badge-error">
                    <IconX />
                    Action Required
                  </span>
                )}
              </div>
              <button
                onClick={handleRefreshPreflight}
                disabled={refreshingPreflight}
                className="btn btn-ghost btn-icon"
                title="Refresh status"
              >
                <span className={refreshingPreflight ? 'animate-spin-slow' : ''}>
                  <IconRefresh />
                </span>
              </button>
            </div>

            <div className="flex flex-wrap gap-4 text-sm">
              {[
                { key: 'wpCliInstalled', label: `WP-CLI${preflight.checks.wpCliVersion ? ` ${preflight.checks.wpCliVersion}` : ''}`, ok: preflight.checks.wpCliInstalled },
                { key: 'mysqlConnected', label: 'MySQL', ok: preflight.checks.mysqlConnected },
                { key: 'apacheRunning', label: 'Apache', ok: preflight.checks.apacheRunning },
                { key: 'anthropicKeyValid', label: 'AI API', ok: preflight.checks.anthropicKeyValid, warn: !preflight.checks.anthropicKeyValid },
                { key: 'webRootValid', label: 'Web Root', ok: preflight.checks.webRootValid },
              ].map(({ key, label, ok, warn }) => (
                <div 
                  key={key}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                  style={{ 
                    background: ok ? 'var(--color-success-subtle)' : warn ? 'var(--color-warning-subtle)' : 'var(--color-error-subtle)',
                    color: ok ? 'var(--color-success)' : warn ? 'var(--color-warning)' : 'var(--color-error)'
                  }}
                >
                  {ok ? <IconCheck /> : warn ? <IconAlertTriangle /> : <IconX />}
                  <span className="font-medium">{label}</span>
                </div>
              ))}
            </div>

            {preflight.errors.length > 0 && (
              <div className="mt-4 p-4 rounded-lg" style={{ background: 'rgba(220, 38, 38, 0.08)' }}>
                <p className="text-sm font-medium mb-2" style={{ color: 'var(--color-error)' }}>
                  Errors to fix:
                </p>
                <ul className="space-y-1 text-sm" style={{ color: 'var(--color-text-primary)' }}>
                  {preflight.errors.map((err, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span style={{ color: 'var(--color-error)' }}>•</span>
                      {err}
                    </li>
                  ))}
                </ul>
                {preflight.errors.some((e) => e.toLowerCase().includes('mysql')) && (
                  <div className="mt-3 p-3 rounded-lg text-xs" style={{ background: 'var(--color-surface-elevated)' }}>
                    <p className="font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>Quick Fix - Start MySQL & Apache:</p>
                    <ol className="space-y-1" style={{ color: 'var(--color-text-secondary)' }}>
                      <li>1. Press ⌘+Space and type "XAMPP"</li>
                      <li>2. Click "Start" next to MySQL</li>
                      <li>3. Click "Start" next to Apache</li>
                      <li>4. Click refresh above</li>
                    </ol>
                  </div>
                )}
              </div>
            )}

            {preflight.warnings.length > 0 && (
              <div className="mt-4 p-4 rounded-lg" style={{ background: 'rgba(217, 119, 6, 0.08)' }}>
                <p className="text-sm font-medium mb-2" style={{ color: 'var(--color-warning)' }}>
                  Warnings:
                </p>
                <ul className="space-y-1 text-sm" style={{ color: 'var(--color-text-primary)' }}>
                  {preflight.warnings.map((warn, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span style={{ color: 'var(--color-warning)' }}>•</span>
                      {warn}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      {/* In Progress Sites */}
      {inProgressSites.length > 0 && (
        <section className="animate-slide-up stagger-2">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              In Progress
            </h2>
            <span 
              className="px-2 py-0.5 text-xs font-medium rounded-full"
              style={{ background: 'var(--color-accent-subtle)', color: 'var(--color-accent)' }}
            >
              {inProgressSites.length}
            </span>
          </div>
          <div className="grid gap-3">
            {inProgressSites.map((site, index) => (
              <div 
                key={site.id} 
                className={`card p-4 animate-slide-up stagger-${index + 1}`}
                style={{ borderLeft: '3px solid var(--color-accent)' }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: 'var(--color-accent-subtle)' }}
                    >
                      <IconLoader />
                    </div>
                    <div>
                      <h3 className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                        {site.businessName}
                      </h3>
                      <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                        Started {formatDate(site.createdAt)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`/progress/${site.id}`)}
                    className="btn btn-primary"
                  >
                    View Progress
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Completed Sites */}
      <section className="animate-slide-up stagger-3">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              Your Sites
            </h2>
            {completedSites.length > 0 && (
              <span 
                className="px-2 py-0.5 text-xs font-medium rounded-full"
                style={{ background: 'var(--color-success-subtle)', color: 'var(--color-success)' }}
              >
                {completedSites.length}
              </span>
            )}
          </div>
          {completedSites.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowBulkActions(!showBulkActions)}
                className="btn btn-ghost text-sm"
              >
                {showBulkActions ? 'Done' : 'Manage'}
              </button>
            </div>
          )}
        </div>

        {completedSites.length === 0 ? (
          <div 
            className="card p-12 text-center"
            style={{ background: 'var(--color-surface-sunken)' }}
          >
            <div 
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: 'var(--color-surface-elevated)', color: 'var(--color-text-tertiary)' }}
            >
              <IconGlobe />
            </div>
            <h3 className="font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
              No sites yet
            </h3>
            <p className="text-sm mb-4" style={{ color: 'var(--color-text-tertiary)' }}>
              Create your first WordPress site to get started.
            </p>
            <Link to="/create" className="btn btn-secondary">
              <IconPlus />
              Create Site
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Bulk Actions Bar */}
            {showBulkActions && (
              <div 
                className="card p-3 flex items-center justify-between animate-slide-up"
                style={{ background: 'var(--color-surface-sunken)' }}
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => selectAll(completedSites.map((s) => s.id))}
                    className="btn btn-ghost text-sm"
                  >
                    Select All
                  </button>
                  {selectedIds.size > 0 && (
                    <>
                      <button
                        onClick={selectNone}
                        className="btn btn-ghost text-sm"
                      >
                        Clear
                      </button>
                      <span className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                        {selectedIds.size} selected
                      </span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {selectedIds.size > 0 && (
                    <button
                      onClick={() => handleBulkDelete()}
                      disabled={bulkDeleting}
                      className="btn btn-danger text-sm"
                    >
                      {bulkDeleting ? 'Deleting...' : `Delete (${selectedIds.size})`}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Sites Grid */}
            <div className="grid gap-3">
              {completedSites.map((site, index) => (
                <div 
                  key={site.id} 
                  className={`card p-4 transition-all ${selectedIds.has(site.id) ? 'ring-2' : ''}`}
                  style={{ 
                    borderLeft: '3px solid var(--color-success)',
                    ...(selectedIds.has(site.id) && { 
                      background: 'var(--color-accent-subtle)',
                      '--tw-ring-color': 'var(--color-accent)'
                    } as React.CSSProperties)
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {showBulkActions && (
                        <input
                          type="checkbox"
                          checked={selectedIds.has(site.id)}
                          onChange={() => toggleSelection(site.id)}
                          className="w-4 h-4 rounded"
                          style={{ accentColor: 'var(--color-accent)' }}
                        />
                      )}
                      <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-semibold"
                        style={{ 
                          background: 'linear-gradient(135deg, var(--color-success-subtle) 0%, #d1fae5 100%)',
                          color: 'var(--color-success)'
                        }}
                      >
                        {site.businessName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                          {site.businessName}
                        </h3>
                        <div className="flex items-center gap-3 text-sm">
                          <span style={{ color: 'var(--color-text-tertiary)' }}>
                            {formatDate(site.createdAt)}
                          </span>
                          {site.siteUrl && (
                            <a
                              href={site.siteUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:underline"
                              style={{ color: 'var(--color-accent)' }}
                            >
                              {site.siteUrl.replace(/^https?:\/\//, '')}
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {site.siteUrl && (
                        <>
                          <a
                            href={site.siteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-ghost btn-icon"
                            title="Open site"
                          >
                            <IconGlobe />
                          </a>
                          <a
                            href={`${site.siteUrl}/wp-admin`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-ghost btn-icon"
                            title="WordPress admin"
                          >
                            <IconSettings />
                          </a>
                        </>
                      )}
                      <button
                        onClick={() => handleDelete(site.id, site.businessName)}
                        disabled={deleting === site.id}
                        className="btn btn-ghost btn-icon"
                        style={{ color: 'var(--color-error)' }}
                        title="Delete site"
                      >
                        {deleting === site.id ? <IconLoader /> : <IconTrash />}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Failed Generations - Collapsible at bottom */}
      {failedSites.length > 0 && (
        <section className="animate-slide-up stagger-4">
          <button
            onClick={() => setShowFailedSection(!showFailedSection)}
            className="flex items-center justify-between w-full p-4 rounded-lg text-left transition-colors hover:bg-opacity-80"
            style={{ 
              background: 'var(--color-error-subtle)',
              color: 'var(--color-error)'
            }}
          >
            <div className="flex items-center gap-3">
              <IconAlertTriangle />
              <span className="font-medium">Failed Generations</span>
              <span 
                className="px-2 py-0.5 text-xs font-medium rounded-full"
                style={{ background: 'rgba(220, 38, 38, 0.15)' }}
              >
                {failedSites.length}
              </span>
            </div>
            <span className={`transition-transform ${showFailedSection ? 'rotate-180' : ''}`}>
              <IconChevronDown />
            </span>
          </button>

          {showFailedSection && (
            <div className="mt-2 space-y-2 animate-slide-up">
              {failedSites.map((site) => (
                <div 
                  key={site.id} 
                  className="card p-4"
                  style={{ borderLeft: '3px solid var(--color-error)' }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <h3 className="font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                          {site.businessName}
                        </h3>
                        {getStatusBadge(site.status)}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm">
                        <span style={{ color: 'var(--color-text-tertiary)' }}>
                          {formatDate(site.createdAt)}
                        </span>
                        {site.error && (
                          <span className="truncate" style={{ color: 'var(--color-error)' }}>
                            {site.error}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleResume(site.id)}
                        disabled={resuming === site.id}
                        className="btn btn-secondary text-sm"
                      >
                        {resuming === site.id ? <IconLoader /> : <IconPlay />}
                        {resuming === site.id ? 'Resuming...' : 'Resume'}
                      </button>
                      <button
                        onClick={() => handleDelete(site.id, site.businessName)}
                        disabled={deleting === site.id}
                        className="btn btn-danger text-sm"
                      >
                        {deleting === site.id ? <IconLoader /> : <IconTrash />}
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              {failedSites.length > 1 && (
                <button
                  onClick={() => handleBulkDelete('failed')}
                  disabled={bulkDeleting}
                  className="w-full btn btn-ghost text-sm justify-center"
                  style={{ color: 'var(--color-error)' }}
                >
                  {bulkDeleting ? 'Deleting...' : `Delete All Failed (${failedSites.length})`}
                </button>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
