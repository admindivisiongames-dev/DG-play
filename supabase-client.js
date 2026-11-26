/* Public browser client only. Never place a service-role key in this file. */
(() => {
  'use strict';
  const url = 'https://abjiexysxihygcbjfkok.supabase.co';
  const publishableKey = 'sb_publishable_2xLD_b2JsOtt1BR4h_vD_Q_VrOqKxXr';
  if (!window.supabase || typeof window.supabase.createClient !== 'function') {
    window.divisionSupabaseError = 'Supabase client library did not load.';
    return;
  }
  window.divisionSupabase = window.supabase.createClient(url, publishableKey, {
    auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true }
  });
})();
