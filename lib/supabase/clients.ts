// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr';
import { SUPABASE_COOKIE_OPTIONS } from './cookie-options';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookieOptions: SUPABASE_COOKIE_OPTIONS,
    }
  );
}