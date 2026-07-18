import { NextResponse } from 'next/server';
import { fetchWithCookie } from '@/lib/queries/server-api';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const data = await fetchWithCookie('/leads');
    const count = Array.isArray(data) ? data.length : 'not array';
    const first = Array.isArray(data) && data.length > 0 ? data[0] : null;
    return NextResponse.json({ 
      count, 
      firstId: first?.id || null,
      sample: first ? { id: first.id, customerName: first.customerName } : null
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
