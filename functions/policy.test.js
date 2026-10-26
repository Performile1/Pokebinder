import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isVerifiedAdmin, profileInput } from './policy.js';
test('admin requires verified signed-in claim, not an email match', () => {
  assert.equal(isVerifiedAdmin(null), false);
  assert.equal(isVerifiedAdmin({ token: { email: 'admin@example.com', email_verified: true } }), false);
  assert.equal(isVerifiedAdmin({ token: { admin: true, email_verified: false } }), false);
  assert.equal(isVerifiedAdmin({ token: { admin: true, email_verified: true } }), true);
});
test('profile validates supported fields', () => {
  assert.deepEqual(profileInput({ displayName: ' Collector ', language: 'sv' }), { displayName: 'Collector', language: 'sv' });
  for (const data of [null, {}, { displayName: '', language: 'en' }, { displayName: 'a', language: 'xx' }]) assert.throws(() => profileInput(data));
});
