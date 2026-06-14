import { env } from './env.js';

/**
 * InsForge (BaaS) integration — config-gated, lazily loaded.
 *
 * Nothing here runs unless INSFORGE_API_KEY is set, so the app boots and runs
 * exactly as before on MongoDB until the migration is switched on. The SDK is
 * imported dynamically inside the helpers so a missing/!configured InsForge
 * never affects server startup.
 */

export const isInsforgeConfigured = Boolean(env.insforge.apiKey);
export const usingInsforge = env.dataBackend === 'insforge';

if (isInsforgeConfigured) {
  console.log(`🧩 InsForge configured (${env.insforge.baseUrl}). Data backend: ${env.dataBackend}.`);
} else {
  console.warn('⚠️  InsForge not configured — set INSFORGE_API_KEY to enable (app runs on MongoDB).');
}

let adminClientPromise = null;

/**
 * Verify an InsForge user access token by asking InsForge who it belongs to
 * (server-mode getCurrentUser). Returns the InsForge user object or null.
 * @param {string} accessToken
 */
export async function verifyInsforgeToken(accessToken) {
  if (!accessToken || !isInsforgeConfigured) return null;
  try {
    const { createClient } = await import('@insforge/sdk');
    const client = createClient({ baseUrl: env.insforge.baseUrl, isServerMode: true });
    client.setAccessToken(accessToken);
    const res = await client.auth.getCurrentUser();
    return res?.data?.user || null;
  } catch {
    return null;
  }
}

/**
 * Ensure an InsForge `profiles` row exists for a user and return their role.
 * New OAuth users get a 'student' profile created on first sign-in.
 * @returns {Promise<string>} the user's role ('student' default)
 */
export async function ensureInsforgeProfile(user) {
  try {
    const admin = await getInsforgeAdmin();
    const existing = await admin.database.from('profiles').select('id, role').eq('id', user.id);
    const row = Array.isArray(existing?.data) ? existing.data[0] : existing?.data;
    if (row) return row.role || 'student';
    await admin.database
      .from('profiles')
      .insert([
        {
          id: user.id,
          email: user.email,
          name: user.profile?.name || user.email?.split('@')[0] || 'Learner',
          avatar: user.profile?.avatar_url || '',
          role: 'student',
        },
      ])
      .catch(() => {});
    return 'student';
  } catch {
    return 'student';
  }
}

/**
 * Get a server-side admin InsForge client (cached). Throws if not configured.
 * @returns {Promise<import('@insforge/sdk').InsForgeClient>}
 */
export async function getInsforgeAdmin() {
  if (!isInsforgeConfigured) {
    throw new Error('InsForge is not configured. Set INSFORGE_API_KEY in the server .env.');
  }
  if (!adminClientPromise) {
    adminClientPromise = (async () => {
      const { createAdminClient } = await import('@insforge/sdk');
      return createAdminClient({
        baseUrl: env.insforge.baseUrl,
        apiKey: env.insforge.apiKey,
      });
    })();
  }
  return adminClientPromise;
}

/**
 * Verify connectivity to InsForge. Returns a small status object — used by the
 * admin "InsForge status" endpoint so you can confirm the link once keys exist.
 * @returns {Promise<{configured:boolean, connected:boolean, baseUrl:string, dataBackend:string, error?:string}>}
 */
export async function pingInsforge() {
  const base = { configured: isInsforgeConfigured, baseUrl: env.insforge.baseUrl, dataBackend: env.dataBackend };
  if (!isInsforgeConfigured) return { ...base, connected: false };
  try {
    // Use the SDK's own auth-config route (it knows the correct project paths).
    const admin = await getInsforgeAdmin();
    const cfg = await admin.auth.getPublicAuthConfig();
    const data = cfg?.data ?? (cfg && !cfg.error ? cfg : null);
    const ok = !!data && !cfg?.error;
    return {
      ...base,
      connected: ok,
      projectRoutesReady: ok,
      oauthProviders: data?.oAuthProviders,
      hint: ok
        ? undefined
        : 'Project not reachable. Check INSFORGE_BASE_URL is your project host (from `npx @insforge/cli metadata`).',
    };
  } catch (err) {
    return { ...base, connected: false, error: err?.message || String(err) };
  }
}
