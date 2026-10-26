# Launch readiness: not yet production-ready

This change restores real account flows, not a complete production certification.

## Firebase console checks (owner required)
- Authentication → Sign-in method: enable Google and Email/Password.
- Authentication → Settings → Authorized domains: add the production hostname and any preview hostname used for testing.
- Firestore Database: confirm the named database in firebase-applet-config.json exists and publish the reviewed firestore.rules to that database.
- Test registration, Google sign-in, password reset, reload, sign-out, and account switching with two test accounts. Verify each account can only read/write its own collection.

## Still required before public launch
- Translate the rest of the application; the new language selector only covers account flows and the preview notice.
- Replace simulated pricing, forecasts, OCR fallback and marketplace purchases with real integrations, or remove these features. The preview notice is not a substitute for real data.
- Add backend authentication, authorization and distributed rate limiting before enabling paid AI or a shared webhook. Server-controlled URL allowlisting only addresses arbitrary outbound destinations; it does not prevent API abuse.
- Validate and restrict card URLs inside the remote scraping service too.
- Configure SCRAPER_SERVICE_URL and DISCORD_WEBHOOK_URL server-side if enabling those integrations. Caller-selected destinations are now rejected unless they exactly match configuration.
- Add browser integration tests and accessibility checks. Verify focus trapping and keyboard navigation in dialogs.
- Add privacy/account-deletion/retention policies and workflows appropriate to the launch market.
- Measure and reduce the >1 MB frontend bundle.

## Data migration
Legacy shared browser collections and stored demo profiles are not automatically imported into real accounts, to avoid assigning another user's local data to the wrong account. Existing Firestore data is not deleted. New browser caches are keyed by account UID.
