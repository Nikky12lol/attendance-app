import { describe, expect, it } from "vitest";
import type { AppState, Period } from "./types";
import { addDays, checkPresent, dateKey, forecast, markPresent, parseKey, percent, periodView, totals, weekdayOf } from "./calc";

const periods: Period[] = [
  { id: "mon-1", weekday: "MON", name: "Math", start: "09:00", end: "10:00", units: 1 },
  { id: "mon-lab", weekday: "MON", name: "Lab", start: "10:05", end: "11:00", units: 2 },
  { id: "mon-lunch", weekday: "MON", name: "Lunch", start: "11:45", end: "12:30", units: 0 },
  { id: "tue-1", weekday: "TUE", name: "Physics", start: "09:00", end: "10:00", units: 1 },
];

function state(overrides: Partial<AppState> = {}): AppState {
  return {
    periods,
    records: [],
    settings: { alarmConfirmed: false, semesterStart: "2026-11-01", semesterEnd: "2026-12-31", schemaVersion: 1, baseline: { attended: 130, conducted: 230 } },
    lastSweep: "",
    ...overrides,
  };
}

const monday = new Date(2026, 10, 2, 9, 30);

describe("date helpers", () => {
  it("uses local date components and crosses boundaries", () => {
    const local = new Date(2026, 2, 8, 0, 30);
    expect(dateKey(parseKey(dateKey(local)))).toBe(dateKey(local));
    expect(addDays("2026-01-31", 1)).toBe("2026-02-01");
    expect(addDays("2026-03-08", 1)).toBe("2026-03-09");
  });
  it("maps Sunday to null and weekdays correctly", () => {
    expect(weekdayOf("2026-11-01")).toBeNull();
    expect(weekdayOf("2026-11-02")).toBe("MON");
    expect(weekdayOf("2026-11-07")).toBe("SAT");
  });
});

describe("marking", () => {
  it("returns every checkPresent outcome", () => {
    const s = state();
    expect(checkPresent(s, "missing", "2026-11-02", monday)).toBe("NOT_FOUND");
    expect(checkPresent(s, "mon-lunch", "2026-11-02", monday)).toBe("NO_UNITS");
    expect(checkPresent(s, "mon-1", "2026-11-03", new Date(2026, 10, 3, 9, 30))).toBe("WRONG_DATE");
    expect(checkPresent(s, "mon-1", "2026-11-02", new Date(2026, 10, 3, 9, 30))).toBe("WRONG_DATE");
    expect(checkPresent(s, "mon-1", "2026-11-02", new Date(2026, 10, 2, 8, 59))).toBe("OUTSIDE_WINDOW");
    expect(checkPresent(s, "mon-1", "2026-11-02", new Date(2026, 10, 2, 10, 1))).toBe("OUTSIDE_WINDOW");
    expect(checkPresent(s, "mon-1", "2026-11-02", monday)).toBeNull();
    const marked = state({ records: [{ id: "mon-1|2026-11-02", periodId: "mon-1", date: "2026-11-02", status: "PRESENT", units: 1, lockedAt: "x" }] });
    expect(checkPresent(marked, "mon-1", "2026-11-02", monday)).toBe("ALREADY_MARKED");
  });
  it("writes PRESENT without mutating input and refuses invalid marks", () => {
    const s = state();
    const original = JSON.parse(JSON.stringify(s));
    const result = markPresent(s, "mon-lab", "2026-11-02", new Date(2026, 10, 2, 10, 30));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.state.records[0]).toMatchObject({ id: "mon-lab|2026-11-02", status: "PRESENT", units: 2 });
      expect(Number.isNaN(Date.parse(result.state.records[0].lockedAt))).toBe(false);
    }
    expect(s).toEqual(original);
    expect(markPresent(s, "missing", "2026-11-02", monday)).toMatchObject({ ok: false, reason: "NOT_FOUND" });
    expect(markPresent(s, "mon-lunch", "2026-11-02", monday)).toMatchObject({ ok: false, reason: "NO_UNITS" });
    expect(markPresent(s, "mon-1", "2026-11-02", new Date(2026, 10, 2, 8, 0))).toMatchObject({ ok: false, reason: "OUTSIDE_WINDOW" });
  });
});

describe("views, totals, and forecast", () => {
  it("returns each period view state", () => {
    const marked = state({ records: [{ id: "mon-1|2026-11-02", periodId: "mon-1", date: "2026-11-02", status: "PRESENT", units: 1, lockedAt: "x" }] });
    expect(periodView(marked, periods[0], "2026-11-02", monday)).toBe("PRESENT");
    expect(periodView(state(), periods[2], "2026-11-02", monday)).toBe("NOT_TRACKED");
    expect(periodView(state(), periods[0], "2026-11-01", monday)).toBe("ABSENT");
    expect(periodView(state(), periods[1], "2026-11-02", monday)).toBe("UPCOMING");
    expect(periodView(state(), periods[0], "2026-11-02", monday)).toBe("OPEN");
    expect(periodView(state(), periods[0], "2026-11-02", new Date(2026, 10, 2, 10, 1))).toBe("ABSENT");
  });
  it("includes baseline and counts only PRESENT units as attended", () => {
    const s = state({ records: [
      { id: "a", periodId: "a", date: "2026-11-02", status: "PRESENT", units: 2, lockedAt: "x" },
      { id: "b", periodId: "b", date: "2026-11-02", status: "ABSENT", units: 1, lockedAt: "x" },
    ]});
    expect(totals(s)).toEqual({ attended: 132, conducted: 233 });
    expect(percent(s)).toBeCloseTo((132 * 100) / 233);
    expect(percent(state({ settings: { ...state().settings, baseline: undefined } }))).toBe(0);
  });
  it("forecasts using remaining unrecorded units and the target formula", () => {
    const all = state();
    const withRecord = state({ records: [{ id: "tue-1|2026-11-03", periodId: "tue-1", date: "2026-11-03", status: "PRESENT", units: 1, lockedAt: "x" }] });
    const early = forecast(all, new Date(2026, 10, 2, 8, 30));
    const current = forecast(withRecord, new Date(2026, 10, 2, 10, 30));
    const withoutTuesdayRecord = forecast(all, new Date(2026, 10, 2, 10, 30));
    const { attended, conducted } = totals(withRecord);
    expect(early.remainingUnits - withoutTuesdayRecord.remainingUnits).toBe(1);
    expect(withoutTuesdayRecord.remainingUnits - current.remainingUnits).toBe(1);
    expect(current.neededAttend).toBe(Math.max(0, Math.ceil((65 * (conducted + current.remainingUnits) - 100 * attended) / 100)));
    expect(current.achievable).toBe(current.neededAttend <= current.remainingUnits);
    expect(forecast(all, new Date(2026, 11, 27)).remainingUnits).toBe(forecast(all, new Date(2026, 11, 28)).remainingUnits);
  });
  it("clamps at zero and marks an impossible forecast", () => {
    const excellent = state({ settings: { ...state().settings, baseline: { attended: 1000, conducted: 1000 } } });
    expect(forecast(excellent, monday).neededAttend).toBe(0);
    const impossible = state({ periods: [] });
    expect(forecast(impossible, monday).achievable).toBe(false);
  });
});

