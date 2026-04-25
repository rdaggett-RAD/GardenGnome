import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Handles email confirmation callback from Supabase Auth.
 * Supabase redirects here with a `code` query param after user clicks the
 * email confirmation link. We exchange it for a session, then redirect to
 * the onboarding flow.
 *
 * Configure your Supabase redirect URLs to point to:
 *   {your-domain}/auth/callback
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const redirectTo = searchParams.get('redirect_to') ?? '/onboarding';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}${redirectTo}`);
    }
  }

  // Anything else: send them to login with an error indicator
  return NextResponse.redirect(
    `${origin}/auth/login?error=auth_callback_failed`
  );
}
