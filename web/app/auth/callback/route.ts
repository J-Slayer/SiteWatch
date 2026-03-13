/**
 * Auth callback route — handles the email confirmation redirect from Supabase.
 * After email confirmation, Supabase redirects here with a code in the query string.
 * We exchange it for a session then redirect to the dashboard.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // On error, redirect to login with an error param
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
