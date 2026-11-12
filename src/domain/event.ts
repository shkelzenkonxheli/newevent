export const normalize = (value: string) =>
  value.normalize("NFKC").trim().replace(/\s+/gu, " ").toUpperCase().toLowerCase();

export function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(value) || value.startsWith("0000")) return false;
  const date = new Date(value + "T00:00:00.000Z");
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export type Status = "DRAFT" | "VOTING_OPEN" | "VOTING_CLOSED" | "FINALIZED" | "RSVP_OPEN" | "COMPLETED";

export function effectiveStatus(status: Status, votingDeadline: Date | null, rsvpDeadline: Date | null, now: Date): Status {
  if (status === "VOTING_OPEN" && votingDeadline && now >= votingDeadline) return "VOTING_CLOSED";
  if (status === "RSVP_OPEN" && rsvpDeadline && now >= rsvpDeadline) return "FINALIZED";
  return status;
}

export function parseLocalDeadline(value: string, timezone: string): Date | null {
  if (!value) return null;
  const [day, time] = value.split("T");
  if (!day || !time || !isCalendarDate(day) || !/^([01]\d|2[0-3]):[0-5]\d$/u.test(time)) {
    throw new RangeError("Invalid deadline");
  }
  const wallTime = new Date(value + ":00Z").getTime();
  if (!Number.isFinite(wallTime)) throw new RangeError("Invalid deadline");
  const formatter = new Intl.DateTimeFormat("sv-SE", {timeZone:timezone,dateStyle:"short",timeStyle:"short",hourCycle:"h23"});
  const localKey = (instant: number) => formatter.format(new Date(instant)).replace(" ", "T");
  const offsets = new Set([-86400000, 0, 86400000].map(delta => {
    const probe = wallTime + delta;
    return new Date(localKey(probe) + ":00Z").getTime() - probe;
  }));
  const matches = [...offsets].map(offset => wallTime - offset).filter(candidate => localKey(candidate) === value);
  if (matches.length !== 1) throw new RangeError("Ambiguous or nonexistent local time");
  return new Date(matches[0]);
}
