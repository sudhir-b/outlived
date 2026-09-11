// One-off: pull well-known dead humans from Wikidata into src/data/people.json
// Run: node scripts/fetch-people.mjs
import { writeFileSync } from "node:fs";

const MIN_SITELINKS = 100;
const UA = { "User-Agent": "outlasted-app/1.0 (github.com/sudhir-b/outlived)", Accept: "application/sparql-results+json" };

async function sparql(q, attempt = 1) {
  const res = await fetch("https://query.wikidata.org/sparql?format=json&query=" + encodeURIComponent(q), { headers: UA });
  if (!res.ok) {
    if (attempt < 3) { await new Promise((r) => setTimeout(r, 3000 * attempt)); return sparql(q, attempt + 1); }
    throw new Error(`SPARQL ${res.status}: ${await res.text()}`);
  }
  return (await res.json()).results.bindings;
}

// Phase 1: cheap id list, sitelinks range-scan first.
const IDS_QUERY = `
SELECT ?p ?sitelinks WHERE {
  ?p wikibase:sitelinks ?sitelinks . hint:Prior hint:rangeSafe true .
  FILTER(?sitelinks >= ${MIN_SITELINKS})
  ?p wdt:P31 wd:Q5 .
  ?p wdt:P570 ?death .
}`;
// Phase 2: details for a batch of ids.
const detailsQuery = (ids) => `
SELECT ?p ?pLabel ?desc ?birth ?birthPrec ?death ?deathPrec ?occLabel WHERE {
  VALUES ?p { ${ids.map((i) => "wd:" + i).join(" ")} }
  ?p p:P569/psv:P569 [wikibase:timeValue ?birth; wikibase:timePrecision ?birthPrec].
  ?p p:P570/psv:P570 [wikibase:timeValue ?death; wikibase:timePrecision ?deathPrec].
  FILTER(?birthPrec >= 9 && ?deathPrec >= 9)
  OPTIONAL { ?p wdt:P106 ?occ. ?occ rdfs:label ?occLabel. FILTER(LANG(?occLabel)="en") }
  OPTIONAL { ?p schema:description ?desc. FILTER(LANG(?desc)="en") }
  ?p rdfs:label ?pLabel. FILTER(LANG(?pLabel)="en")
}`;

const THEMES = {
  music: ["musician", "singer", "composer", "songwriter", "pianist", "guitarist", "conductor", "rapper", "drummer", "bandleader"],
  science: ["physicist", "chemist", "mathematician", "biologist", "astronomer", "inventor", "engineer", "scientist", "naturalist", "physician", "geneticist", "botanist"],
  power: ["politician", "monarch", "emperor", "king", "queen", "president", "statesperson", "pharaoh", "prime minister", "sovereign", "head of state", "diplomat", "revolutionary", "dictator"],
  words: ["writer", "poet", "novelist", "playwright", "philosopher", "journalist", "essayist", "screenwriter", "author", "historian"],
  art: ["painter", "sculptor", "architect", "photographer", "illustrator", "fashion designer", "artist"],
  screen: ["actor", "film director", "comedian", "film producer", "presenter"],
  sport: ["footballer", "boxer", "tennis player", "association football player", "racing driver", "athlete", "cricketer", "basketball player", "baseball player", "cyclist", "golfer", "swimmer"],
  explore: ["explorer", "military officer", "soldier", "aviator", "astronaut", "navigator", "military leader", "general", "admiral", "cosmonaut", "mountaineer"],
  faith: ["religious leader", "theologian", "priest", "pope", "prophet", "saint", "rabbi", "monk", "preacher", "cleric", "bishop"],
};

function parseTime(t) {
  // "+1756-01-27T00:00:00Z" or "-0043-03-15T00:00:00Z"
  const m = /^([+-]?)(\d+)-(\d\d)-(\d\d)T/.exec(t);
  const y = (m[1] === "-" ? -1 : 1) * Number(m[2]);
  return { y, m: Math.max(1, Number(m[3])), d: Math.max(1, Number(m[4])) };
}

const idRows = await sparql(IDS_QUERY);
const sitelinksById = new Map(idRows.map((r) => [r.p.value.split("/").pop(), Number(r.sitelinks.value)]));
const ids = [...sitelinksById.keys()];
console.log(`phase 1: ${ids.length} candidates`);
const rows = [];
for (let i = 0; i < ids.length; i += 150) {
  rows.push(...(await sparql(detailsQuery(ids.slice(i, i + 150)))));
  process.stdout.write(`\rphase 2: ${Math.min(i + 150, ids.length)}/${ids.length}`);
}
console.log();

const byId = new Map();
for (const r of rows) {
  const id = r.p.value.split("/").pop();
  let e = byId.get(id);
  if (!e) {
    const b = parseTime(r.birth.value), d = parseTime(r.death.value);
    const prec = Math.min(Number(r.birthPrec.value), Number(r.deathPrec.value));
    e = {
      id, name: r.pLabel.value, desc: r.desc?.value ?? "",
      birth: b, death: d, precision: prec >= 11 ? "day" : prec === 10 ? "month" : "year",
      sitelinks: sitelinksById.get(id), occupations: new Set(),
    };
    byId.set(id, e);
  }
  if (r.occLabel) e.occupations.add(r.occLabel.value.toLowerCase());
}

const people = [...byId.values()]
  .map((e) => {
    const occ = [...e.occupations];
    const themes = new Set();
    for (const [theme, words] of Object.entries(THEMES)) if (occ.some((o) => words.some((w) => o === w || o.includes(w)))) themes.add(theme);
    // "writer" is attached to almost everyone famous; only keep the words theme when it is their main thing.
    const STRONG_WORDS = ["poet", "novelist", "playwright", "philosopher", "essayist", "historian", "author"];
    if (themes.has("words") && themes.size > 1 && !occ.some((o) => STRONG_WORDS.some((w) => o.includes(w)))) themes.delete("words");
    if (e.death.y < 500) themes.add("ancient");
    const ageYears = e.death.y - e.birth.y - ((e.death.m < e.birth.m || (e.death.m === e.birth.m && e.death.d < e.birth.d)) ? 1 : 0);
    if (ageYears < 40) themes.add("young");
    if (ageYears >= 90) themes.add("long");
    return { id: e.id, name: e.name, desc: e.desc, birth: e.birth, death: e.death, precision: e.precision, themes: [...themes], sitelinks: e.sitelinks };
  })
  .filter((p) => p.death.y - p.birth.y >= 5 && p.death.y - p.birth.y <= 125)
  .sort((a, b) => b.sitelinks - a.sitelinks);

writeFileSync(new URL("../src/data/people.json", import.meta.url), JSON.stringify(people));
console.log(`wrote ${people.length} people`);
const counts = {};
for (const p of people) for (const t of p.themes) counts[t] = (counts[t] ?? 0) + 1;
console.log(counts);
console.log("no theme:", people.filter((p) => p.themes.length === 0).length);
