import { NextResponse } from 'next/server';

export async function GET() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'NOT SET';
  return NextResponse.json({ 
    apiUrl, 
    nodeEnv: process.env.NODE_ENV,
    allKeys: Object.keys(process.env).filter(k => k.startsWith('NEXT_PUBLIC'))
  });
}
