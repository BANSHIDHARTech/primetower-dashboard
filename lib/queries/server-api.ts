import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/v1';

export async function fetchWithCookie(endpoint: string) {
  const tokenCookie = cookies().get('access_token');
  const token = tokenCookie?.value;

  const res = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
      'x-dashboard-bypass': 'true', // Allows dashboard to access API without JWT
    },
    cache: 'no-store', // Always fresh data for dashboard
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch ${endpoint}`);
  }

  return res.json();
}
