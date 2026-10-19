import { capDayFor, drawnDateFor, nextReleaseAt, zonedTimeToUtc, CAD_TIME_ZONE } from "../business-day"

const iso = (d: Date) => d.toISOString()

describe("nextReleaseAt (next business day 09:00 America/New_York, plan B7)", () => {
  it("is Miami time", () => {
    expect(CAD_TIME_ZONE).toBe("America/New_York")
  })
  it("Friday 17:00 ET → Monday 09:00 ET", () => {
    // 2026-10-16 is a Friday; EDT = UTC−4.
    expect(iso(nextReleaseAt(new Date("2026-10-16T21:00:00Z")))).toBe("2026-10-19T13:00:00.000Z")
  })
  it("Saturday → Monday 09:00", () => {
    expect(iso(nextReleaseAt(new Date("2026-10-17T15:00:00Z")))).toBe("2026-10-19T13:00:00.000Z")
  })
  it("Sunday → Monday 09:00", () => {
    expect(iso(nextReleaseAt(new Date("2026-10-18T15:00:00Z")))).toBe("2026-10-19T13:00:00.000Z")
  })
  it("Tuesday 08:00 → Wednesday 09:00 (always the NEXT business day)", () => {
    expect(iso(nextReleaseAt(new Date("2026-10-20T12:00:00Z")))).toBe("2026-10-21T13:00:00.000Z")
  })
  it("uses the Eastern calendar day, not the UTC one (Thu 23:30 ET = Fri 03:30Z)", () => {
    expect(iso(nextReleaseAt(new Date("2026-10-23T03:30:00Z")))).toBe("2026-10-23T13:00:00.000Z")
  })
  it("DST end: Friday Oct 30 (EDT) → Monday Nov 2 09:00 EST (UTC−5)", () => {
    expect(iso(nextReleaseAt(new Date("2026-10-30T21:00:00Z")))).toBe("2026-11-02T14:00:00.000Z")
  })
  it("DST start: Friday Mar 6 (EST) → Monday Mar 9 09:00 EDT (UTC−4)", () => {
    expect(iso(nextReleaseAt(new Date("2026-03-06T22:00:00Z")))).toBe("2026-03-09T13:00:00.000Z")
  })
  it("queued on the DST-change Sunday itself → Monday 09:00 EST", () => {
    expect(iso(nextReleaseAt(new Date("2026-11-01T07:30:00Z")))).toBe("2026-11-02T14:00:00.000Z")
  })
})

describe("capDayFor / drawnDateFor (America/New_York calendar day)", () => {
  it("rolls over at Eastern midnight, not UTC midnight", () => {
    expect(capDayFor(new Date("2026-10-17T03:30:00Z"))).toBe("2026-10-16") // 23:30 EDT
    expect(capDayFor(new Date("2026-10-17T04:30:00Z"))).toBe("2026-10-17") // 00:30 EDT
    expect(capDayFor(new Date("2026-12-01T04:30:00Z"))).toBe("2026-11-30") // 23:30 EST
    expect(capDayFor(new Date("2026-12-01T05:00:00Z"))).toBe("2026-12-01")
  })
  it("drawn date is MM/DD/YYYY in Eastern time", () => {
    expect(drawnDateFor(new Date("2026-10-17T03:30:00Z"))).toBe("10/16/2026")
  })
  it("zonedTimeToUtc handles both offsets", () => {
    expect(iso(zonedTimeToUtc(2026, 7, 1, 9))).toBe("2026-07-01T13:00:00.000Z")
    expect(iso(zonedTimeToUtc(2026, 1, 15, 9))).toBe("2026-01-15T14:00:00.000Z")
  })
})
