import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import type { SiteConfig } from '@shared/types';
import { createSite, getNiches } from '../api/client';

interface FormData extends SiteConfig {
  dryRun?: boolean;
}

interface NicheOption {
  id: string;
  label: string;
  pages: string[];
  services: string[];
}

export default function SiteForm() {
  const navigate = useNavigate();
  const [niches, setNiches] = useState<NicheOption[]>([]);
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
    },
  });

  const selectedNiche = watch('niche');

  useEffect(() => {
    loadNiches();
  }, []);

  async function loadNiches() {
    try {
      const data = await getNiches();
      setNiches(data);
    } catch (err) {
      console.error('Failed to load niches:', err);
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
    <div className="max-w-2xl mx-auto">
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
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New WordPress Site</h1>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit((data) => onSubmit(data, false))} className="space-y-6">
          {/* Business Name */}
          <div>
            <label htmlFor="businessName" className="block text-sm font-medium text-gray-700 mb-1">
              Business Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="businessName"
              {...register('businessName', { required: 'Business name is required' })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Joe's Plumbing"
            />
            {errors.businessName && (
              <p className="mt-1 text-sm text-red-600">{errors.businessName.message}</p>
            )}
          </div>

          {/* Industry/Niche */}
          <div>
            <label htmlFor="niche" className="block text-sm font-medium text-gray-700 mb-1">
              Industry/Niche <span className="text-red-500">*</span>
            </label>
            <select
              id="niche"
              {...register('niche', { required: 'Please select an industry' })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Select an industry...</option>
              {niches.map((niche) => (
                <option key={niche.id} value={niche.id}>
                  {niche.label}
                </option>
              ))}
            </select>
            {errors.niche && (
              <p className="mt-1 text-sm text-red-600">{errors.niche.message}</p>
            )}
            {selectedNiche && niches.find((n) => n.id === selectedNiche) && (
              <p className="mt-1 text-sm text-gray-500">
                Pages: {niches.find((n) => n.id === selectedNiche)?.pages.join(', ')}
              </p>
            )}
          </div>

          {/* Address */}
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
              Business Address <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="address"
              {...register('address', { required: 'Address is required' })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="123 Main St, City, State 12345"
            />
            {errors.address && (
              <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              id="phone"
              {...register('phone', { required: 'Phone number is required' })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="(555) 123-4567"
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address <span className="text-red-500">*</span>
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="contact@business.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          {/* Additional Context */}
          <div>
            <label htmlFor="additionalContext" className="block text-sm font-medium text-gray-700 mb-1">
              Additional Context <span className="text-gray-400">(optional)</span>
            </label>
            <textarea
              id="additionalContext"
              {...register('additionalContext')}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Any additional information about your business that might help generate better content..."
            />
          </div>

          {/* Site Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Site Type</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="standard"
                  {...register('siteType')}
                  className="w-4 h-4 text-primary-600"
                />
                <span>Standard Website</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="ecommerce"
                  {...register('siteType')}
                  className="w-4 h-4 text-primary-600"
                />
                <span>E-commerce Shop</span>
              </label>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Creating...' : 'Generate Site'}
            </button>
            <button
              type="button"
              onClick={handleSubmit((data) => onSubmit(data, true))}
              disabled={submitting}
              className="px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              🧪 Dry Run
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
