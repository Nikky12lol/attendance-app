import { describe, expect, it } from "vitest";
import type { AppState, Period } from "./types";
import { sweep } from "./sweep";

const periods: Period[] = [
  { id: "sat-past", weekday: "SAT", name: "Math", start: "09:00", end: "10:00", units: 1 },
  { id: "mon-past", weekday: "MON", name: "Lab", start: "09:00", end: "10:00", units: 2 },
  { id: "mon-future", weekday: "MON", name: "Physics", start: "12:00", end: "13:00", units: 1 },
  { id: "mon-lunch", weekday: "MON", name: "Lunch", start: "11:45", end: "12:30", units: 0 },
];

function state(semesterStart = "2026-10-31", records: AppState["records"] = []): AppState {
  return {
    periods,
    records,
    settings: { alarmConfirmed: false, semesterStart, semesterEnd: "2026-12-31", schemaVersion: 1, baseline: { attended: 130, conducted: 230 } },
    lastSweep: "",
  };
}

describe("sweep", () => {
  const now = new Date(2026, 10, 2, 10, 30);
  it("writes absent records for ended periods with copied units", () => {
    const result = sweep(state(), now);
    expect(result.records).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "sat-past|2026-10-31", status: "ABSENT", units: 1 }),
      expect.objectContaining({ id: "mon-past|2026-11-02", status: "ABSENT", units: 2 }),
    ]));
  });
  it("skips units=0 and periods that have not ended", () => {
    const result = sweep(state(), now);
    expect(result.records.some(r => r.periodId === "mon-lunch")).toBe(false);
    expect(result.records.some(r => r.periodId === "mon-future")).toBe(false);
  });
  it("is idempotent", () => {
    const once = sweep(state(), now);
    expect(sweep(once, now).records).toHaveLength(once.records.length);
  });
  it("does not backfill before semesterStart", () => {
    const result = sweep(state("2026-11-02"), now);
    expect(result.records.some(r => r.periodId === "sat-past")).toBe(false);
  });
  it("does not modify an existing present record", () => {
    const present = { id: "mon-past|2026-11-02", periodId: "mon-past", date: "2026-11-02", status: "PRESENT" as const, units: 2, lockedAt: "original" };
    expect(sweep(state("2026-10-31", [present]), now).records.find(r => r.id === present.id)).toEqual(present);
  });
  it("adds nothing on Sunday", () => {
    expect(sweep(state("2026-11-01"), new Date(2026, 10, 1, 12, 0)).records).toEqual([]);
  });
});
