import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';
const root = resolve(import.meta.dirname, '..');
const config = JSON.parse(readFileSync(resolve(root, 'firebase-applet-config.json')));
const apply = process.argv.includes('--apply');
const uid = process.env.POKEBINDER_ADMIN_UID;
const email = process.env.POKEBINDER_ADMIN_EMAIL;
const adminOnly = process.argv.includes('--admin-only');
if (adminOnly) {
  if (!apply || !uid || !email) throw new Error('Use --admin-only --apply with POKEBINDER_ADMIN_UID and POKEBINDER_ADMIN_EMAIL after independently confirming identity.');
  // Uses owner-provided Application Default Credentials, never a checked-in key.
  const require = createRequire(resolve(root, 'functions/package.json'));
  const { initializeApp, applicationDefault } = require('firebase-admin/app');
  const { getAuth } = require('firebase-admin/auth');
  initializeApp({ credential: applicationDefault(), projectId: config.projectId });
  const auth = getAuth();
  const user = await auth.getUser(uid);
  if (user.disabled || !user.emailVerified || user.email?.toLowerCase() !== email.toLowerCase()) throw new Error('Admin identity must match, be verified, and not disabled. No claim changed.');
  await auth.setCustomUserClaims(uid, { ...user.customClaims, admin: true });
  console.log('Admin claim assigned. Sign in again to refresh the ID token.');
} else {
  console.log(`Target project: ${config.projectId}; database: ${config.firestoreDatabaseId}`);
  if (!apply) { console.log('Dry run only. Review docs/firebase-setup.md, then rerun with --apply to deploy.'); process.exit(0); }
  const path = resolve(root, '.firebase-deploy.generated.json');
  const firebaseConfig = {
    firestore: [{ database: config.firestoreDatabaseId, rules: 'firestore.rules', indexes: 'firestore.indexes.json' }],
    functions: [{ source: 'functions', codebase: 'pokebinder', predeploy: ['npm --prefix "$RESOURCE_DIR" run check', 'npm --prefix "$RESOURCE_DIR" test'] }],
  };
  writeFileSync(path, JSON.stringify(firebaseConfig, null, 2));
  try {
    const result = spawnSync('firebase', ['deploy', '--project', config.projectId, '--config', path, '--only', 'firestore,functions:pokebinder'], { cwd: root, stdio: 'inherit' });
    if (result.error) throw result.error;
    process.exitCode = result.status ?? 1;
  } finally { unlinkSync(path); }
}
