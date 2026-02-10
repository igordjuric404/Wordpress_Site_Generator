import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Job, PreflightResult } from '@shared/types';
import { getSites, getFailedSites, deleteSite, getPreflight, refreshPreflight, bulkDeleteSites } from '../api/client';

// Icons
const IconPlus = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const IconGlobe = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);
const IconSettings = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);
const IconTrash = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);
const IconRefresh = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
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
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const IconAlertTriangle = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
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
const IconSortAsc = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14" /><path d="M5 12l7-7 7 7" />
  </svg>
);
const IconSortDesc = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14" /><path d="M19 12l-7 7-7-7" />
  </svg>
);
const IconChevronLeft = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);
const IconChevronRight = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

// ── Sorting & pagination ────────────────────────────────────────────────────
type SortField = 'name' | 'date';
type SortDirection = 'asc' | 'desc';
interface SortConfig { field: SortField; direction: SortDirection; }

const CARDS_PER_PAGE = 24; // 4 columns x 6 rows

function sortSites(sites: Job[], sort: SortConfig): Job[] {
  return [...sites].sort((a, b) => {
    const cmp = sort.field === 'name'
      ? a.businessName.localeCompare(b.businessName)
      : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    return sort.direction === 'asc' ? cmp : -cmp;
  });
}

// ── Toolbar: sort left, manage right, bulk actions right ─────────────────────
function Toolbar({
  sort, onSortChange,
  showManage, onToggleManage,
  bulkMode, allIds, selectedIds, onSelectAll, onDeselectAll, onBulkDelete, bulkDeleting,
}: {
  sort: SortConfig; onSortChange: (s: SortConfig) => void;
  showManage?: boolean; onToggleManage?: () => void;
  bulkMode: boolean; allIds: string[]; selectedIds: Set<string>;
  onSelectAll: (ids: string[]) => void; onDeselectAll: () => void;
  onBulkDelete: () => void; bulkDeleting: boolean;
}) {
  const allSelected = allIds.length > 0 && allIds.every((id) => selectedIds.has(id));
  function toggleSort(field: SortField) {
    if (sort.field === field) onSortChange({ field, direction: sort.direction === 'asc' ? 'desc' : 'asc' });
    else onSortChange({ field, direction: field === 'date' ? 'desc' : 'asc' });
  }

  return (
    <div className="flex items-center justify-between gap-3 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
      {/* Left: sort buttons */}
      <div className="flex items-center gap-2">
        <button onClick={() => toggleSort('name')}
          className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors ${sort.field === 'name' ? 'font-semibold' : ''}`}
          style={{ background: sort.field === 'name' ? 'var(--color-surface-sunken)' : 'transparent', color: sort.field === 'name' ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)' }}
        >
          Name {sort.field === 'name' && (sort.direction === 'asc' ? <IconSortAsc /> : <IconSortDesc />)}
        </button>
        <button onClick={() => toggleSort('date')}
          className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors ${sort.field === 'date' ? 'font-semibold' : ''}`}
          style={{ background: sort.field === 'date' ? 'var(--color-surface-sunken)' : 'transparent', color: sort.field === 'date' ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)' }}
        >
          Date {sort.field === 'date' && (sort.direction === 'asc' ? <IconSortAsc /> : <IconSortDesc />)}
        </button>
      </div>

      {/* Right: manage toggle + bulk actions */}
      <div className="flex items-center gap-2">
        {bulkMode && (
          <>
            <button onClick={() => (allSelected ? onDeselectAll() : onSelectAll(allIds))} className="px-2 py-1 rounded-md" style={{ color: 'var(--color-text-secondary)' }}>
              {allSelected ? 'Unselect All' : 'Select All'}
            </button>
            {selectedIds.size > 0 && (
              <>
                <button onClick={onDeselectAll} className="px-2 py-1 rounded-md" style={{ color: 'var(--color-text-secondary)' }}>Clear</button>
                <button onClick={onBulkDelete} disabled={bulkDeleting} className="px-2 py-1 rounded-md font-semibold" style={{ color: 'var(--color-error)' }}>
                  {bulkDeleting ? 'Deleting...' : `Delete (${selectedIds.size})`}
                </button>
                <span style={{ color: 'var(--color-text-tertiary)' }}>{selectedIds.size} selected</span>
              </>
            )}
          </>
        )}
        {onToggleManage && (
          <button onClick={onToggleManage} className="px-2 py-1 rounded-md transition-colors"
            style={{ background: showManage ? 'var(--color-surface-sunken)' : 'transparent', color: showManage ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)' }}
          >
            {showManage ? 'Done' : 'Manage'}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Pagination (below the grid) ─────────────────────────────────────────────
function Pagination({ page, totalPages, onPageChange }: { page: number; totalPages: number; onPageChange: (p: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-1 pt-4 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
      <button onClick={() => onPageChange(page - 1)} disabled={page <= 1} className="btn btn-ghost btn-icon" style={{ opacity: page <= 1 ? 0.3 : 1 }}><IconChevronLeft /></button>
      <span>Page {page} of {totalPages}</span>
      <button onClick={() => onPageChange(page + 1)} disabled={page >= totalPages} className="btn btn-ghost btn-icon" style={{ opacity: page >= totalPages ? 0.3 : 1 }}><IconChevronRight /></button>
    </div>
  );
}

// ── Dashboard ───────────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate();
  const [sites, setSites] = useState<Job[]>([]);
  const [failedSites, setFailedSites] = useState<Job[]>([]);
  const [preflight, setPreflight] = useState<PreflightResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [refreshingPreflight, setRefreshingPreflight] = useState(false);

  const [showBulkActions, setShowBulkActions] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [completedSort, setCompletedSort] = useState<SortConfig>({ field: 'date', direction: 'desc' });
  const [completedPage, setCompletedPage] = useState(1);

  const [showFailedBulkActions, setShowFailedBulkActions] = useState(false);
  const [failedSelectedIds, setFailedSelectedIds] = useState<Set<string>>(new Set());
  const [failedBulkDeleting, setFailedBulkDeleting] = useState(false);
  const [failedSort, setFailedSort] = useState<SortConfig>({ field: 'date', direction: 'desc' });
  const [failedPage, setFailedPage] = useState(1);
  const [showFailedSection, setShowFailedSection] = useState(true);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const [sitesData, failedData, preflightData] = await Promise.all([getSites(), getFailedSites(), getPreflight()]);
      setSites(sitesData); setFailedSites(failedData); setPreflight(preflightData);
    } catch (err) { console.error('Failed to load data:', err); }
    finally { setLoading(false); }
  }

  async function handleRefreshPreflight() {
    setRefreshingPreflight(true);
    try { setPreflight(await refreshPreflight()); } catch (err) { console.error(err); }
    finally { setRefreshingPreflight(false); }
  }

  async function handleDelete(e: React.MouseEvent, id: string, businessName: string) {
    e.stopPropagation();
    if (!confirm(`Delete "${businessName}"? This removes WordPress files and database.`)) return;
    setDeleting(id);
    try { await deleteSite(id); setSites((p) => p.filter((s) => s.id !== id)); setFailedSites((p) => p.filter((s) => s.id !== id)); }
    catch { alert('Failed to delete site'); }
    finally { setDeleting(null); }
  }

  async function handleBulkDeleteIds(ids: string[], setDel: (v: boolean) => void, setSel: (v: Set<string>) => void) {
    if (ids.length === 0) return;
    if (!confirm(`Delete ${ids.length} selected sites? Cannot be undone.`)) return;
    setDel(true);
    try { await bulkDeleteSites(ids); setSel(new Set()); await loadData(); }
    catch { alert('Failed to delete sites'); }
    finally { setDel(false); }
  }

  function toggleInSet(set: Set<string>, id: string): Set<string> {
    const n = new Set(set); if (n.has(id)) n.delete(id); else n.add(id); return n;
  }

  function formatDate(d: string) {
    const date = new Date(d), now = new Date(), diff = now.getTime() - date.getTime();
    const m = Math.floor(diff / 60000), h = Math.floor(diff / 3600000), dy = Math.floor(diff / 86400000);
    if (m < 1) return 'Just now'; if (m < 60) return `${m}m ago`; if (h < 24) return `${h}h ago`;
    if (dy === 1) return 'Yesterday'; if (dy < 7) return `${dy}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  const recentSites = sites.filter((s) => s.status !== 'failed');
  const inProgressSites = recentSites.filter((s) => s.status === 'in_progress');
  const completedSites = recentSites.filter((s) => s.status === 'completed');
  const hasSystemError = preflight?.status === 'error';

  const sortedCompleted = useMemo(() => sortSites(completedSites, completedSort), [completedSites, completedSort]);
  const completedTotalPages = Math.max(1, Math.ceil(sortedCompleted.length / CARDS_PER_PAGE));
  const pagedCompleted = sortedCompleted.slice((completedPage - 1) * CARDS_PER_PAGE, completedPage * CARDS_PER_PAGE);

  const sortedFailed = useMemo(() => sortSites(failedSites, failedSort), [failedSites, failedSort]);
  const failedTotalPages = Math.max(1, Math.ceil(sortedFailed.length / CARDS_PER_PAGE));
  const pagedFailed = sortedFailed.slice((failedPage - 1) * CARDS_PER_PAGE, failedPage * CARDS_PER_PAGE);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="w-10 h-10 rounded-full animate-spin-slow" style={{ border: '3px solid var(--color-border)', borderTopColor: 'var(--color-accent)' }} />
        <span className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>Loading...</span>
      </div>
    );
  }

  // ── Site card component ──
  function SiteCard({ site, selected, bulkMode, onSelect, variant }: {
    site: Job; selected: boolean; bulkMode: boolean; onSelect: () => void; variant: 'completed' | 'failed';
  }) {
    return (
      <div
        className={`group rounded-lg cursor-pointer transition-all border hover:shadow-md ${selected ? 'ring-2' : ''}`}
        style={{
          background: 'var(--color-surface-elevated)',
          borderColor: selected ? 'var(--color-accent)' : 'var(--color-border-subtle)',
          ...(selected && { '--tw-ring-color': 'var(--color-accent)' } as React.CSSProperties),
        }}
        onClick={() => {
          if (bulkMode) onSelect();
          else navigate(`/progress/${site.id}`);
        }}
      >
        {/* Top section: name + date */}
        <div className="p-3 pb-2">
          {bulkMode && (
            <input type="checkbox" checked={selected} readOnly className="w-3.5 h-3.5 rounded mb-1.5 block" style={{ accentColor: 'var(--color-accent)' }} />
          )}
          <h3 className="font-medium text-sm truncate mb-0.5" style={{ color: 'var(--color-text-primary)' }}>{site.businessName}</h3>
          <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{formatDate(site.createdAt)}</span>
        </div>

        {/* Bottom section: actions */}
        <div className="pt-1 flex items-center justify-between">
          <div className="flex items-center gap-0.5">
            {variant === 'completed' && site.siteUrl && (
              <>
                <a href={site.siteUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-icon opacity-60 group-hover:opacity-100 transition-opacity" title="Open site" onClick={(e) => e.stopPropagation()}><IconGlobe /></a>
                <a href={`${site.siteUrl}/wp-admin`} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-icon opacity-60 group-hover:opacity-100 transition-opacity" title="WordPress admin" onClick={(e) => e.stopPropagation()}><IconSettings /></a>
              </>
            )}
          </div>
          <button onClick={(e) => handleDelete(e, site.id, site.businessName)} disabled={deleting === site.id} className="btn btn-ghost btn-icon opacity-40 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--color-error)' }} title="Delete">
            {deleting === site.id ? <IconLoader /> : <IconTrash />}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ─── Hero ─── */}
      <section className="animate-slide-up">
        <div className="card-elevated overflow-hidden" style={{ background: hasSystemError ? 'var(--color-surface-elevated)' : 'linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%)' }}>
          <div className="flex items-center justify-between p-6">
            <div>
              <h1 className="text-xl font-bold mb-1" style={{ color: hasSystemError ? 'var(--color-text-primary)' : 'white' }}>WordPress Site Generator</h1>
              <p className="text-sm" style={{ color: hasSystemError ? 'var(--color-text-secondary)' : 'rgba(255,255,255,0.8)' }}>Generate production-ready WordPress sites from professional templates.</p>
            </div>
            <Link to="/create" className={`btn ${hasSystemError ? 'btn-secondary opacity-50 cursor-not-allowed' : ''} px-5 py-2.5 text-sm font-semibold rounded-lg shrink-0`}
              style={hasSystemError ? undefined : { background: 'white', color: '#1e40af', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
              onClick={(e) => { if (hasSystemError) { e.preventDefault(); alert('Fix system errors first'); } }}>
              <IconPlus /> New Site
            </Link>
          </div>
        </div>
      </section>

      {/* ─── In Progress ─── */}
      {inProgressSites.length > 0 && (
        <section className="animate-slide-up stagger-1">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>In Progress</h2>
            <span className="px-2 py-0.5 text-xs font-medium rounded-full" style={{ background: 'var(--color-accent-subtle)', color: 'var(--color-accent)' }}>{inProgressSites.length}</span>
          </div>
          <div className="grid gap-3">
            {inProgressSites.map((site) => (
              <div key={site.id} className="card p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/progress/${site.id}`)} style={{ borderLeft: '3px solid var(--color-accent)' }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-accent-subtle)' }}><IconLoader /></div>
                    <div>
                      <h3 className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{site.businessName}</h3>
                      <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>Started {formatDate(site.createdAt)}</p>
                    </div>
                  </div>
                  <span className="btn btn-primary text-sm">View Progress</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─── Completed Sites (Cards) ─── */}
      <section className="animate-slide-up stagger-2">
        <div className="flex items-center gap-3 mb-3">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>Your Sites</h2>
          {completedSites.length > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium rounded-full" style={{ background: 'var(--color-success-subtle)', color: 'var(--color-success)' }}>{completedSites.length}</span>
          )}
        </div>

        {completedSites.length === 0 ? (
          <div className="card p-12 text-center" style={{ background: 'var(--color-surface-sunken)' }}>
            <h3 className="font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>No sites yet</h3>
            <p className="text-sm mb-4" style={{ color: 'var(--color-text-tertiary)' }}>Create your first WordPress site to get started.</p>
            <Link to="/create" className="btn btn-secondary"><IconPlus /> Create Site</Link>
          </div>
        ) : (
          <div className="space-y-3">
            <Toolbar
              sort={completedSort} onSortChange={(s) => { setCompletedSort(s); setCompletedPage(1); }}
              showManage={showBulkActions} onToggleManage={() => { setShowBulkActions(!showBulkActions); if (showBulkActions) setSelectedIds(new Set()); }}
              bulkMode={showBulkActions} allIds={sortedCompleted.map((s) => s.id)} selectedIds={selectedIds}
              onSelectAll={(ids) => setSelectedIds(new Set(ids))} onDeselectAll={() => setSelectedIds(new Set())}
              onBulkDelete={() => handleBulkDeleteIds(Array.from(selectedIds), setBulkDeleting, setSelectedIds)} bulkDeleting={bulkDeleting}
            />

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {pagedCompleted.map((site) => (
                <SiteCard
                  key={site.id}
                  site={site}
                  selected={selectedIds.has(site.id)}
                  bulkMode={showBulkActions}
                  onSelect={() => setSelectedIds((prev) => toggleInSet(prev, site.id))}
                  variant="completed"
                />
              ))}
            </div>

            <Pagination page={completedPage} totalPages={completedTotalPages} onPageChange={setCompletedPage} />
          </div>
        )}
      </section>

      {/* ─── Failed Generations ─── */}
      {failedSites.length > 0 && (
        <section className="animate-slide-up stagger-3">
          <div className="flex items-center gap-3 mb-3">
            <button onClick={() => setShowFailedSection(!showFailedSection)} className="flex items-center gap-3">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>Failed Generations</h2>
              <span className="px-2 py-0.5 text-xs font-medium rounded-full" style={{ background: 'var(--color-error-subtle)', color: 'var(--color-error)' }}>{failedSites.length}</span>
              <span className={`transition-transform ${showFailedSection ? 'rotate-180' : ''}`}><IconChevronDown /></span>
            </button>
          </div>

          {showFailedSection && (
            <div className="space-y-3 animate-slide-up">
              <Toolbar
                sort={failedSort} onSortChange={(s) => { setFailedSort(s); setFailedPage(1); }}
                showManage={showFailedBulkActions} onToggleManage={() => { setShowFailedBulkActions(!showFailedBulkActions); if (showFailedBulkActions) setFailedSelectedIds(new Set()); }}
                bulkMode={showFailedBulkActions} allIds={sortedFailed.map((s) => s.id)} selectedIds={failedSelectedIds}
                onSelectAll={(ids) => setFailedSelectedIds(new Set(ids))} onDeselectAll={() => setFailedSelectedIds(new Set())}
                onBulkDelete={() => handleBulkDeleteIds(Array.from(failedSelectedIds), setFailedBulkDeleting, setFailedSelectedIds)} bulkDeleting={failedBulkDeleting}
              />

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {pagedFailed.map((site) => (
                  <SiteCard
                    key={site.id}
                    site={site}
                    selected={failedSelectedIds.has(site.id)}
                    bulkMode={showFailedBulkActions}
                    onSelect={() => setFailedSelectedIds((prev) => toggleInSet(prev, site.id))}
                    variant="failed"
                  />
                ))}
              </div>

              <Pagination page={failedPage} totalPages={failedTotalPages} onPageChange={setFailedPage} />
            </div>
          )}
        </section>
      )}

      {/* ─── System Status (bottom) ─── */}
      {preflight && (
        <section className="animate-slide-up stagger-4">
          <div className="card p-4" style={{
            background: preflight.status === 'error' ? 'var(--color-error-subtle)' : preflight.status === 'warning' ? 'var(--color-warning-subtle)' : 'var(--color-surface-elevated)',
            borderColor: preflight.status === 'error' ? 'rgba(220,38,38,0.2)' : preflight.status === 'warning' ? 'rgba(217,119,6,0.2)' : 'var(--color-border-subtle)',
          }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="section-title">System Status</span>
                {preflight.status === 'ready' && <span className="status-badge status-badge-success"><IconCheck /> All Systems Go</span>}
                {preflight.status === 'warning' && <span className="status-badge status-badge-warning"><IconAlertTriangle /> Warning</span>}
                {preflight.status === 'error' && <span className="status-badge status-badge-error"><IconX /> Action Required</span>}
              </div>
              <button onClick={handleRefreshPreflight} disabled={refreshingPreflight} className="btn btn-ghost btn-icon" title="Refresh">
                <span className={refreshingPreflight ? 'animate-spin-slow' : ''}><IconRefresh /></span>
              </button>
            </div>
            <div className="flex flex-wrap gap-4 text-sm">
              {[
                { key: 'wpCli', label: `WP-CLI${preflight.checks.wpCliVersion ? ` ${preflight.checks.wpCliVersion}` : ''}`, ok: preflight.checks.wpCliInstalled },
                { key: 'mysql', label: 'MySQL', ok: preflight.checks.mysqlConnected },
                { key: 'apache', label: 'Apache', ok: preflight.checks.apacheRunning },
                { key: 'ai', label: 'AI API', ok: preflight.checks.anthropicKeyValid, warn: !preflight.checks.anthropicKeyValid },
                { key: 'root', label: 'Web Root', ok: preflight.checks.webRootValid },
              ].map(({ key, label, ok, warn }) => (
                <div key={key} className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{
                  background: ok ? 'var(--color-success-subtle)' : warn ? 'var(--color-warning-subtle)' : 'var(--color-error-subtle)',
                  color: ok ? 'var(--color-success)' : warn ? 'var(--color-warning)' : 'var(--color-error)',
                }}>
                  {ok ? <IconCheck /> : warn ? <IconAlertTriangle /> : <IconX />}
                  <span className="font-medium">{label}</span>
                </div>
              ))}
            </div>
            {preflight.errors.length > 0 && (
              <div className="mt-4 p-4 rounded-lg" style={{ background: 'rgba(220,38,38,0.08)' }}>
                <p className="text-sm font-medium mb-2" style={{ color: 'var(--color-error)' }}>Errors to fix:</p>
                <ul className="space-y-1 text-sm" style={{ color: 'var(--color-text-primary)' }}>
                  {preflight.errors.map((err, i) => <li key={i} className="flex items-start gap-2"><span style={{ color: 'var(--color-error)' }}>•</span>{err}</li>)}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
