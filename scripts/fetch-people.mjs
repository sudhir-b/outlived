// One-off: pull well-known dead humans from Wikidata into src/data/people.json
// Run: node scripts/fetch-people.mjs
import { writeFileSync, readFileSync, existsSync, mkdirSync } from "node:fs";
import { execSync } from "node:child_process";

// Pantheon (pantheon.world, CC BY): curated famous people with a clean occupation and a popularity index (hpi).
const PANTHEON_URL = "https://storage.googleapis.com/pantheon-public-data/person_2025_update.csv.bz2";
const PANTHEON_TOP = 5000;
const CACHE = new URL("../.cache/", import.meta.url);

function parseCsv(text) {
  const rows = [];
  let row = [], field = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') q = false;
      else field += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (c !== "\r") field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  const [header, ...rest] = rows;
  return rest.filter((r) => r.length === header.length).map((r) => Object.fromEntries(header.map((h, i) => [h, r[i]])));
}

function loadPantheon() {
  mkdirSync(CACHE, { recursive: true });
  const csv = new URL("pantheon.csv", CACHE);
  if (!existsSync(csv)) {
    console.log("downloading Pantheon...");
    execSync(`curl -sL -o "${csv.pathname}.bz2" "${PANTHEON_URL}" && bunzip2 -f "${csv.pathname}.bz2"`);
  }
  return parseCsv(readFileSync(csv, "utf8"))
    .filter((r) => r.deathyear && r.wd_id?.startsWith("Q") && r.is_group !== "TRUE" && r.hpi)
    .sort((a, b) => Number(b.hpi) - Number(a.hpi))
    .slice(0, PANTHEON_TOP);
}

const PANTHEON_THEMES = {
  music: ["COMPOSER", "MUSICIAN", "SINGER", "CONDUCTOR"],
  science: ["BIOLOGIST", "MATHEMATICIAN", "PHYSICIST", "PHYSICIAN", "ASTRONOMER", "CHEMIST", "INVENTOR", "ENGINEER", "COMPUTER SCIENTIST", "PSYCHOLOGIST", "ECONOMIST", "GEOGRAPHER", "ANTHROPOLOGIST", "ARCHAEOLOGIST", "GEOLOGIST", "STATISTICIAN", "SOCIOLOGIST"],
  power: ["POLITICIAN", "NOBLEMAN", "COMPANION", "SOCIAL ACTIVIST"],
  words: ["WRITER", "PHILOSOPHER", "HISTORIAN", "JOURNALIST", "LINGUIST"],
  art: ["PAINTER", "ARCHITECT", "SCULPTOR", "PHOTOGRAPHER", "ARTIST", "COMIC ARTIST", "DANCER", "FASHION DESIGNER", "DESIGNER"],
  screen: ["ACTOR", "FILM DIRECTOR", "CELEBRITY", "PRESENTER", "COMEDIAN", "PRODUCER"],
  sport: ["SOCCER PLAYER", "ATHLETE", "RACING DRIVER", "CYCLIST", "WRESTLER", "CHESS PLAYER", "BOXER", "SWIMMER", "GYMNAST", "FENCER", "SKATER", "SKIER", "COACH", "REFEREE", "MOUNTAINEER"],
  explore: ["MILITARY PERSONNEL", "EXPLORER", "ASTRONAUT", "PILOT"],
  faith: ["RELIGIOUS FIGURE"],
};
function pantheonTheme(occ) {
  if (!occ) return null;
  if (occ.endsWith(" PLAYER")) return "sport";
  for (const [t, list] of Object.entries(PANTHEON_THEMES)) if (list.includes(occ)) return t;
  return null;
}

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

const pantheon = loadPantheon();
const pantheonById = new Map(pantheon.map((r) => [r.wd_id, r]));
console.log(`pantheon: ${pantheon.length} people`);
const idRows = await sparql(IDS_QUERY);
const sitelinksById = new Map(idRows.map((r) => [r.p.value.split("/").pop(), Number(r.sitelinks.value)]));
const ids = [...new Set([...sitelinksById.keys(), ...pantheonById.keys()])];
console.log(`phase 1: ${sitelinksById.size} from wikidata, ${ids.length} after union`);
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
      id, name: r.pLabel.value, desc: (r.desc?.value ?? "").slice(0, 80),
      birth: b, death: d, precision: prec >= 11 ? "day" : prec === 10 ? "month" : "year",
      sitelinks: sitelinksById.get(id) ?? 0, pantheon: pantheonById.get(id), occupations: new Set(),
    };
    byId.set(id, e);
  }
  if (r.occLabel) e.occupations.add(r.occLabel.value.toLowerCase());
}

const people = [...byId.values()]
  .map((e) => {
    // Wikidata can carry several competing birth/death claims (e.g. the Buddha). When Pantheon's years disagree
    const py = e.pantheon && Number(e.pantheon.birthyear), pd = e.pantheon && Number(e.pantheon.deathyear);
    // with the ones we picked by more than a couple of years, trust Wikidata only if it has exact dates; otherwise drop them.
    if (Number.isFinite(py) && Number.isFinite(pd) && Math.abs((e.death.y - e.birth.y) - (pd - py)) > 2 && e.precision !== "day") {
      e.disputed = true;
    }
    const occ = [...e.occupations];
    const themes = new Set();
    const pt = pantheonTheme(e.pantheon?.occupation);
    if (pt) themes.add(pt);
    else for (const [theme, words] of Object.entries(THEMES)) if (occ.some((o) => words.some((w) => o === w || o.includes(w)))) themes.add(theme);
    // "writer" is attached to almost everyone famous; only keep the words theme when it is their main thing.
    const STRONG_WORDS = ["poet", "novelist", "playwright", "philosopher", "essayist", "historian", "author"];
    if (themes.has("words") && themes.size > 1 && !occ.some((o) => STRONG_WORDS.some((w) => o.includes(w)))) themes.delete("words");
    if (e.death.y < 500) themes.add("ancient");
    const ageYears = e.death.y - e.birth.y - ((e.death.m < e.birth.m || (e.death.m === e.birth.m && e.death.d < e.birth.d)) ? 1 : 0);
    if (ageYears < 40) themes.add("young");
    if (ageYears >= 90) themes.add("long");
    // rank: Pantheon popularity index where we have it, otherwise a rough equivalent from sitelinks.
    const rank = e.pantheon ? Number(e.pantheon.hpi) : 50 + e.sitelinks / 8;
    if (e.disputed) return null;
    return { id: e.id, name: e.name, desc: e.desc, birth: e.birth, death: e.death, precision: e.precision, themes: [...themes], rank: Math.round(rank * 10) / 10 };
  })
  .filter((p) => p && p.death.y - p.birth.y >= 15 && p.death.y - p.birth.y <= 125)
  .sort((a, b) => b.rank - a.rank);

writeFileSync(new URL("../src/data/people.json", import.meta.url), JSON.stringify(people));
console.log(`wrote ${people.length} people (${[...byId.values()].filter((e) => e.disputed).length} dropped as disputed)`);
const counts = {};
for (const p of people) for (const t of p.themes) counts[t] = (counts[t] ?? 0) + 1;
console.log(counts);
console.log("no theme:", people.filter((p) => p.themes.length === 0).length);
