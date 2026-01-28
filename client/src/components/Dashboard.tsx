import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Job, PreflightResult } from '@shared/types';
import { getSites, deleteSite, getPreflight, refreshPreflight } from '../api/client';

export default function Dashboard() {
  const navigate = useNavigate();
  const [sites, setSites] = useState<Job[]>([]);
  const [preflight, setPreflight] = useState<PreflightResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [sitesData, preflightData] = await Promise.all([
        getSites(),
        getPreflight(),
      ]);
      setSites(sitesData);
      setPreflight(preflightData);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleRefreshPreflight() {
    try {
      const data = await refreshPreflight();
      setPreflight(data);
    } catch (err) {
      console.error('Failed to refresh preflight:', err);
    }
  }

  async function handleDelete(id: string, businessName: string) {
    if (!confirm(`Delete "${businessName}"? This will remove the WordPress files and database.`)) {
      return;
    }

    setDeleting(id);
    try {
      await deleteSite(id);
      setSites(sites.filter((s) => s.id !== id));
    } catch (err) {
      console.error('Failed to delete site:', err);
      alert('Failed to delete site');
    } finally {
      setDeleting(null);
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  }

  function getStatusBadge(status: Job['status']) {
    const styles: Record<string, string> = {
      completed: 'bg-green-100 text-green-800',
      in_progress: 'bg-blue-100 text-blue-800',
      failed: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-gray-100 text-gray-800',
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status] || styles.pending}`}>
        {status.replace('_', ' ')}
      </span>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Preflight Status */}
      {preflight && (
        <div
          className={`rounded-lg p-4 ${
            preflight.status === 'error'
              ? 'bg-red-50 border border-red-200'
              : preflight.status === 'warning'
              ? 'bg-yellow-50 border border-yellow-200'
              : 'bg-green-50 border border-green-200'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">System Status</h3>
            <button
              onClick={handleRefreshPreflight}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Refresh
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
            <div className="flex items-center gap-2">
              {preflight.checks.wpCliInstalled ? (
                <span className="text-green-600">✓</span>
              ) : (
                <span className="text-red-600">✗</span>
              )}
              <span>WP-CLI {preflight.checks.wpCliVersion || ''}</span>
            </div>
            <div className="flex items-center gap-2">
              {preflight.checks.mysqlConnected ? (
                <span className="text-green-600">✓</span>
              ) : (
                <span className="text-red-600">✗</span>
              )}
              <span>MySQL</span>
            </div>
            <div className="flex items-center gap-2">
              {preflight.checks.apacheRunning ? (
                <span className="text-green-600">✓</span>
              ) : (
                <span className="text-red-600">✗</span>
              )}
              <span>Apache</span>
            </div>
            <div className="flex items-center gap-2">
              {preflight.checks.anthropicKeyValid ? (
                <span className="text-green-600">✓</span>
              ) : (
                <span className="text-yellow-600">⚠</span>
              )}
              <span>AI API</span>
            </div>
            <div className="flex items-center gap-2">
              {preflight.checks.webRootValid ? (
                <span className="text-green-600">✓</span>
              ) : (
                <span className="text-red-600">✗</span>
              )}
              <span>Web Root</span>
            </div>
          </div>

          {preflight.errors.length > 0 && (
            <div className="mt-3 text-sm text-red-700">
              <strong>Errors:</strong>
              <ul className="list-disc list-inside mt-1">
                {preflight.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
              {preflight.errors.some((e) => e.toLowerCase().includes('mysql')) && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="font-medium mb-2">To start MySQL & Apache:</p>
                  <div className="space-y-2 text-xs">
                    <div>
                      <strong>XAMPP Control Panel (Easiest):</strong>
                      <p className="mt-1">1. Press ⌘+Space and type "XAMPP"</p>
                      <p>2. Click "Start" next to MySQL</p>
                      <p>3. Click "Start" next to Apache</p>
                      <p>4. Refresh this page</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {preflight.warnings.length > 0 && (
            <div className="mt-3 text-sm text-yellow-700">
              <strong>Warnings:</strong>
              <ul className="list-disc list-inside mt-1">
                {preflight.warnings.map((warn, i) => (
                  <li key={i}>{warn}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Create New Site Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Recent Sites</h2>
        <Link
          to="/create"
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            preflight?.status === 'error'
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-primary-600 text-white hover:bg-primary-700'
          }`}
          onClick={(e) => {
            if (preflight?.status === 'error') {
              e.preventDefault();
              alert('Please fix system configuration errors before creating sites');
            }
          }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create New Site
        </Link>
      </div>

      {/* Sites List */}
      {sites.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No sites yet</h3>
          <p className="mt-2 text-gray-500">
            Get started by creating your first WordPress site.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <ul className="divide-y divide-gray-200">
            {sites.map((site) => (
              <li
                key={site.id}
                className="p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-medium text-gray-900 truncate">
                        {site.businessName}
                      </h3>
                      {getStatusBadge(site.status)}
                    </div>
                    <div className="mt-1 flex items-center gap-4 text-sm text-gray-500">
                      <span>{formatDate(site.createdAt)}</span>
                      {site.siteUrl && (
                        <a
                          href={site.siteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:text-primary-700"
                        >
                          {site.siteUrl}
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {site.status === 'in_progress' && (
                      <button
                        onClick={() => navigate(`/progress/${site.id}`)}
                        className="px-3 py-1.5 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg"
                      >
                        View Progress
                      </button>
                    )}

                    {site.status === 'completed' && site.siteUrl && (
                      <>
                        <a
                          href={site.siteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
                          title="Open Site"
                        >
                          🌐
                        </a>
                        <a
                          href={`${site.siteUrl}/wp-admin`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
                          title="WordPress Admin"
                        >
                          ⚙️
                        </a>
                      </>
                    )}

                    <button
                      onClick={() => handleDelete(site.id, site.businessName)}
                      disabled={deleting === site.id}
                      className="px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                      title="Delete Site"
                    >
                      {deleting === site.id ? '...' : '🗑️'}
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
