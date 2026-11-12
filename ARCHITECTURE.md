# NewEvent architecture

NewEvent runs on Next.js App Router, React, strict TypeScript, Tailwind and next-intl. The initial UI uses native forms and Lucide. Prisma 7 uses the PostgreSQL pg adapter on Node. Better Auth 1.7 uses the Prisma adapter for sessions, email verification and password reset, with an optional Google provider. Resend handles hosted email. Browser print provides the initial A4 and PDF path.

Events belong to a single organizer. Organizer reads and writes scope queries to the authenticated, email-verified owner. Event tokens and participant capabilities are 32 random bytes. Public pages query a limited field set and never fetch names. Participant credentials are SHA-256 hashes of high-entropy tokens. Event exports omit those hashes. Public writes use a database-backed per-event request cap.

EventDateProposal and EventIdeaProposal each belong to an event and are unique by local calendar date and normalized label respectively. Participants are unique by event and normalized name. Ballots and RSVPs have one-to-one composite keys referencing the participant within the same event. Vote join tables reference both the ballot and proposal using composite foreign keys to enforce event scope. Audit records are event-scoped. Deleting a user cascades to owned events, auth accounts and sessions. Event deletion cascades to proposals, participants, ballots, votes, RSVP records, rosters and audit records.

Participant changes and organizer lifecycle transitions acquire the event row lock. Deadline checks run while that lock is held. Dates are stored as local calendar keys. Deadline inputs resolve to UTC using the event zone and reject ambiguous or nonexistent local times. Manual finalization stores the selected date and activity alongside a snapshot of vote counts. Pending RSVP counts use the known voter cohort.

Name normalization and a private edit code limit duplicate submissions and accidental edits. Neither mechanism proves the identity of the original person. The per-event limit can throttle a busy group and does not stop impersonation. See the pilot checklist for remaining security and usability work.
