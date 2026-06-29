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
  const { data, error, isLoading } = useSWR(`/analytics/gig-workers/${id}`, fetcher, {
    refreshInterval: 5000,
  });
  return { data, error, isLoading };
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
