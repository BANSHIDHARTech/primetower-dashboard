import { cookies } from 'next/headers';

let API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/v1';

// Ensure the URL correctly points to the /v1 endpoints
if (!API_URL.endsWith('/v1')) {
  API_URL = API_URL.replace(/\/+$/, '') + '/v1';
}

export async function fetchWithCookie(endpoint: string) {
  const tokenCookie = cookies().get('access_token');
  const token = tokenCookie?.value;

  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
        'x-dashboard-bypass': 'true', // Allows dashboard to access API without JWT
      },
      cache: 'no-store', // Always fresh data for dashboard
    });

    if (!res.ok) {
      console.error(`API Error on ${endpoint}: ${res.status}`);
      return []; // Return empty array instead of throwing to prevent blank screen
    }

    return res.json();
  } catch (error) {
    console.error(`Network Error on ${endpoint}:`, error);
    return [];
  }
}
