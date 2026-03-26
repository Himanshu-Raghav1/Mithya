/**
 * authApi.ts — Calls the SEPARATE Mithya Auth Service (runs on second Render account)
 * All Supabase calls are proxied through this service to bypass campus WiFi ban.
 */

const AUTH_URL = import.meta.env.VITE_PROXY_URL || 'http://localhost:5001';

export async function sendOtp(email: string) {
  const res = await fetch(`${AUTH_URL}/auth/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  return res.json();
}

export async function verifyOtp(email: string, otp: string, anon_name?: string) {
  const res = await fetch(`${AUTH_URL}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp, anon_name }),
  });
  return res.json();
}

export async function getAuthMe(token: string) {
  const res = await fetch(`${AUTH_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}
