import { Routes, Route, useLocation } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import SiteForm from './components/SiteForm';
import ProgressView from './components/ProgressView';

export default function App() {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-surface)' }}>
      {/* Header */}
      <header 
        className="sticky top-0 z-50 backdrop-blur-md"
        style={{ 
          background: 'rgba(255, 255, 255, 0.85)',
          borderBottom: '1px solid var(--color-border-subtle)'
        }}
      >
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <a href="/" className="flex items-center gap-3 group">
              {/* Logo */}
              <div 
                className="relative w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden transition-transform duration-200 group-hover:scale-105"
                style={{ 
                  background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                  boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)'
                }}
              >
                <svg
                  className="w-5 h-5 text-white"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M2 12h20" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
              </div>
              
              {/* Title */}
              <div className="flex flex-col">
                <span 
                  className="text-lg font-semibold tracking-tight"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  WP Generator
                </span>
                <span 
                  className="text-xs font-medium"
                  style={{ color: 'var(--color-text-tertiary)' }}
                >
                  Local WordPress Sites
                </span>
              </div>
            </a>

            {/* Header Actions */}
            {!isHome && (
              <a 
                href="/"
                className="btn btn-ghost text-sm"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                Dashboard
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/create" element={<SiteForm />} />
          <Route path="/progress/:jobId" element={<ProgressView />} />
        </Routes>
      </main>

      {/* Footer */}
      <footer 
        className="mt-auto py-6 text-center text-xs"
        style={{ color: 'var(--color-text-tertiary)' }}
      >
        <p>WordPress Site Generator &middot; Local Development Tool</p>
      </footer>
    </div>
  );
}
