import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import type { Job } from '@shared/types';
import { getSite } from '../api/client';
import { useSSE } from '../hooks/useSSE';

export default function ProgressView() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCredentials, setShowCredentials] = useState(false);

  const { events, latestEvent, progress, isComplete, error } = useSSE(jobId || null);

  useEffect(() => {
    if (jobId) {
      loadJob();
    }
  }, [jobId]);

  useEffect(() => {
    // Reload job data when complete to get final info
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
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">Job not found</h2>
        <Link to="/" className="text-primary-600 hover:underline mt-2 block">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const isInProgress = job.status === 'in_progress' || job.status === 'pending';
  const isSuccess = job.status === 'completed';
  const isFailed = job.status === 'failed';

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => navigate('/')}
          className="text-gray-600 hover:text-gray-900 flex items-center gap-1"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          {isSuccess && (
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
          {isFailed && (
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          )}
          {isInProgress && (
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isSuccess ? 'Site Generated Successfully!' : isFailed ? 'Generation Failed' : `Generating: ${job.businessName}`}
            </h1>
            <p className="text-gray-500">{job.businessName}</p>
          </div>
        </div>

        {/* Progress Bar */}
        {isInProgress && (
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>{latestEvent?.message || 'Starting...'}</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-primary-600 h-3 rounded-full transition-all duration-500 animate-progress-pulse"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Success Content */}
        {isSuccess && (
          <div className="space-y-6">
            {/* Site Info */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div>
                <span className="text-sm text-gray-500">Location</span>
                <p className="font-mono text-sm">{job.sitePath}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">URL</span>
                <p>
                  <a
                    href={job.siteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:underline"
                  >
                    {job.siteUrl}
                  </a>
                </p>
              </div>
            </div>

            {/* Admin Credentials */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-900">Admin Credentials</h3>
                <button
                  onClick={() => setShowCredentials(!showCredentials)}
                  className="text-sm text-primary-600 hover:underline"
                >
                  {showCredentials ? 'Hide' : 'Show'}
                </button>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 w-20">Username:</span>
                  <span className="font-mono">admin</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 w-20">Password:</span>
                  <span className="font-mono">
                    {showCredentials ? job.adminPassword : '••••••••••••'}
                  </span>
                  <button
                    onClick={() => copyToClipboard(job.adminPassword || '')}
                    className="text-primary-600 hover:text-primary-700"
                    title="Copy password"
                  >
                    📋
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-3">
              <a
                href={job.siteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Open in Browser
              </a>
              <a
                href={`${job.siteUrl}/wp-admin`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                WordPress Admin
              </a>
              <button
                onClick={() =>
                  copyToClipboard(
                    `URL: ${job.siteUrl}\nAdmin: ${job.siteUrl}/wp-admin\nUsername: admin\nPassword: ${job.adminPassword}`
                  )
                }
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Copy All Credentials
              </button>
            </div>

            {/* Next Steps */}
            <div className="border-t pt-4">
              <h3 className="font-medium text-gray-900 mb-2">Next Steps</h3>
              <ol className="list-decimal list-inside text-sm text-gray-600 space-y-1">
                <li>Review and customize the generated content</li>
                <li>Add your logo and brand assets</li>
                <li>Configure contact form settings</li>
                <li>Export to your hosting provider when ready</li>
              </ol>
            </div>

            <div className="flex justify-center pt-4">
              <Link
                to="/create"
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Create Another Site
              </Link>
            </div>
          </div>
        )}

        {/* Failed Content */}
        {isFailed && (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700">{job.error || error || 'An unknown error occurred'}</p>
            </div>
            <div className="flex gap-3">
              <Link
                to="/create"
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Try Again
              </Link>
              <Link
                to="/"
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        )}

        {/* Real-time Log */}
        {events.length > 0 && (
          <div className="mt-6 border-t pt-4">
            <h3 className="font-medium text-gray-900 mb-3">Activity Log</h3>
            <div className="bg-gray-900 rounded-lg p-4 max-h-64 overflow-y-auto font-mono text-sm">
              {events.map((event, index) => (
                <div
                  key={index}
                  className={`animate-slide-in ${
                    event.status === 'failed' ? 'text-red-400' : 'text-green-400'
                  }`}
                >
                  <span className="text-gray-500">
                    [{new Date(event.timestamp).toLocaleTimeString()}]
                  </span>{' '}
                  {event.message}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
