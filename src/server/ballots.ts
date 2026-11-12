import { effectiveStatus, isCalendarDate, normalize } from "../domain/event";
import type { Prisma } from "../generated/prisma/client";
import { createCapability, hashCapability } from "./capability";
import { getDb } from "./db";

export class EventError extends Error {
  constructor(readonly code: "missing" | "closed" | "invalid" | "duplicate" | "private") {
    super(code);
  }
}

export async function lockEvent(tx: Prisma.TransactionClient, token: string) {
  const rows = await tx.$queryRaw<{ id: string }[]>`SELECT id FROM "Event" WHERE "publicToken" = ${token} FOR UPDATE`;
  if (!rows[0]) throw new EventError("missing");
  return tx.event.findUniqueOrThrow({where: {id: rows[0].id}});
}

type Vote = {
  name: string;
  privateToken?: string;
  dateIds: string[];
  ideaIds: string[];
  newDates: string[];
  newIdeas: string[];
};

export async function saveBallot(eventToken: string, input: Vote) {
  const name = input.name.trim();
  if ((!input.privateToken && (!normalize(name) || name.length > 100)) ||
      input.dateIds.length > 100 || input.ideaIds.length > 100 ||
      input.newDates.length > 10 || input.newIdeas.length > 10 ||
      input.newDates.some(date => !isCalendarDate(date)) ||
      input.newIdeas.some(idea => !normalize(idea) || idea.length > 160) ||
      input.dateIds.length + input.ideaIds.length + input.newDates.length + input.newIdeas.length === 0) {
    throw new EventError("invalid");
  }
  return getDb().$transaction(async tx => {
    const event = await lockEvent(tx, eventToken);
    if (effectiveStatus(event.status, event.votingDeadline, event.rsvpDeadline, new Date()) !== "VOTING_OPEN") {
      throw new EventError("closed");
    }
    const existing = input.privateToken ? await tx.participant.findFirst({
      where: {eventId: event.id, tokenHash: hashCapability(input.privateToken)},
    }) : null;
    if (input.privateToken && !existing) throw new EventError("private");
    if (!existing && await tx.participant.findUnique({
      where: {eventId_normalizedName: {eventId: event.id, normalizedName: normalize(name)}},
    })) throw new EventError("duplicate");
    const dateIds = new Set(input.dateIds);
    const ideaIds = new Set(input.ideaIds);
    if (await tx.eventDateProposal.count({where: {eventId: event.id, id: {in: [...dateIds]}}}) !== dateIds.size ||
        await tx.eventIdeaProposal.count({where: {eventId: event.id, id: {in: [...ideaIds]}}}) !== ideaIds.size) {
      throw new EventError("invalid");
    }
    for (const date of new Set(input.newDates)) {
      const proposal = await tx.eventDateProposal.upsert({
        where: {eventId_date: {eventId: event.id, date}}, create: {eventId: event.id, date}, update: {},
      });
      dateIds.add(proposal.id);
    }
    for (const label of input.newIdeas) {
      const normalizedLabel = normalize(label);
      const proposal = await tx.eventIdeaProposal.upsert({
        where: {eventId_normalizedLabel: {eventId: event.id, normalizedLabel}},
        create: {eventId: event.id, normalizedLabel, label: label.trim()}, update: {},
      });
      ideaIds.add(proposal.id);
    }
    const privateToken = existing ? undefined : createCapability();
    const participant = existing ?? await tx.participant.create({
      data: {eventId: event.id, name, normalizedName: normalize(name), tokenHash: hashCapability(privateToken!)},
    });
    const key = {eventId: event.id, participantId: participant.id};
    const ballot = await tx.ballot.upsert({where: {eventId_participantId: key}, create: key, update: {}});
    await tx.dateVote.deleteMany({where: {eventId: event.id, ballotId: ballot.id}});
    await tx.ideaVote.deleteMany({where: {eventId: event.id, ballotId: ballot.id}});
    await tx.dateVote.createMany({data: [...dateIds].map(proposalId => ({eventId: event.id, ballotId: ballot.id, proposalId}))});
    await tx.ideaVote.createMany({data: [...ideaIds].map(proposalId => ({eventId: event.id, ballotId: ballot.id, proposalId}))});
    return {privateToken};
  });
}

