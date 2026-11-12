import { effectiveStatus, isCalendarDate, normalize, parseLocalDeadline } from "../domain/event";
import { EventError } from "./ballots";
import { createCapability } from "./capability";
import { getDb } from "./db";

export async function createEvent(ownerId: string, input: {title: string; description: string; language: "da" | "en"; dates: string[]; ideas: string[]; timezone: string; votingDeadline: string; rsvpDeadline: string}) {
  const title = input.title.trim();
  if (!title || title.length > 140 || input.description.length > 4000 ||
    input.dates.length > 20 || input.ideas.length > 20 || input.dates.some(date => !isCalendarDate(date)) ||
    input.ideas.some(idea => !normalize(idea) || idea.length > 160)) throw new EventError("invalid");
  const timezone = input.timezone.trim() || "Europe/Copenhagen";
  let votingDeadline: Date | null;
  let rsvpDeadline: Date | null;
  try {
    new Intl.DateTimeFormat("en", {timeZone:timezone});
    votingDeadline = parseLocalDeadline(input.votingDeadline, timezone);
    rsvpDeadline = parseLocalDeadline(input.rsvpDeadline, timezone);
  } catch {
    throw new EventError("invalid");
  }
  return getDb().event.create({
    data: {
      ownerId, title, timezone, votingDeadline, rsvpDeadline, description: input.description.trim(), language: input.language,
      publicToken: createCapability(),
      dates: {create: [...new Set(input.dates)].map(date => ({date}))},
      ideas: {create: [...new Map(input.ideas.map(idea => [normalize(idea), idea.trim()])).entries()]
        .map(([normalizedLabel, label]) => ({normalizedLabel, label}))},
    },
    select: {id: true},
  });
}

const transitions = {
  DRAFT: ["VOTING_OPEN"],
  VOTING_OPEN: ["VOTING_CLOSED"],
  VOTING_CLOSED: [],
  FINALIZED: ["RSVP_OPEN", "COMPLETED"],
  RSVP_OPEN: ["COMPLETED"],
  COMPLETED: [],
} as const;

type Transition = "VOTING_OPEN" | "VOTING_CLOSED" | "FINALIZED" | "RSVP_OPEN" | "COMPLETED";

export async function changeStatus(ownerId: string, eventId: string, next: Transition, final?: {dateId: string; ideaId: string; confirmed: boolean; time: string; location: string; instructions: string}) {
  return getDb().$transaction(async tx => {
    const rows = await tx.$queryRaw<{ id: string }[]>`SELECT id FROM "Event" WHERE id = ${eventId} AND "ownerId" = ${ownerId} FOR UPDATE`;
    if (!rows[0]) throw new EventError("missing");
    const event = await tx.event.findUniqueOrThrow({where: {id: eventId}});
    const current = effectiveStatus(event.status, event.votingDeadline, event.rsvpDeadline, new Date());
    if (next !== "FINALIZED") {
      const allowed: readonly string[] = transitions[current];
      if (!allowed.includes(next) && !(event.status === "VOTING_OPEN" && next === "VOTING_CLOSED")) throw new EventError("invalid");
      if (next === "RSVP_OPEN" && event.rsvpDeadline && event.rsvpDeadline <= new Date()) throw new EventError("closed");
      await tx.event.update({where: {id: eventId}, data: {status: next}});
    } else {
      if (current !== "VOTING_CLOSED" || !final?.confirmed) throw new EventError("invalid");
      if ((final.time && !/^([01]\d|2[0-3]):[0-5]\d$/u.test(final.time)) || final.location.length > 240 || final.instructions.length > 4000) throw new EventError("invalid");
      const dates = await tx.eventDateProposal.findMany({where: {eventId}, include: {_count: {select: {votes: true}}}});
      const ideas = await tx.eventIdeaProposal.findMany({where: {eventId}, include: {_count: {select: {votes: true}}}});
      const date = dates.find(option => option.id === final.dateId);
      const idea = ideas.find(option => option.id === final.ideaId);
      if (!date || !idea) throw new EventError("invalid");
      const voters = await tx.ballot.count({where: {eventId}});
      await tx.event.update({where: {id: eventId}, data: {
        status: next, finalDate: date.date, finalIdea: idea.label, finalTime:final.time || null, location:final.location.trim() || null, instructions:final.instructions.trim() || null,
        resultSnapshot: {voters, dates: dates.map(row => ({date: row.date, votes: row._count.votes})),
          ideas: ideas.map(row => ({label: row.label, votes: row._count.votes}))},
      }});
    }
    await tx.auditLog.create({data: {eventId, actorId: ownerId, action: next}});
  });
}

