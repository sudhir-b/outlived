import raw from "../data/people.json";
import { Civil, Precision, addMonths, effective, lifespanDays, outliveDate, daysBetween, today } from "./dates";

export type Person = {
  id: string;
  name: string;
  desc: string;
  birth: Civil;
  death: Civil;
  precision: Precision;
  themes: string[];
  rank: number;
};

export const PEOPLE: Person[] = raw as Person[];
const byId = new Map(PEOPLE.map((p) => [p.id, p]));
export const personById = (id: string) => byId.get(id);

export const THEMES: { key: string; label: string; emoji: string }[] = [
  { key: "sixties", label: "Died in their 60s", emoji: "⏳" },
  { key: "music", label: "Musicians", emoji: "🎵" },
  { key: "science", label: "Scientists", emoji: "🔬" },
  { key: "power", label: "Rulers & politicians", emoji: "👑" },
  { key: "words", label: "Writers & thinkers", emoji: "✒️" },
  { key: "art", label: "Artists", emoji: "🎨" },
  { key: "screen", label: "Screen & stage", emoji: "🎬" },
  { key: "sport", label: "Sportspeople", emoji: "🏆" },
  { key: "explore", label: "Explorers & soldiers", emoji: "🧭" },
  { key: "faith", label: "Religious figures", emoji: "🕊️" },
  { key: "ancient", label: "Ancient world", emoji: "🏛️" },
];

export type Outlive = {
  person: Person;
  lifespan: number;      // days they lived
  date: Civil;           // the day the user reaches that lifespan
  daysAway: number;      // negative = already passed
};

// Dates known only to the year or month give an age, not a count of days: "about 60" means your 60th birthday.
// Adding 60 years' worth of days instead landed a day either side of it, depending on where the leap years fell.
function outlastDate(p: Person, dob: Civil, lifespan: number): Civil {
  if (p.precision === "day") return outliveDate(dob, lifespan);
  const b = effective(p.birth, p.precision), d = effective(p.death, p.precision);
  return addMonths(dob, (d.y - b.y) * 12 + (d.m - b.m));
}

export function computeOutlive(person: Person, dob: Civil, ref: Civil = today()): Outlive {
  const lifespan = lifespanDays(person.birth, person.death, person.precision);
  const date = outlastDate(person, dob, lifespan);
  return { person, lifespan, date, daysAway: daysBetween(ref, date) };
}

/** The Wikidata description without dates in brackets ("(1685–1750)", "(c. 570–632)"); they're shown alongside it anyway. */
export function describe(p: Person): string {
  return p.desc
    .replace(/\s*\((?:c\.|ca\.|fl\.|b\.|d\.|BCE|BC|CE|AD|[\d\s–—\-−?/,.])+\)/g, "")
    .replace(/\s+([;,.])/g, "$1")
    .replace(/[\s;,]+$/, "")
    .trim();
}

/** The English Wikipedia article. Wikidata redirects from the person's id, so the app doesn't need to ship titles. */
export const wikipediaUrl = (p: Person) => `https://www.wikidata.org/wiki/Special:GoToLinkedPage/enwiki/${p.id}`;

/** People who lived at least as long as you have so far: the only ones left to outlast. */
export function stillAhead(dob: Civil, ref: Civil = today()): Person[] {
  return PEOPLE.filter((p) => computeOutlive(p, dob, ref).daysAway >= 0);
}

/** Surprise me draws from the well-known end of the list so picks are people he will have heard of. */
const SURPRISE_POOL = 1500;
export function randomPeople(n: number, from: Person[], exclude: Set<string>): Person[] {
  const pool = from.slice(0, SURPRISE_POOL).filter((p) => !exclude.has(p.id));
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, n);
}
