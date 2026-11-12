# NewEvent progress

## Implemented

- [x] Inspected the empty starting workspace and initialized the Next.js project.
- [x] Added a Danish-first landing page, English switch and system light/dark palette.
- [x] Added Prisma schema and initial SQL migration.
- [x] Added Better Auth email verification and reset, optional Google configuration and Resend delivery.
- [x] Added verified-organizer event listing, title search, a three-step event wizard, share link and QR download.
- [x] Added public proposal and ballot forms, private edit codes, database deduplication, results, manual closure and audited reopening.
- [x] Added explicit final selection, result snapshot and public announcement.
- [x] Added guest and voter RSVP, attendance counts and optional name roster.
- [x] Added A4 print views, browser PDF export, event privacy notice, JSON export, deletion and retention command.
- [x] Added local-only seed and setup/deployment documentation.

## Verification

- [x] Prisma Client generated successfully.
- [x] ESLint, strict TypeScript and Next.js production build passed.
- [ ] Production HTTP smoke blocked by automatic approval rejection of the loopback production server launch.
- [x] Initial migration applied to a dedicated PostgreSQL 17 test cluster using psql.
- [ ] Prisma migrate deploy could not launch its Windows schema engine (spawn EPERM). Verify deployment against a staging database.
- [x] Six Vitest tests passed against PostgreSQL, including verification email with mocked delivery and the concurrent ballot lifecycle.
- [x] Runtime dependency audit reported zero vulnerabilities after updating Better Auth.
- [ ] Playwright E2E blocked by Windows spawn EPERM. Browser cache write was denied and a workspace cache retry failed launching the downloader. Installed Chromium also failed to start because Windows denied crash-handler and IPC access.
- [ ] Live Google OAuth, Resend delivery, print pagination, QR decoding, responsive voting and accessibility review require verification.

## Remaining before a pilot

- [ ] Finish dedicated event management and account/settings screens. Add accessible loading states and form progress preservation across language changes.
- [ ] Finish design system with shadcn/Radix, React Hook Form, shared Zod schemas and restrained motion. Add explicit theme selection.
- [ ] Improve organizer validation feedback, date inputs, result charts, report localization and guest/voter edit experience.
- [ ] Add dedicated QR poster, verify browser PDF output and print pagination, and review organizer-name and report privacy controls.
- [ ] Finish account-level export/deletion and configure retention scheduling and backups.
- [ ] Test browser rate-limit feedback, public/private serialization, session revocation, password reset, roster/attendance reporting and manual recovery in the browser.
- [ ] Review organizer/controller and provider/processor decisions and configure production origin, database, secret, Google and Resend before deployment.
- [ ] Optional future SMS requires a real verification provider and cost review. The code includes an interface only.



