import { NextResponse, type NextRequest } from 'next/server';
import { jwtDecode } from 'jwt-decode';

export async function middleware(request: NextRequest) {
  // BYPASS: The user explicitly requested to disable all login checks
  // for the dashboard so it just opens up immediately without Auth.
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|logo.png|api|login).*)',
  ],
};
