import { createClient } from '@insforge/sdk';

/**
 * InsForge client for browser auth (Google OAuth). The per-project subdomain
 * identifies the project, so no anon key is required. Base URL can be overridden
 * with VITE_INSFORGE_URL.
 */
export const insforge = createClient({
  baseUrl: import.meta.env.VITE_INSFORGE_URL || 'https://dr8zjaeq.us-east.insforge.app',
});

/** Start the Google OAuth flow (redirects the browser to Google). */
export function signInWithGoogle() {
  return insforge.auth.signInWithOAuth('google', {
    redirectTo: `${window.location.origin}/oauth/callback`,
    additionalParams: { prompt: 'select_account' },
  });
}
