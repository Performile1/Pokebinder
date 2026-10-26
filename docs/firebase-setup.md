# Firebase infrastructure deployment

This is an owner-run deployment; merging does not deploy Firebase. No empty placeholder collections are needed: Firestore creates documents on first write. It does not have SQL tables/columns.

## Resources / fields

- `users/{uid}`: displayName, language (`en`/`sv`), updatedAt (server timestamp). Roles never live in client-writable profiles.
- `users/{uid}/collection/{id}`: existing CollectionCardItem fields in src/types.ts; rules require matching owner/id, bounded cardName and nonnegative purchasePriceSek. Other collection fields remain flexible for compatibility; this is not exhaustive schema validation.
- `users/{uid}/listings/{id}`: reserved, owner-readable, client writes disabled until a real publication backend exists.
- `orders/{id}`: existing AppOrderRecord shape, buyer-readable, all client writes disabled. Only a future trusted payment integration may create orders. Existing mock purchase UI will not persist orders under these rules.
- `integrationSettings/{provider}`: enabled, status, updatedBy, updatedAt. Verified admins can read; only the callable writes. No credentials or arbitrary URLs accepted. Flags do not activate integrations.
- `auditLogs/{id}`: action, provider, actor, createdAt; admin-readable and server-written.
- `rateLimits/{uid_operation}`: start, count, expiresAt; server-only, ten accepted calls per minute per user/operation. Optional Firestore TTL on expiresAt may be enabled manually. Without TTL each user's two operation records are overwritten, not appended.

## Prerequisites

1. Use Node 22 and install Firebase CLI (`npm install --global firebase-tools`). Run `firebase login` as the project owner. Confirm access to the existing project named in firebase-applet-config.json. Do not create another database silently.
2. In Firebase Console confirm the configured named Firestore database exists and review its location. Functions currently use europe-west1; review latency/residency before deployment.
3. Cloud Functions deployment requires an eligible billing plan and IAM permissions. Review billing before proceeding.
4. Enable Email/Password and Google under Authentication → Sign-in method, and production/preview hostnames under Authentication → Settings → Authorized domains.
5. Register the web app with App Check. These callable functions enforce App Check and reject calls until the frontend initializes App Check. Existing frontend APIs do not call these new functions yet.
6. Run `npm ci --prefix functions`. Set FIRESTORE_DATABASE_ID in functions/.env.<project-id> to the exact firestoreDatabaseId in firebase-applet-config.json (non-secret). The Firebase CLI can also prompt for this parameter.

## One setup command

`node scripts/setup-firebase.mjs` prints the exact target without deploying.

After reviewing rules (which REPLACE existing rules and disable mock order writes), indexes, region and costs:

`node scripts/setup-firebase.mjs --apply`

This deploys rules/indexes for the existing named database and the separate pokebinder functions codebase. It does not change authentication providers, authorized domains, App Check registration, secrets, billing, or other codebases. No data is seeded or deleted. Back up existing rules/data first. Rules emulator tests and staging verification are required before production use; only pure policy tests are included currently.

## Assign the administrator

First sign in to the app, request the verification email, follow its link, and verify status. Independently confirm the user's email and UID in Firebase Console → Authentication → Users.

Use locally authenticated Google Application Default Credentials with permission to manage Firebase Auth (for example owner-run `gcloud auth application-default login`). Do not commit or send credential files.

Set POKEBINDER_ADMIN_UID and POKEBINDER_ADMIN_EMAIL in your local shell to the confirmed user's UID and email. Then run:

`node scripts/setup-firebase.mjs --admin-only --apply`

This checks the actual Firebase user is enabled, verified, and matches the supplied email before preserving existing claims and adding admin:true. It does not automatically grant privileges by email. Sign in again afterward. Never add a public bootstrap-admin HTTP endpoint.

## Verification checklist

- Test two accounts cannot access each other's collection/profile/orders.
- Confirm client writes to orders, audit logs, integration settings, rate limits and user role fields fail.
- Confirm unverified/non-admin callers cannot change integration settings.
- Verify App Check tokens are required; test the eleventh call is rejected.
- Deploy and call saveProfile / saveIntegrationSettings with Firebase Functions SDK configured for europe-west1 and App Check.
- Confirm no credential values appear in client bundles or Firestore settings.

Not implemented here: live pricing integrations, payment processing, admin settings UI, frontend callable migration, full field validation, rules-emulator coverage, and authentication/rate limiting of the existing Vercel Express endpoints. These remain launch blockers; do not treat this PR as production certification.
