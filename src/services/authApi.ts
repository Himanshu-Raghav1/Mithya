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
    
    // We assume every Supabase OTP request is "new" so the AuthModal always prompts for anon_name.
    // If they already have an anon_name, verifyOtp ignores the new one.
    return { success: true, is_new: true };
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
    
    // If the user provided a new anon_name, AND their Supabase account doesn't already have one, set it.
    if (anon_name && !user?.user_metadata?.anon_name) {
      await supabase.auth.updateUser({
        data: { anon_name: anon_name }
      });
      
      // ✅ CRITICAL FIX: Re-fetch the session AFTER updateUser()
      // The old token does not contain anon_name yet. We must get the fresh token.
      const { data: refreshed } = await supabase.auth.refreshSession();
      if (refreshed?.session) {
        return { success: true, token: refreshed.session.access_token };
      }
    }

    // Return the raw Supabase JWT which contains sub and user_metadata
    return { success: true, token: data.session.access_token };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}
