import useSWR from 'swr';
import { cookies } from 'next/headers';

let API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/v1';

if (!API_URL.endsWith('/v1')) {
  API_URL = API_URL.replace(/\/+$/, '') + '/v1';
}

export const fetcher = async (url: string) => {
  let token = '';
  if (typeof document !== 'undefined') {
    const match = document.cookie.match(new RegExp('(^| )access_token=([^;]+)'));
    if (match) token = match[2];
  }

  try {
    const res = await fetch(`${API_URL}${url}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'x-dashboard-bypass': 'true',
      },
    });

    if (!res.ok) {
      console.error(`SWR API Error on ${url}: ${res.status}`);
      throw new Error('API request failed');
    }

    return res.json();
  } catch (err) {
    console.error(`SWR Network Error on ${url}:`, err);
    throw err;
  }
};

export function useGigWorkersStats() {
  const { data, error, isLoading } = useSWR('/analytics/gig-workers', fetcher, {
    refreshInterval: 5000, // Poll every 5s for real-time feel
  });
  return { data, error, isLoading };
}

export function useGigWorkerDetail(id: string) {
  const { data, error, isLoading, mutate } = useSWR(`/analytics/gig-workers/${id}`, fetcher, {
    refreshInterval: 5000,
  });
  return { data, error, isLoading, mutate };
}

export function useDashboardStats() {
  const { data, error, isLoading } = useSWR('/analytics/dashboard-stats', fetcher, {
    refreshInterval: 5000,
  });
  return { data, error, isLoading };
}

export function useRecentConversions() {
  const { data, error, isLoading } = useSWR('/analytics/conversions', fetcher, {
    refreshInterval: 5000,
  });
  return { data, error, isLoading };
}

export function useCustomers() {
  const { data, error, isLoading, mutate } = useSWR('/leads', fetcher, {
    refreshInterval: 10000, // Live refresh every 10s
  });
  return { data, error, isLoading, mutate };
}

export function useCustomerDetail(id: string) {
  const { data, error, isLoading, mutate } = useSWR(id ? `/leads/${id}` : null, fetcher, {
    refreshInterval: 0, // Don't auto-refresh — only refresh after edits
  });
  return { data, error, isLoading, mutate };
}

/**
 * PATCH /leads/:id — update any subset of lead fields.
 * Used by the dashboard's inline edit panel.
 */
export async function patchLead(id: string, fields: Record<string, any>): Promise<void> {
  let token = '';
  if (typeof document !== 'undefined') {
    const match = document.cookie.match(new RegExp('(^| )access_token=([^;]+)'));
    if (match) token = match[2];
  }

  const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/v1').replace(/\/+$/, '').replace(/\/v1$/, '') + '/v1';

  const res = await fetch(`${API_BASE}/leads/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'x-dashboard-bypass': 'true',
    },
    body: JSON.stringify(fields),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Update failed' }));
    throw new Error(err.message || 'Update failed');
  }
}
