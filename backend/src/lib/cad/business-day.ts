// Calendar helpers in Cardinal's time zone (America/New_York, Miami; plan B7). Pure.
// - capDayFor: the "day" of the site-wide generation cap.
// - nextReleaseAt: when a Queued CAD Request is released automatically: 09:00 Eastern on the next
//   business day (Mon–Fri) after the day it was queued. US holidays are ignored (as on Sanitube).
// - drawnDateFor: the DRAWN date in the PDF title block, "MM/DD/YYYY".

export const CAD_TIME_ZONE = "America/New_York"
export const CAD_RELEASE_HOUR = 9

type ZonedParts = { year: number; month: number; day: number; hour: number; minute: number; second: number; weekday: number }

const partsFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: CAD_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  weekday: "short",
  hourCycle: "h23",
})

const WEEKDAYS: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }

function zonedParts(d: Date): ZonedParts {
  const out: Record<string, string> = {}
  for (const p of partsFormatter.formatToParts(d)) out[p.type] = p.value
  return {
    year: Number(out.year),
    month: Number(out.month),
    day: Number(out.day),
    hour: Number(out.hour) % 24,
    minute: Number(out.minute),
    second: Number(out.second),
    weekday: WEEKDAYS[out.weekday] ?? 0,
  }
}

/** Offset of America/New_York from UTC at instant `d`, in ms (EDT = −4 h, EST = −5 h). */
function zoneOffsetMs(d: Date): number {
  const p = zonedParts(d)
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second)
  return asUtc - Math.floor(d.getTime() / 1000) * 1000
}

/** The UTC instant of a wall-clock time in America/New_York. */
export function zonedTimeToUtc(year: number, month: number, day: number, hour = 0, minute = 0): Date {
  const guess = Date.UTC(year, month - 1, day, hour, minute)
  let t = guess - zoneOffsetMs(new Date(guess))
  // Second pass settles the offset when the guess straddled a DST change.
  t = guess - zoneOffsetMs(new Date(t))
  return new Date(t)
}

const pad = (n: number, w = 2) => String(n).padStart(w, "0")

/** "2026-10-16": the America/New_York calendar day of `now`. */
export function capDayFor(now: Date): string {
  const p = zonedParts(now)
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`
}

/** "10/16/2026": the title-block DRAWN date for `now` (America/New_York). */
export function drawnDateFor(now: Date): string {
  const p = zonedParts(now)
  return `${pad(p.month)}/${pad(p.day)}/${p.year}`
}

/** 09:00 America/New_York on the first Mon–Fri day after `queuedAt`'s Eastern calendar day. */
export function nextReleaseAt(queuedAt: Date): Date {
  const p = zonedParts(queuedAt)
  // Walk calendar days in UTC-noon space (no DST issues), starting tomorrow.
  const cursor = new Date(Date.UTC(p.year, p.month - 1, p.day, 12))
  do {
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  } while (cursor.getUTCDay() === 0 || cursor.getUTCDay() === 6)
  return zonedTimeToUtc(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, cursor.getUTCDate(), CAD_RELEASE_HOUR)
}
