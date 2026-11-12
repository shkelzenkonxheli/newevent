import { expect, test } from "vitest";
import { effectiveStatus, isCalendarDate, normalize } from "./event";

test("normalizes equivalent participant and proposal strings", () => {
  expect(normalize("  ANNA\u00a0  Sørensen ")).toBe(normalize("Anna Sørensen"));
  expect(normalize("ＡＮＮＡ")).toBe("anna");
});

test("rejects invalid calendar dates", () => {
  expect(isCalendarDate("2025-02-29")).toBe(false);
  expect(isCalendarDate("2024-02-29")).toBe(true);
});

test("enforces independent optional deadlines at the boundary", () => {
  const now = new Date("2026-11-12T19:00:00Z");
  expect(effectiveStatus("VOTING_OPEN", now, null, now)).toBe("VOTING_CLOSED");
  expect(effectiveStatus("VOTING_OPEN", null, now, now)).toBe("VOTING_OPEN");
  expect(effectiveStatus("RSVP_OPEN", null, now, now)).toBe("FINALIZED");
});

test("converts Copenhagen deadlines and rejects DST gaps and folds", async () => {
  const {parseLocalDeadline} = await import("./event");
  expect(parseLocalDeadline("2026-06-12T20:00","Europe/Copenhagen")?.toISOString()).toBe("2026-06-12T18:00:00.000Z");
  expect(() => parseLocalDeadline("2026-03-29T02:30","Europe/Copenhagen")).toThrow();
  expect(() => parseLocalDeadline("2026-10-25T02:30","Europe/Copenhagen")).toThrow();
});
