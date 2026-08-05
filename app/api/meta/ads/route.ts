import { NextResponse } from 'next/server';
import { getMetaAdSpend } from '@/lib/server-meta';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const data = await getMetaAdSpend();
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ today: 0, mtd: 0, error: String(e) }, { status: 500 });
  }
}
