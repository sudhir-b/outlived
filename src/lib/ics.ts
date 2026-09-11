import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Outlive } from "./people";
import { civilFromDays, daysFromCivil, formatAge, Civil } from "./dates";

const pad = (n: number) => String(n).padStart(2, "0");
const ymd = (c: Civil) => `${String(c.y).padStart(4, "0")}${pad(c.m)}${pad(c.d)}`;
const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");

export function buildIcs(outlives: Outlive[]): string {
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Outlived//EN", "CALSCALE:GREGORIAN"];
  for (const o of outlives) {
    if (o.date.y < 1900) continue;
    const end = civilFromDays(daysFromCivil(o.date) + 1);
    lines.push(
      "BEGIN:VEVENT",
      `UID:outlived-${o.person.id}@outlived`,
      `DTSTAMP:${ymd(o.date)}T000000Z`,
      `DTSTART;VALUE=DATE:${ymd(o.date)}`,
      `DTEND;VALUE=DATE:${ymd(end)}`,
      `SUMMARY:${esc(`You've outlived ${o.person.name}`)}`,
      `DESCRIPTION:${esc(`${o.person.name} (${o.person.desc}) died aged ${formatAge(o.lifespan)}. Today you have lived longer.`)}`,
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}

export async function shareIcs(outlives: Outlive[]): Promise<void> {
  const file = new File(Paths.cache, "outlived.ics");
  file.write(buildIcs(outlives));
  await Sharing.shareAsync(file.uri, { mimeType: "text/calendar", UTI: "public.calendar-event" });
}
