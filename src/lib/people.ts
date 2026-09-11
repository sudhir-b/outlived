import raw from "../data/people.json";
import { Civil, Precision, lifespanDays, outliveDate, daysBetween, today } from "./dates";

export type Person = {
  id: string;
  name: string;
  desc: string;
  birth: Civil;
  death: Civil;
  precision: Precision;
  themes: string[];
  sitelinks: number;
};

export const PEOPLE: Person[] = raw as Person[];
const byId = new Map(PEOPLE.map((p) => [p.id, p]));
export const personById = (id: string) => byId.get(id);

export const THEMES: { key: string; label: string; emoji: string }[] = [
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
  { key: "young", label: "Died young", emoji: "🕯️" },
  { key: "long", label: "Lived past 90", emoji: "🌳" },
];

export type Outlive = {
  person: Person;
  lifespan: number;      // days they lived
  date: Civil;           // the day the user reaches that lifespan
  daysAway: number;      // negative = already passed
};

export function computeOutlive(person: Person, dob: Civil, ref: Civil = today()): Outlive {
  const lifespan = lifespanDays(person.birth, person.death, person.precision);
  const date = outliveDate(dob, lifespan);
  return { person, lifespan, date, daysAway: daysBetween(ref, date) };
}

export function randomPeople(n: number, exclude: Set<string>): Person[] {
  const pool = PEOPLE.filter((p) => !exclude.has(p.id));
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, n);
}
