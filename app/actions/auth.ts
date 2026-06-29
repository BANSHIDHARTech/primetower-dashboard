'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/v1';

export async function sendOtpAction(phone: string) {
  try {
    const res = await fetch(`${API_URL}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    });

    if (!res.ok) {
      const error = await res.json();
      return { error: error.message || 'Failed to send OTP' };
    }

    return { success: true };
  } catch (error: any) {
    return { error: error.message || 'Network error' };
  }
}

export async function verifyOtpAction(phone: string, otp: string) {
  try {
    const res = await fetch(`${API_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, otp }),
    });

    if (!res.ok) {
      const error = await res.json();
      return { error: error.message || 'Invalid OTP' };
    }

    const data = await res.json();
    const { accessToken } = data;

    // Decode token to get role
    const decoded: any = jwtDecode(accessToken);
    const role = decoded.role;

    // Set cookies
    cookies().set('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return { success: true, role };
  } catch (error: any) {
    return { error: error.message || 'Network error' };
  }
}

export async function logoutAction() {
  cookies().delete('access_token');
  redirect('/login');
}
