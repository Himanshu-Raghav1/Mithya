import { supabase } from '../lib/supabase';

/**
 * authApi.ts — Migrated to DIRECT Supabase Authentication (Removing Proxy)
 * OTPs are now sent instantly using Resend via the Supabase Client SDK.
 */

export async function sendOtp(email: string) {
  try {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true }
    });
    
    if (error) return { success: false, message: error.message };
    
    // Check 1: localStorage flag set after first successful login on this device
    const localFlag = localStorage.getItem('mithya_registered') === 'true';
    
    // Check 2: If user already has an active Supabase session with anon_name → they're returning
    // This works even if localStorage was cleared (new device, private browsing etc.)
    let sessionFlag = false;
    try {
      const { data: session } = await supabase.auth.getSession();
      if (session?.session?.user?.user_metadata?.anon_name) {
        sessionFlag = true;
        localStorage.setItem('mithya_registered', 'true'); // Restore the flag
      }
    } catch { /* ignore */ }

    const isReturning = localFlag || sessionFlag;
    return { success: true, is_new: !isReturning };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function verifyOtp(email: string, otp: string, anon_name?: string) {
  try {
    const { data, error } = await supabase.auth.verifyOtp({
      email, token: otp, type: 'email'
    });
    
    if (error) return { success: false, message: error.message };
    if (!data.session) return { success: false, message: "No session returned from Supabase" };

    const user = data.user;
    
    // Mark this device as registered — so future logins skip anon_name screen
    localStorage.setItem('mithya_registered', 'true');

    // If the user provided a new anon_name, AND their Supabase account doesn't already have one, set it.
    if (anon_name && !user?.user_metadata?.anon_name) {
      await supabase.auth.updateUser({
        data: { anon_name: anon_name }
      });
      
      // ✅ Re-fetch the session AFTER updateUser() so token includes anon_name
      const { data: refreshed } = await supabase.auth.refreshSession();
      if (refreshed?.session) {
        return { success: true, token: refreshed.session.access_token };
      }
    }

    return { success: true, token: data.session.access_token };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}
