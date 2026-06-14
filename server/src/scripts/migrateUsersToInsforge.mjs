/**
 * Migrate selected users from MongoDB into InsForge's user system.
 *
 * By design this migrates ONLY three users — the admin, instructor "keshav",
 * and student "yash" — not the whole database. Bcrypt password hashes can't be
 * reused, so each migrated InsForge account gets a temporary password (printed
 * at the end) that the user can change later.
 *
 * Prerequisites (the routes 404 without these — see `npx @insforge/cli metadata`):
 *   INSFORGE_BASE_URL = your project's API URL (NOT https://api.insforge.dev)
 *   INSFORGE_API_KEY  = server admin key (ik_… / uak_…)
 *   INSFORGE_ANON_KEY = project anon key
 *
 * Run:  npm run migrate:insforge
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { createAdminClient } from '@insforge/sdk';

const TEMP_PASSWORD = process.env.INSFORGE_TEMP_PASSWORD || 'Insforge@2026';

function unwrapId(res) {
  if (res?.error) return { error: res.error.error || JSON.stringify(res.error) };
  const id = res?.user?.id || res?.data?.user?.id || res?.data?.id || res?.id;
  return { id };
}

async function main() {
  if (!process.env.INSFORGE_API_KEY) {
    console.error('❌ INSFORGE_API_KEY is not set in server/.env. Aborting.');
    process.exit(1);
  }
  if (!process.env.MONGO_URI) {
    console.error('❌ MONGO_URI is not set. Aborting.');
    process.exit(1);
  }

  const admin = createAdminClient({
    baseUrl: process.env.INSFORGE_BASE_URL || 'https://api.insforge.dev',
    apiKey: process.env.INSFORGE_API_KEY,
  });

  await mongoose.connect(process.env.MONGO_URI);
  const Users = mongoose.connection.collection('users');

  const targets = [
    ['admin', await Users.findOne({ email: process.env.ADMIN_EMAIL || 'admin@ailms.dev' })],
    ['instructor', await Users.findOne({ role: 'instructor', name: /keshav/i })],
    ['student', await Users.findOne({ role: 'student', name: /yash/i })],
  ];

  console.log('\n— Users found in MongoDB —');
  for (const [label, u] of targets) {
    console.log(`  ${label}: ${u ? `${u.name} <${u.email}>` : 'NOT FOUND'}`);
  }

  console.log('\n— Migrating into InsForge —');
  const results = [];
  for (const [label, u] of targets) {
    if (!u) { results.push({ label, status: 'skipped (not found in Mongo)' }); continue; }
    let res;
    try {
      res = await admin.auth.signUp({ email: u.email, password: TEMP_PASSWORD, name: u.name });
    } catch (e) {
      res = { error: { error: e?.message || String(e) } };
    }
    const { id, error } = unwrapId(res);
    if (id) {
      console.log(`  ✅ ${label}: ${u.email} → InsForge id ${id}`);
      if (admin.auth.setProfile) {
        try { await admin.auth.setProfile(id, { role: u.role, avatar: u.avatar || '' }); } catch {}
      }
      results.push({ label, email: u.email, role: u.role, status: 'created', id });
    } else {
      const already = /exist|already|duplicate|registered/i.test(error || '');
      console.log(`  ${already ? '↺ already in InsForge' : '❌ ' + error}: ${u.email}`);
      results.push({ label, email: u.email, role: u.role, status: already ? 'already exists' : 'error', error });
    }
  }

  console.log('\n— Summary —');
  console.log(JSON.stringify(results, null, 2));
  if (results.some((r) => r.status === 'created')) {
    console.log(`\n🔑 Temporary InsForge password for migrated accounts: ${TEMP_PASSWORD}`);
  }
  if (results.some((r) => r.error && /route not found/i.test(r.error))) {
    console.log(
      '\n⚠️  "Route not found" means INSFORGE_BASE_URL is not your project API URL.\n' +
        '   Run: npx @insforge/cli login && npx @insforge/cli link && npx @insforge/cli metadata\n' +
        '   then set INSFORGE_BASE_URL + INSFORGE_ANON_KEY in server/.env and re-run.'
    );
  }

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
