import { createClient } from '@supabase/supabase-js';

/**
 * Server-only Supabase client using the service role key.
 * Bypasses Row Level Security — use only in trusted server contexts
 * (Server Components, Route Handlers, Server Actions).
 * Never import this in client components or expose to the browser.
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.'
    );
  }

  return createClient(url, key, {
    auth: {
      // Disable auto-refresh and session persistence — not needed server-side.
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
