/**
 * Seed a single admin account.
 * Run with: `npm run seed` (from /server)
 *
 * Idempotent: if an admin with ADMIN_EMAIL already exists, its password/role
 * are refreshed rather than creating a duplicate.
 */
import { env, checkEnv } from '../config/env.js';
import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../models/User.js';

async function seedAdmin() {
  checkEnv();
  const connected = await connectDB();
  if (!connected) {
    console.error('❌ Cannot seed without a database connection. Set MONGO_URI.');
    process.exit(1);
  }

  const { adminName, adminEmail, adminPassword } = env;

  let admin = await User.findOne({ email: adminEmail }).select('+passwordHash');

  if (admin) {
    admin.name = adminName;
    admin.role = 'admin';
    await admin.setPassword(adminPassword);
    await admin.save();
    console.log(`♻️  Updated existing admin: ${adminEmail}`);
  } else {
    admin = new User({ name: adminName, email: adminEmail, role: 'admin' });
    await admin.setPassword(adminPassword);
    await admin.save();
    console.log(`✅ Created admin: ${adminEmail}`);
  }

  console.log('');
  console.log('   Admin login credentials');
  console.log('   ───────────────────────');
  console.log(`   Email:    ${adminEmail}`);
  console.log(`   Password: ${adminPassword}`);
  console.log('');

  await disconnectDB();
  process.exit(0);
}

seedAdmin().catch(async (err) => {
  console.error('❌ Seed failed:', err.message);
  await disconnectDB().catch(() => {});
  process.exit(1);
});
