// Calendar maths that works for any year (including BCE), independent of JS Date quirks.
export type Civil = { y: number; m: number; d: number };
export type Precision = "day" | "month" | "year";

// Howard Hinnant's days_from_civil: days since 1970-01-01, proleptic Gregorian.
export function daysFromCivil({ y, m, d }: Civil): number {
  y -= m <= 2 ? 1 : 0;
  const era = Math.floor(y / 400);
  const yoe = y - era * 400;
  const doy = Math.floor((153 * (m + (m > 2 ? -3 : 9)) + 2) / 5) + d - 1;
  const doe = yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy;
  return era * 146097 + doe - 719468;
}

export function civilFromDays(z: number): Civil {
  z += 719468;
  const era = Math.floor(z / 146097);
  const doe = z - era * 146097;
  const yoe = Math.floor((doe - Math.floor(doe / 1460) + Math.floor(doe / 36524) - Math.floor(doe / 146096)) / 365);
  const y = yoe + era * 400;
  const doy = doe - (365 * yoe + Math.floor(yoe / 4) - Math.floor(yoe / 100));
  const mp = Math.floor((5 * doy + 2) / 153);
  const d = doy - Math.floor((153 * mp + 2) / 5) + 1;
  const m = mp + (mp < 10 ? 3 : -9);
  return { y: y + (m <= 2 ? 1 : 0), m, d };
}

export function fromDate(date: Date): Civil {
  return { y: date.getFullYear(), m: date.getMonth() + 1, d: date.getDate() };
}
export function toDate(c: Civil, hour = 0, minute = 0): Date {
  const dt = new Date(2000, 0, 1, hour, minute, 0, 0);
  dt.setFullYear(c.y, c.m - 1, c.d);
  return dt;
}
export function today(): Civil {
  return fromDate(new Date());
}

/** Effective date used for lifespan maths when precision is coarse (mid-month / mid-year). */
export function effective(c: Civil, precision: Precision): Civil {
  if (precision === "day") return c;
  if (precision === "month") return { y: c.y, m: c.m, d: 15 };
  return { y: c.y, m: 7, d: 1 };
}

export function lifespanDays(birth: Civil, death: Civil, precision: Precision): number {
  return daysFromCivil(effective(death, precision)) - daysFromCivil(effective(birth, precision));
}

/** The day on which someone born on `dob` has lived exactly `days` days. */
export function outliveDate(dob: Civil, days: number): Civil {
  return civilFromDays(daysFromCivil(dob) + days);
}

export function daysBetween(a: Civil, b: Civil): number {
  return daysFromCivil(b) - daysFromCivil(a);
}

/** Whole years and remaining months between two dates. */
export function yearsMonths(from: Civil, to: Civil): { years: number; months: number } {
  let years = to.y - from.y;
  let months = to.m - from.m;
  if (to.d < from.d) months -= 1;
  if (months < 0) { years -= 1; months += 12; }
  return { years, months };
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export function formatYear(y: number): string {
  return y <= 0 ? `${1 - y} BC` : String(y);
}
export function formatCivil(c: Civil, precision: Precision = "day"): string {
  if (precision === "year") return formatYear(c.y);
  if (precision === "month") return `${MONTHS[c.m - 1]} ${formatYear(c.y)}`;
  return `${c.d} ${MONTHS[c.m - 1]} ${formatYear(c.y)}`;
}
export function formatAge(days: number): string {
  const years = Math.floor(days / 365.2425);
  const months = Math.floor((days - years * 365.2425) / 30.436875);
  return months > 0 ? `${years}y ${months}m` : `${years}y`;
}
