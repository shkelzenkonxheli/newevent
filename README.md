# NewEvent

NewEvent is a Danish-first event planning app with an English language switch. Organizers create events and share a QR code or link. Guests can propose options, vote and RSVP using a name and a private update code. See PLAN.md for the current verification status.

## Local setup

1. Use Node.js 22.12 or newer and a dedicated PostgreSQL database.
2. Run npm ci --legacy-peer-deps, then copy .env.example to .env and set DATABASE_URL and DIRECT_URL. The direct URL can match DATABASE_URL locally.
3. Set BETTER_AUTH_URL to the app origin. Generate your own high-entropy BETTER_AUTH_SECRET, for example using Node crypto randomBytes. For local-only email delivery, set EMAIL_MODE=console. Treat the printed reset and verification links as credentials.
4. Run npm run db:generate, npm run db:deploy, and npm run dev. Open http://localhost:3000.
5. Verify a local account, then optionally run npm run seed with NODE_ENV=development and SEED_ORGANIZER_EMAIL set. The seed accepts loopback databases only.

## Checks

Run npm run lint, npm run typecheck, npm test and npm run build. Set NEWEVENT_DATABASE_TEST=1 and export DATABASE_URL to include the lifecycle integration test against a dedicated migrated loopback database. For browser tests, run npx playwright install webkit and npm run test:e2e.

## Hosted configuration

- Create separate Vercel preview and production environments. Use the Node.js runtime. Set the install command to npm ci --legacy-peer-deps and the build command to npm run db:generate && npm run build.
- Set DATABASE_URL to the Neon pooled connection and DIRECT_URL to the direct connection. Keep secrets in the host configuration. Apply npm run db:deploy against the intended database as a separate release step. Back up and review migrations before applying them to a database with existing data.
- Configure a Google OAuth web client with the exact redirect URI ending in /api/auth/callback/google. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET. Google sign-in appears when both variables are set.
- Verify a Resend sending domain. Set RESEND_API_KEY and EMAIL_FROM and verify delivery of both verification and password reset emails from the hosted environment. Local console mode is development-only.
- The SMS interface accepts a provider challenge ID and delegates code verification to the provider. Before enabling it, configure a real service, review country-specific rates and data handling, and verify challenge expiry and attempt limits. SMS is currently disabled.
- Review tenant-independent ownership, event privacy notice, controller and processor roles, retention, backups and deletion procedures with the people responsible for the pilot.
- Run browser, database and provider checks and resolve the gaps in PLAN.md before inviting real participants.

## Event data

Organizer event exports include participant data and should be shared only with authorized recipients. Browser print supports A4 and Save as PDF. A participant name is not proof of identity. A name can be claimed by the first submission, and two people with the same normalized name need organizer assistance. Roster turnout is an approximate name match. Vote and RSVP updates require the original private code.

Organizers can set a UTC deletion date. Use npm run retention:preview to count eligible events and npm run retention:preview -- --apply to delete them. Schedule the command separately if automatic purging is required. Event deletion cascades to dependent rows.
