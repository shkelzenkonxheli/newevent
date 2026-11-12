CREATE TYPE "EventStatus" AS ENUM ('DRAFT','VOTING_OPEN','VOTING_CLOSED','FINALIZED','RSVP_OPEN','COMPLETED');
CREATE TABLE "User" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "emailVerified" BOOLEAN NOT NULL DEFAULT false,
  "image" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE TABLE "Session" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "token" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "userId" TEXT NOT NULL
);
CREATE TABLE "Account" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "accountId" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "accessToken" TEXT,
  "refreshToken" TEXT,
  "idToken" TEXT,
  "accessTokenExpiresAt" TIMESTAMP(3),
  "refreshTokenExpiresAt" TIMESTAMP(3),
  "scope" TEXT,
  "password" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE TABLE "Verification" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "identifier" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE TABLE "Event" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "ownerId" TEXT NOT NULL,
  "publicToken" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "timezone" TEXT NOT NULL DEFAULT 'Europe/Copenhagen',
  "language" TEXT NOT NULL DEFAULT 'da',
  "status" "EventStatus" NOT NULL DEFAULT 'DRAFT',
  "votingDeadline" TIMESTAMPTZ(6),
  "rsvpDeadline" TIMESTAMPTZ(6),
  "retentionUntil" TIMESTAMPTZ(6),
  "finalDate" TEXT,
  "finalIdea" TEXT,
  "finalTime" TEXT,
  "location" TEXT,
  "instructions" TEXT,
  "resultSnapshot" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE TABLE "Participant" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "eventId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "normalizedName" TEXT NOT NULL,
  "tokenHash" TEXT
);
CREATE TABLE "Ballot" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "eventId" TEXT NOT NULL,
  "participantId" TEXT NOT NULL
);
CREATE TABLE "RSVP" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "eventId" TEXT NOT NULL,
  "participantId" TEXT NOT NULL,
  "attending" BOOLEAN NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE TABLE "EventInvitee" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "eventId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "normalizedName" TEXT NOT NULL
);
CREATE TABLE "AuditLog" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "eventId" TEXT NOT NULL,
  "actorId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "subjectId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "EventDateProposal" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "eventId" TEXT NOT NULL,
  "date" TEXT NOT NULL
);
CREATE TABLE "DateVote" (
  "eventId" TEXT NOT NULL,
  "ballotId" TEXT NOT NULL,
  "proposalId" TEXT NOT NULL,
  PRIMARY KEY ("eventId", "ballotId", "proposalId")
);
CREATE TABLE "EventIdeaProposal" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "eventId" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "normalizedLabel" TEXT NOT NULL
);
CREATE TABLE "IdeaVote" (
  "eventId" TEXT NOT NULL,
  "ballotId" TEXT NOT NULL,
  "proposalId" TEXT NOT NULL,
  PRIMARY KEY ("eventId", "ballotId", "proposalId")
);
CREATE UNIQUE INDEX "User_email_key" ON "User" ("email");
CREATE UNIQUE INDEX "Session_token_key" ON "Session" ("token");
CREATE INDEX "Session_userId_idx" ON "Session" ("userId");
CREATE UNIQUE INDEX "Account_providerId_accountId_key" ON "Account" ("providerId", "accountId");
CREATE INDEX "Account_userId_idx" ON "Account" ("userId");
CREATE INDEX "Verification_identifier_idx" ON "Verification" ("identifier");
CREATE UNIQUE INDEX "Event_publicToken_key" ON "Event" ("publicToken");
CREATE INDEX "Event_ownerId_createdAt_idx" ON "Event" ("ownerId", "createdAt");
CREATE INDEX "Event_retentionUntil_idx" ON "Event" ("retentionUntil");
CREATE UNIQUE INDEX "Participant_tokenHash_key" ON "Participant" ("tokenHash");
CREATE UNIQUE INDEX "Participant_eventId_normalizedName_key" ON "Participant" ("eventId", "normalizedName");
CREATE UNIQUE INDEX "Participant_eventId_id_key" ON "Participant" ("eventId", "id");
CREATE UNIQUE INDEX "Ballot_eventId_participantId_key" ON "Ballot" ("eventId", "participantId");
CREATE UNIQUE INDEX "Ballot_eventId_id_key" ON "Ballot" ("eventId", "id");
CREATE UNIQUE INDEX "RSVP_eventId_participantId_key" ON "RSVP" ("eventId", "participantId");
CREATE UNIQUE INDEX "EventInvitee_eventId_normalizedName_key" ON "EventInvitee" ("eventId", "normalizedName");
CREATE INDEX "AuditLog_eventId_createdAt_idx" ON "AuditLog" ("eventId", "createdAt");
CREATE UNIQUE INDEX "EventDateProposal_eventId_date_key" ON "EventDateProposal" ("eventId", "date");
CREATE UNIQUE INDEX "EventDateProposal_eventId_id_key" ON "EventDateProposal" ("eventId", "id");
CREATE INDEX "DateVote_eventId_proposalId_idx" ON "DateVote" ("eventId", "proposalId");
CREATE UNIQUE INDEX "EventIdeaProposal_eventId_normalizedLabel_key" ON "EventIdeaProposal" ("eventId", "normalizedLabel");
CREATE UNIQUE INDEX "EventIdeaProposal_eventId_id_key" ON "EventIdeaProposal" ("eventId", "id");
CREATE INDEX "IdeaVote_eventId_proposalId_idx" ON "IdeaVote" ("eventId", "proposalId");
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Event" ADD CONSTRAINT "Event_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Participant" ADD CONSTRAINT "Participant_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Ballot" ADD CONSTRAINT "Ballot_eventId_participantId_fkey" FOREIGN KEY ("eventId", "participantId") REFERENCES "Participant" ("eventId", "id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RSVP" ADD CONSTRAINT "RSVP_eventId_participantId_fkey" FOREIGN KEY ("eventId", "participantId") REFERENCES "Participant" ("eventId", "id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EventInvitee" ADD CONSTRAINT "EventInvitee_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EventDateProposal" ADD CONSTRAINT "EventDateProposal_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DateVote" ADD CONSTRAINT "DateVote_eventId_ballotId_fkey" FOREIGN KEY ("eventId", "ballotId") REFERENCES "Ballot" ("eventId", "id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DateVote" ADD CONSTRAINT "DateVote_eventId_proposalId_fkey" FOREIGN KEY ("eventId", "proposalId") REFERENCES "EventDateProposal" ("eventId", "id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EventIdeaProposal" ADD CONSTRAINT "EventIdeaProposal_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "IdeaVote" ADD CONSTRAINT "IdeaVote_eventId_ballotId_fkey" FOREIGN KEY ("eventId", "ballotId") REFERENCES "Ballot" ("eventId", "id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "IdeaVote" ADD CONSTRAINT "IdeaVote_eventId_proposalId_fkey" FOREIGN KEY ("eventId", "proposalId") REFERENCES "EventIdeaProposal" ("eventId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "PublicWriteLimit" (
  "key" TEXT PRIMARY KEY,
  "hits" INTEGER NOT NULL,
  "resetAt" TIMESTAMPTZ(6) NOT NULL
);

ALTER TABLE "PublicWriteLimit" ADD CONSTRAINT "PublicWriteLimit_key_fkey" FOREIGN KEY ("key") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
