import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineString } from 'firebase-functions/params';
import { isVerifiedAdmin, profileInput } from './policy.js';

initializeApp();
const databaseId = defineString('FIRESTORE_DATABASE_ID');
const options = { region: 'europe-west1', enforceAppCheck: true, maxInstances: 5 };
const database = () => getFirestore(databaseId.value());

// Transaction-backed limit shared across instances. It limits accepted calls,
// not the total cost of rejected traffic; App Check and maxInstances also apply.
async function authorize(request, operation, admin = false) {
  if (!request.auth || request.auth.token.email_verified !== true) {
    throw new HttpsError('unauthenticated', 'Sign in with a verified email.');
  }
  if (admin && !isVerifiedAdmin(request.auth)) throw new HttpsError('permission-denied', 'Admin role required.');
  const now = Date.now();
  const ref = database().doc(`rateLimits/${request.auth.uid}_${operation}`);
  await database().runTransaction(async transaction => {
    const snapshot = await transaction.get(ref);
    const previous = snapshot.data();
    const sameWindow = previous && now - previous.start < 60000;
    const count = sameWindow ? previous.count + 1 : 1;
    if (count > 10) throw new HttpsError('resource-exhausted', 'Try again in one minute.');
    transaction.set(ref, { start: sameWindow ? previous.start : now, count, expiresAt: Timestamp.fromMillis(now + 3600000) });
  });
}

export const saveProfile = onCall(options, async request => {
  await authorize(request, 'profile');
  let profile;
  try { profile = profileInput(request.data); }
  catch (error) { throw new HttpsError('invalid-argument', error.message); }
  await database().doc(`users/${request.auth.uid}`).set({ ...profile, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  return { ok: true };
});

// Non-secret configuration only. API credentials must stay in Secret Manager.
// No caller-controlled network destinations or paid integrations are enabled.
export const saveIntegrationSettings = onCall(options, async request => {
  await authorize(request, 'integrations', true);
  const { provider, enabled } = request.data || {};
  if (!['gemini', 'ebay', 'tradera', 'compsniper', 'scraper'].includes(provider) || typeof enabled !== 'boolean' || Object.keys(request.data).some(key => !['provider', 'enabled'].includes(key))) {
    throw new HttpsError('invalid-argument', 'Expected a supported provider and boolean enabled; secrets and URLs are not accepted.');
  }
  const batch = database().batch();
  batch.set(database().doc(`integrationSettings/${provider}`), { enabled, status: 'not-connected', updatedBy: request.auth.uid, updatedAt: FieldValue.serverTimestamp() });
  batch.create(database().collection('auditLogs').doc(), { action: 'integration-settings-updated', provider, actor: request.auth.uid, createdAt: FieldValue.serverTimestamp() });
  await batch.commit();
  return { ok: true, status: 'not-connected' };
});
