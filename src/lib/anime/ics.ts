import type { ScheduleByDay } from "@/types/anime";

/**
 * Weekly release schedule as an iCalendar feed.
 *
 * Every event is a weekly-recurring all-day entry, not a timed one: the
 * upstream only ever tells us the *day* a title airs, never the hour, and a
 * calendar app that shows "10:00" for something we don't actually know would
 * be lying to the user. All-day + `RRULE` is the honest representation of
 * data this shape.
 */

const DAY_CODE: Record<string, string> = {
  minggu: "SU",
  senin: "MO",
  selasa: "TU",
  rabu: "WE",
  kamis: "TH",
  jumat: "FR",
  sabtu: "SA",
};

/** Escape the handful of characters RFC 5545 requires escaped in TEXT values. */
function escapeText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

function foldLine(line: string): string {
  // RFC 5545 §3.1: lines over 75 octets must be folded with a leading space
  // on the continuation. Most calendar apps tolerate long lines, but Outlook
  // and some parsers reject the feed outright without this.
  if (line.length <= 75) return line;
  const chunks: string[] = [];
  let rest = line;
  while (rest.length > 75) {
    chunks.push(rest.slice(0, 75));
    rest = " " + rest.slice(75);
  }
  chunks.push(rest);
  return chunks.join("\r\n");
}

/** The next date (YYYYMMDD) that falls on `weekday`, counting today. */
function nextOccurrence(weekday: number, from = new Date()): string {
  const date = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
  const delta = (weekday - date.getUTCDay() + 7) % 7;
  date.setUTCDate(date.getUTCDate() + delta);
  return date.toISOString().slice(0, 10).replace(/-/g, "");
}

const WEEKDAY_INDEX: Record<string, number> = {
  SU: 0,
  MO: 1,
  TU: 2,
  WE: 3,
  TH: 4,
  FR: 5,
  SA: 6,
};

export function scheduleToIcs(days: ScheduleByDay[], siteUrl: string): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Natee//Anime Release Schedule//ID",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Jadwal Rilis Anime — Natee",
    "X-WR-CALDESC:Jadwal tayang mingguan, diperbarui otomatis dari otakudesu.natee.my.id",
    "REFRESH-INTERVAL;VALUE=DURATION:PT6H",
  ];

  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");

  for (const day of days) {
    const code = DAY_CODE[day.day.toLowerCase()];
    if (!code) continue;
    const start = nextOccurrence(WEEKDAY_INDEX[code]!);

    for (const anime of day.anime_list) {
      if (!anime.slug) continue;

      lines.push(
        "BEGIN:VEVENT",
        `UID:${anime.slug}-weekly@natee`,
        `DTSTAMP:${stamp}`,
        `DTSTART;VALUE=DATE:${start}`,
        `RRULE:FREQ=WEEKLY;BYDAY=${code}`,
        `SUMMARY:${escapeText(anime.anime_name)}`,
        `URL:${siteUrl}/anime/${anime.slug}`,
        "END:VEVENT",
      );
    }
  }

  lines.push("END:VCALENDAR");
  return lines.map(foldLine).join("\r\n") + "\r\n";
}
