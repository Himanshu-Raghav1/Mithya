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
    
    return { success: true };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function signInWithGoogle() {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // This redirects back to your app after Google login
        redirectTo: window.location.origin, 
      }
    });
    if (error) return { success: false, message: error.message };
    return { success: true, url: data.url };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function verifyOtp(email: string, otp: string) {
  try {
    const { data, error } = await supabase.auth.verifyOtp({
      email, token: otp, type: 'email'
    });
    
    if (error) return { success: false, message: error.message };
    if (!data.session) return { success: false, message: "No session returned from Supabase" };

    const user = data.user;
    
    // Mark this device as registered
    localStorage.setItem('mithya_registered', 'true');

    // Return the token, and whether they need an anon name!
    const needsAnonName = !user?.user_metadata?.anon_name;
    
    return { success: true, token: data.session.access_token, needsAnonName };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function setAnonName(anon_name: string) {
  try {
    await supabase.auth.updateUser({
      data: { anon_name: anon_name }
    });
    
    // ✅ Re-fetch the session AFTER updateUser() so token includes anon_name
    const { data: refreshed } = await supabase.auth.refreshSession();
    if (refreshed?.session) {
      return { success: true, token: refreshed.session.access_token };
    }
    return { success: false, message: "Failed to refresh session" };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}
