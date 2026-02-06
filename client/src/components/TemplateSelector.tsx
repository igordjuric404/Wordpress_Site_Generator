import { useState, useEffect } from 'react';
import type { StarterTemplate } from '@shared/types';
import { getTemplates } from '../api/client';

interface TemplateSelectorProps {
  selectedTemplateId?: string;
  onSelect: (templateId: string) => void;
}

// Icons
const IconLoader = () => (
  <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

const IconExternalLink = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

const IconCheck = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export default function TemplateSelector({
  selectedTemplateId,
  onSelect
}: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<StarterTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setLoading(true);
    setError(null);

    getTemplates()
      .then((data) => {
        setTemplates(data);
        // Auto-select first template if none selected
        if (!selectedTemplateId && data.length > 0) {
          onSelect(data[0].id);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load templates:', err);
        setError('Failed to load templates. Please try again.');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div 
        className="flex items-center justify-center gap-3 p-8"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        <IconLoader />
        <span>Loading templates...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div 
        className="p-4 rounded-lg text-sm"
        style={{ 
          background: 'var(--color-error-subtle)',
          color: 'var(--color-error)'
        }}
      >
        {error}
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div 
        className="p-4 rounded-lg text-sm text-center"
        style={{ background: 'var(--color-surface-sunken)', color: 'var(--color-text-tertiary)' }}
      >
        No templates available
      </div>
    );
  }

  // Filter templates by search term
  const filteredTemplates = searchTerm.trim()
    ? templates.filter((t) =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.category.some((c) => c.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : templates;

  return (
    <div className="template-selector">
      {/* Search filter */}
      <div className="mb-4">
        <input
          type="text"
          className="input text-sm"
          placeholder="Search templates by name or category..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Template count */}
      <div 
        className="mb-3 text-xs"
        style={{ color: 'var(--color-text-tertiary)' }}
      >
        {filteredTemplates.length} free template{filteredTemplates.length !== 1 ? 's' : ''} available
      </div>

      {/* Template grid */}
      <div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        style={{ maxHeight: '520px', overflowY: 'auto', paddingRight: '4px' }}
      >
        {filteredTemplates.map((template) => {
          const isSelected = selectedTemplateId === template.id;
          
          return (
            <div
              key={template.id}
              className="template-card rounded-lg cursor-pointer transition-all overflow-hidden"
              style={{ 
                background: 'var(--color-surface-raised)',
                border: isSelected 
                  ? '2px solid var(--color-accent)' 
                  : '2px solid var(--color-border-subtle)',
                boxShadow: isSelected ? '0 0 0 3px var(--color-accent-subtle)' : undefined,
              }}
              onClick={() => onSelect(template.id)}
            >
              {/* Template Preview Image Placeholder */}
              <div 
                className="h-28 flex items-center justify-center relative"
                style={{ 
                  background: 'linear-gradient(135deg, var(--color-accent-subtle) 0%, var(--color-surface-sunken) 100%)',
                }}
              >
                {/* Selection Indicator */}
                {isSelected && (
                  <div
                    className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ background: 'var(--color-accent)', color: 'white' }}
                  >
                    <IconCheck />
                  </div>
                )}
                
                <span 
                  className="text-sm font-medium"
                  style={{ color: 'var(--color-text-tertiary)' }}
                >
                  {template.name}
                </span>
              </div>

              {/* Template Info */}
              <div className="p-3">
                <h4 
                  className="font-semibold text-sm"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {template.name}
                </h4>
                <p 
                  className="text-xs mt-1 line-clamp-2"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  {template.description}
                </p>
                
                {/* Categories */}
                <div className="flex flex-wrap gap-1 mt-2">
                  {template.category.slice(0, 2).map((cat) => (
                    <span
                      key={cat}
                      className="text-xs px-2 py-0.5 rounded"
                      style={{ 
                        background: 'var(--color-surface-sunken)',
                        color: 'var(--color-text-tertiary)'
                      }}
                    >
                      {cat}
                    </span>
                  ))}
                  <span
                    className="text-xs px-2 py-0.5 rounded"
                    style={{ 
                      background: 'var(--color-surface-sunken)',
                      color: 'var(--color-text-tertiary)'
                    }}
                  >
                    {template.pageBuilder}
                  </span>
                </div>

                {/* Preview Link - external official preview */}
                {template.previewUrl && (
                  <button
                    type="button"
                    className="mt-2 flex items-center gap-1 text-xs font-medium transition-colors"
                    style={{ color: 'var(--color-accent)' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(template.previewUrl!, '_blank', 'noopener,noreferrer');
                    }}
                  >
                    <IconExternalLink />
                    Preview
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredTemplates.length === 0 && searchTerm && (
        <div 
          className="p-4 rounded-lg text-sm text-center mt-2"
          style={{ background: 'var(--color-surface-sunken)', color: 'var(--color-text-tertiary)' }}
        >
          No templates match "{searchTerm}"
        </div>
      )}
    </div>
  );
}
