import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import type { SiteConfig } from '@shared/types';
import { createSite, getNiches, getThemes, type ThemeOption } from '../api/client';

interface FormData extends SiteConfig {
  dryRun?: boolean;
}

interface NicheOption {
  id: string;
  label: string;
  pages: string[];
  services: string[];
}

// Icons
const IconArrowLeft = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

const IconRocket = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
    <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
    <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
    <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
  </svg>
);

const IconFlask = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 3h6" />
    <path d="M10 9V3" />
    <path d="M14 9V3" />
    <path d="M6 20.5A3.5 3.5 0 0 1 6 14l2-5h8l2 5a3.5 3.5 0 0 1 0 6.5H6z" />
  </svg>
);

const IconBuilding = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 21h18" />
    <path d="M5 21V7l8-4v18" />
    <path d="M19 21V11l-6-4" />
    <path d="M9 9v.01" />
    <path d="M9 12v.01" />
    <path d="M9 15v.01" />
    <path d="M9 18v.01" />
  </svg>
);

const IconMapPin = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const IconMail = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

const IconLoader = () => (
  <svg className="w-5 h-5 animate-spin-slow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

export default function SiteForm() {
  const navigate = useNavigate();
  const [niches, setNiches] = useState<NicheOption[]>([]);
  const [themes, setThemes] = useState<ThemeOption[]>([]);
  const [defaultTheme, setDefaultTheme] = useState<string>('astra');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      siteType: 'standard',
      theme: 'astra',
    },
  });

  const selectedNiche = watch('niche');
  const selectedNicheData = niches.find((n) => n.id === selectedNiche);
  const selectedTheme = watch('theme');
  const selectedThemeData = themes.find((t) => t.slug === selectedTheme);

  useEffect(() => {
    loadNiches();
    loadThemes();
  }, []);

  async function loadNiches() {
    try {
      const data = await getNiches();
      setNiches(data);
    } catch (err) {
      console.error('Failed to load niches:', err);
    }
  }

  async function loadThemes() {
    try {
      const { themes: themeData, defaultTheme: defaultThemeSlug } = await getThemes();
      setThemes(themeData);
      setDefaultTheme(defaultThemeSlug);
    } catch (err) {
      console.error('Failed to load themes:', err);
    }
  }

  async function onSubmit(data: FormData, dryRun: boolean = false) {
    setSubmitting(true);
    setError(null);

    try {
      const job = await createSite({ ...data, dryRun });
      navigate(`/progress/${job.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create site');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      {/* Back Button */}
      <button
        onClick={() => navigate('/')}
        className="btn btn-ghost mb-6"
      >
        <IconArrowLeft />
        Dashboard
      </button>

      {/* Form Card */}
      <div className="card-elevated overflow-hidden">
        {/* Header */}
        <div 
          className="px-8 py-6"
          style={{ 
            background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
            borderBottom: '1px solid var(--color-border-subtle)'
          }}
        >
          <h1 
            className="text-xl font-semibold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Create New Site
          </h1>
          <p 
            className="text-sm mt-1"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Fill in your business details to generate a WordPress site
          </p>
        </div>

        {/* Error */}
        {error && (
          <div 
            className="mx-6 mt-6 p-4 rounded-lg text-sm"
            style={{ 
              background: 'var(--color-error-subtle)',
              color: 'var(--color-error)',
              border: '1px solid rgba(220, 38, 38, 0.2)'
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit((data) => onSubmit(data, false))} className="p-8">
          {/* Section: Business Information */}
          <div className="space-y-5">
            <div className="flex items-center gap-3 mb-4">
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'var(--color-accent-subtle)', color: 'var(--color-accent)' }}
              >
                <IconBuilding />
              </div>
              <span className="section-title">Business Information</span>
            </div>

            {/* Business Name */}
            <div>
              <label 
                htmlFor="businessName" 
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--color-text-primary)' }}
              >
                Business Name <span style={{ color: 'var(--color-error)' }}>*</span>
              </label>
              <input
                type="text"
                id="businessName"
                {...register('businessName', { required: 'Business name is required' })}
                className="input"
                placeholder="Joe's Plumbing"
              />
              {errors.businessName && (
                <p className="mt-2 text-sm" style={{ color: 'var(--color-error)' }}>
                  {errors.businessName.message}
                </p>
              )}
            </div>

            {/* Industry/Niche */}
            <div>
              <label 
                htmlFor="niche" 
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--color-text-primary)' }}
              >
                Industry <span style={{ color: 'var(--color-error)' }}>*</span>
              </label>
              <select
                id="niche"
                {...register('niche', { required: 'Please select an industry' })}
                className="input"
              >
                <option value="">Select an industry...</option>
                {niches.map((niche) => (
                  <option key={niche.id} value={niche.id}>
                    {niche.label}
                  </option>
                ))}
              </select>
              {errors.niche && (
                <p className="mt-2 text-sm" style={{ color: 'var(--color-error)' }}>
                  {errors.niche.message}
                </p>
              )}
              {selectedNicheData && (
                <div 
                  className="mt-3 p-3 rounded-lg text-sm"
                  style={{ background: 'var(--color-surface-sunken)' }}
                >
                  <span style={{ color: 'var(--color-text-tertiary)' }}>Pages to be created: </span>
                  <span style={{ color: 'var(--color-text-secondary)' }}>
                    {selectedNicheData.pages.join(' • ')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="my-8 border-t" style={{ borderColor: 'var(--color-border-subtle)' }} />

          {/* Section: Contact Details */}
          <div className="space-y-5">
            <div className="flex items-center gap-3 mb-4">
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'var(--color-success-subtle)', color: 'var(--color-success)' }}
              >
                <IconMapPin />
              </div>
              <span className="section-title">Contact Details</span>
            </div>

            {/* Address */}
            <div>
              <label 
                htmlFor="address" 
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--color-text-primary)' }}
              >
                Business Address <span style={{ color: 'var(--color-error)' }}>*</span>
              </label>
              <input
                type="text"
                id="address"
                {...register('address', { required: 'Address is required' })}
                className="input"
                placeholder="123 Main St, City, State 12345"
              />
              {errors.address && (
                <p className="mt-2 text-sm" style={{ color: 'var(--color-error)' }}>
                  {errors.address.message}
                </p>
              )}
            </div>

            {/* Phone & Email Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Phone */}
              <div>
                <label 
                  htmlFor="phone" 
                  className="block text-sm font-medium mb-2"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  Phone <span style={{ color: 'var(--color-error)' }}>*</span>
                </label>
                <input
                  type="tel"
                  id="phone"
                  {...register('phone', { required: 'Phone number is required' })}
                  className="input"
                  placeholder="(555) 123-4567"
                />
                {errors.phone && (
                  <p className="mt-2 text-sm" style={{ color: 'var(--color-error)' }}>
                    {errors.phone.message}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label 
                  htmlFor="email" 
                  className="block text-sm font-medium mb-2"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  Email <span style={{ color: 'var(--color-error)' }}>*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address',
                    },
                  })}
                  className="input"
                  placeholder="contact@business.com"
                />
                {errors.email && (
                  <p className="mt-2 text-sm" style={{ color: 'var(--color-error)' }}>
                    {errors.email.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="my-8 border-t" style={{ borderColor: 'var(--color-border-subtle)' }} />

          {/* Section: Additional Options */}
          <div className="space-y-5">
            <div className="flex items-center gap-3 mb-4">
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'var(--color-warning-subtle)', color: 'var(--color-warning)' }}
              >
                <IconMail />
              </div>
              <span className="section-title">Additional Options</span>
            </div>

            {/* Additional Context */}
            <div>
              <label 
                htmlFor="additionalContext" 
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--color-text-primary)' }}
              >
                Additional Context 
                <span className="ml-2 text-xs font-normal" style={{ color: 'var(--color-text-tertiary)' }}>
                  optional
                </span>
              </label>
              <textarea
                id="additionalContext"
                {...register('additionalContext')}
                rows={3}
                className="input resize-none"
                placeholder="Any additional information about your business that might help generate better content..."
              />
            </div>

            {/* Site Type */}
            <div>
              <label 
                className="block text-sm font-medium mb-3"
                style={{ color: 'var(--color-text-primary)' }}
              >
                Site Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label 
                  className="flex items-center gap-3 p-4 rounded-lg cursor-pointer transition-all"
                  style={{ 
                    background: 'var(--color-surface-sunken)',
                    border: '2px solid transparent'
                  }}
                >
                  <input
                    type="radio"
                    value="standard"
                    {...register('siteType')}
                    className="w-4 h-4"
                    style={{ accentColor: 'var(--color-accent)' }}
                  />
                  <div>
                    <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                      Standard
                    </span>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
                      Business website
                    </p>
                  </div>
                </label>
                <label 
                  className="flex items-center gap-3 p-4 rounded-lg cursor-pointer transition-all"
                  style={{ 
                    background: 'var(--color-surface-sunken)',
                    border: '2px solid transparent'
                  }}
                >
                  <input
                    type="radio"
                    value="ecommerce"
                    {...register('siteType')}
                    className="w-4 h-4"
                    style={{ accentColor: 'var(--color-accent)' }}
                  />
                  <div>
                    <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                      E-commerce
                    </span>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
                      Online shop
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Theme Selection */}
            <div>
              <label 
                htmlFor="theme" 
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--color-text-primary)' }}
              >
                Theme
              </label>
              <select
                id="theme"
                {...register('theme')}
                className="input"
                defaultValue={defaultTheme}
              >
                {themes.map((theme) => (
                  <option key={theme.slug} value={theme.slug}>
                    {theme.name} {theme.recommended ? '(Recommended)' : ''}
                  </option>
                ))}
              </select>
              {selectedThemeData && (
                <div 
                  className="mt-3 p-3 rounded-lg text-sm"
                  style={{ background: 'var(--color-surface-sunken)' }}
                >
                  <p style={{ color: 'var(--color-text-secondary)' }}>
                    {selectedThemeData.description}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedThemeData.features.map((feature, idx) => (
                      <span 
                        key={idx}
                        className="text-xs px-2 py-1 rounded"
                        style={{ 
                          background: 'var(--color-accent-subtle)',
                          color: 'var(--color-accent)'
                        }}
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Submit Buttons */}
          <div 
            className="flex gap-3 mt-8 pt-6"
            style={{ borderTop: '1px solid var(--color-border-subtle)' }}
          >
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary flex-1 py-3"
            >
              {submitting ? <IconLoader /> : <IconRocket />}
              {submitting ? 'Creating...' : 'Generate Site'}
            </button>
            <button
              type="button"
              onClick={handleSubmit((data) => onSubmit(data, true))}
              disabled={submitting}
              className="btn btn-secondary px-5 py-3"
              title="Test configuration without creating files"
            >
              <IconFlask />
              Dry Run
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
