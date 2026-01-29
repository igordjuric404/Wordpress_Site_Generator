import type { Job, PreflightResult, SiteConfig, ApiResponse } from '@shared/types';

const API_BASE = '/api';

async function request<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
}

// Sites API
export async function getSites(): Promise<Job[]> {
  const response = await request<Job[]>('/sites');
  return response.data || [];
}

export async function getFailedSites(): Promise<Job[]> {
  const response = await request<Job[]>('/sites/failed');
  return response.data || [];
}

export async function getSite(id: string): Promise<Job & { logs?: any[] }> {
  const response = await request<Job & { logs?: any[] }>(`/sites/${id}`);
  return response.data!;
}

export async function createSite(
  config: SiteConfig & { dryRun?: boolean }
): Promise<Job> {
  const response = await request<Job>('/sites', {
    method: 'POST',
    body: JSON.stringify(config),
  });
  return response.data!;
}

export async function deleteSite(id: string): Promise<void> {
  await request(`/sites/${id}`, { method: 'DELETE' });
}

export async function resumeSite(id: string): Promise<Job> {
  const response = await request<Job>(`/sites/${id}/resume`, {
    method: 'POST',
  });
  return response.data!;
}

export async function cancelSite(id: string): Promise<Job> {
  const response = await request<Job>(`/sites/${id}/cancel`, {
    method: 'POST',
  });
  return response.data!;
}

export async function bulkDeleteSites(jobIds: string[]): Promise<{ deleted: number; failed: number; errors: string[] }> {
  const response = await request<{ deleted: number; failed: number; errors: string[] }>('/sites/bulk-delete', {
    method: 'POST',
    body: JSON.stringify({ jobIds }),
  });
  return response.data!;
}

export async function getJobsByStatus(status: string): Promise<Job[]> {
  const response = await request<Job[]>(`/sites/by-status/${status}`);
  return response.data || [];
}

export async function getNiches(): Promise<
  Array<{
    id: string;
    label: string;
    pages: string[];
    services: string[];
  }>
> {
  const response = await request<
    Array<{
      id: string;
      label: string;
      pages: string[];
      services: string[];
    }>
  >('/sites/niches');
  return response.data || [];
}

// Preflight API
export async function getPreflight(): Promise<PreflightResult> {
  const response = await request<PreflightResult>('/preflight');
  return response.data!;
}

export async function refreshPreflight(): Promise<PreflightResult> {
  const response = await request<PreflightResult>('/preflight/refresh', {
    method: 'POST',
  });
  return response.data!;
}
