#!/usr/bin/env node
// Checks the area documents and prints where each area stands. Holds no results: those are in the
// release report (report.cjs).
//
//   node mods/conformance/catalog/build.cjs [--update-lock] [--allow-new-gaps]
//
// Fails when: a case is malformed, cites a spec scenario that does not exist, reuses or drops an id;
// a test in an area's test files carries no case id; a conformance scenario file in an area's
// contracts belongs to no case; a spec scenario in an area's capabilities is uncovered and not in
// uncovered-scenarios.txt (the list may only shrink).
const fs = require("fs");
const path = require("path");
const { caseIds, catalogDir, loadAreas, loadSpecScenarios, resolveSpec, glob, testTitles } = require("./lib.cjs");

const argv = process.argv.slice(2);
const areas = loadAreas();
const all = areas.flatMap((a) => a.tests);
const { scenarios } = loadSpecScenarios();
const TIERS = ["pr", "nightly", "release", "production"];
const errors = [];

// ---- shape
for (const a of areas) {
  for (const k of ["prefix", "title", "level", "tier", "uut", "tester", "environment", "cadence"]) if (!a[k]) errors.push(`${a.file}: frontmatter is missing ${k}`);
  if (!a.diagram) errors.push(`${a.file}: no mermaid diagram`);
  if (!a.capabilities.length) errors.push(`${a.file}: frontmatter needs capabilities: (the spec capabilities this area covers)`);
  if (!TIERS.includes(a.tier)) errors.push(`${a.file}: tier must be one of ${TIERS.join(", ")}`);
}
for (const t of all) {
  if (!t.spec.length) errors.push(`${t.id}: needs - **Spec:** <capability> / <requirement> / <scenario>`);
  if (!/^P[012]$/.test(t.pri)) errors.push(`${t.id}: needs - **Priority:** P0|P1|P2`);
  if (!t.proof) errors.push(`${t.id}: needs - **Proof:** how the test is shown red`);
  if (t.fault && !fs.existsSync(path.join(catalogDir, t.fault))) errors.push(`${t.id}: fault patch ${t.fault} does not exist (relative to ${path.relative(process.cwd(), catalogDir) || "."})`);
  if (t.fault && !t.area.prove) errors.push(`${t.id}: has a fault patch but ${t.area.file} has no prove: command`);
  if (!TIERS.includes(t.tier)) errors.push(`${t.id}: tier "${t.tier}" is not one of ${TIERS.join(", ")}`);
  if (!t.pass || !t.fail) errors.push(`${t.id}: needs **Pass.** and **Fail.** lines`);
  if (/\b(manual|by hand|a human|a person)\b/i.test([t.objective, t.pass, t.fail, t.proof].join(" "))) errors.push(`${t.id}: no manual tests; reword`);
  for (const s of t.spec) if (!resolveSpec(s, scenarios)) errors.push(`${t.id}: spec "${s}" is not a scenario in openspec/specs (format: capability / requirement / scenario)`);
  for (const s of t.spec) { const r = resolveSpec(s, scenarios); if (r && !t.area.capabilities.includes(r.cap)) errors.push(`${t.id}: cites ${r.cap} but the area does not list it under capabilities:`); }
}

// ---- ids: explicit in the heading, unique, never reused for another name, never dropped
const seen = new Map();
for (const t of all) { if (seen.has(t.id)) errors.push(`${t.id} is used twice`); seen.set(t.id, t.name); }
const lockFile = path.join(catalogDir, "ids.lock.json");
const lock = fs.existsSync(lockFile) ? JSON.parse(fs.readFileSync(lockFile, "utf8")) : {};
const updateLock = argv.includes("--update-lock");
// Retired areas (retired.json: prefix -> why): their ids stay locked, never reused, with no cases.
const retiredFile = path.join(catalogDir, "retired.json");
const retired = fs.existsSync(retiredFile) ? JSON.parse(fs.readFileSync(retiredFile, "utf8")) : {};
const isRetired = (id) => id.split("-")[0] in retired;
for (const t of all) if (isRetired(t.id)) errors.push(`${t.id}: prefix ${t.id.split("-")[0]} is retired (retired.json)`);
for (const [id, name] of Object.entries(lock)) {
  if (!seen.has(id) && isRetired(id)) continue;
  if (!seen.has(id)) errors.push(`${id} ("${name}") was removed; ids are never deleted (keep the case, mark it retired in prose, or --update-lock to confirm)`.replace(/;.*--update-lock to confirm\)/, updateLock ? "; confirmed" : ";ids are never deleted"));
  else if (seen.get(id) !== name && !updateLock) errors.push(`${id} was "${name}", now "${seen.get(id)}" (rename needs --update-lock)`);
}
const newIds = [...seen.keys()].filter((id) => !(id in lock));
if (newIds.length && !updateLock) errors.push(`new ids not in ids.lock.json: ${newIds.join(", ")} (run --update-lock)`);

// ---- every test in an area's test files carries a case id from that area
const tagged = new Map(); // id -> [file:title]
const untagged = [];
for (const a of areas) {
  const ids = new Set(a.tests.map((t) => t.id));
  for (const pattern of a.testFiles) for (const file of glob(pattern)) for (const title of testTitles(file)) {
    const id = caseIds(title)[0];
    const m = id && [id, id];
    if (m && ids.has(m[1])) tagged.set(m[1], [...(tagged.get(m[1]) || []), `${file}: ${title}`]);
    else untagged.push(`${file}: "${title}"${m ? ` (tagged ${m[1]}, which is not a ${a.prefix} case)` : ""}`);
  }
}
if (untagged.length) errors.push(`${untagged.length} test(s) carry no case id; tag them [${areas.map((a) => a.prefix).join("|")}-nnn] or delete them:\n    ${untagged.join("\n    ")}`);

// ---- conformance scenario files: each file in an area's contracts belongs to a case (via Runs:)
const scenRoot = path.join(catalogDir, "..", "scenarios");
for (const a of areas) for (const t of a.tests) for (const run of t.runs) {
  const rel = run.replace(/^scenarios\//, "");
  const c = a.contracts.find((x) => rel === x || rel.startsWith(`${x}/`));
  if (!c) errors.push(`${t.id}: Runs "${run}" is not under one of the area's contracts (${a.contracts.join(", ")})`);
  else if (rel !== c && !fs.existsSync(path.join(scenRoot, rel))) errors.push(`${t.id}: Runs "${run}" matches no scenario file`);
}
for (const a of areas) for (const c of a.contracts) {
  const files = fs.existsSync(path.join(scenRoot, c)) ? fs.readdirSync(path.join(scenRoot, c)).filter((f) => f.endsWith(".yaml")) : [];
  const claimed = new Set();
  for (const t of a.tests) for (const run of t.runs) {
    const rel = run.replace(/^scenarios\//, "");
    files.filter((f) => rel === c || path.join(c, f) === rel).forEach((f) => claimed.add(f));
  }
  const orphans = files.filter((f) => !claimed.has(f));
  if (orphans.length) errors.push(`${a.prefix}: ${orphans.length} scenario file(s) under scenarios/${c} belong to no case (add - **Runs:** scenarios/${c} to a case): ${orphans.slice(0, 5).join(", ")}${orphans.length > 5 ? " ..." : ""}`);
}

// ---- spec scenario coverage over the capabilities the brought areas declare; ratchet
const inScope = new Set(areas.flatMap((a) => a.capabilities));
const covered = new Set();
for (const t of all) for (const s of t.spec) { const r = resolveSpec(s, scenarios); if (r) covered.add(r.key); }
for (const a of areas) for (const c of a.contracts) {
  const dir = path.join(scenRoot, c);
  if (!fs.existsSync(dir)) continue;
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".yaml"))) {
    const txt = fs.readFileSync(path.join(dir, f), "utf8");
    const spec = (txt.match(/^spec:\s*(.*)$/m) || [])[1];
    if (!spec) continue;
    const r = resolveSpec(`${c} / ${spec.trim().replace(/^["']|["']$/g, "")}`, scenarios);
    if (r) covered.add(r.key);
  }
}
const scoped = scenarios.filter((s) => inScope.has(s.cap));
const uncovered = scoped.filter((s) => !covered.has(s.key)).map((s) => s.key).sort();
const gapFile = path.join(catalogDir, "uncovered-scenarios.txt");
const listed = new Set(fs.existsSync(gapFile) ? fs.readFileSync(gapFile, "utf8").split("\n").filter(Boolean) : []);
const grew = uncovered.filter((k) => !listed.has(k));
const shrank = [...listed].filter((k) => inScope.has(k.split(" / ")[0]) && !uncovered.includes(k));
if (grew.length && !argv.includes("--allow-new-gaps")) errors.push(`${grew.length} spec scenario(s) in scope have no case and are not in uncovered-scenarios.txt (add a case, or --allow-new-gaps once):\n    ${grew.slice(0, 8).join("\n    ")}${grew.length > 8 ? "\n    ..." : ""}`);
if (shrank.length && !updateLock && !argv.includes("--allow-new-gaps")) errors.push(`${shrank.length} scenario(s) in uncovered-scenarios.txt are now covered; run --update-lock to shrink the list`);

// ---- write
if (updateLock || argv.includes("--allow-new-gaps")) {
  // In the lock's order, new ids last; retired ids stay.
  const next = Object.fromEntries(Object.entries(lock).filter(([id]) => seen.has(id) || isRetired(id)).map(([id, name]) => [id, seen.get(id) ?? name]));
  for (const [id, name] of seen) if (!(id in next)) next[id] = name;
  fs.writeFileSync(lockFile, JSON.stringify(next, null, 2) + "\n");
  fs.writeFileSync(gapFile, uncovered.join("\n") + (uncovered.length ? "\n" : ""));
}
fs.writeFileSync(path.join(catalogDir, "tiers.json"), JSON.stringify(Object.fromEntries(all.map((t) => [t.id, { tier: t.tier, pri: t.pri, trials: t.trials }])), null, 2) + "\n");

// ---- status
for (const a of areas) {
  // A contract case's tests are the scenario files it Runs; their titles carry the id at run time.
  const withTest = a.tests.filter((t) => tagged.has(t.id) || t.runs.length).length;
  const capScen = scenarios.filter((s) => a.capabilities.includes(s.cap));
  const capCovered = capScen.filter((s) => covered.has(s.key)).length;
  console.log(`${a.prefix} ${a.title}: ${a.tests.length} cases, ${withTest} with a tagged test, ${a.tests.filter((t) => t.proof).length} with a proof, ${a.tests.filter((t) => t.fault).length} with a fault patch; spec scenarios covered ${capCovered}/${capScen.length} (${a.capabilities.join(", ")})`);
}
if (!areas.length) console.log("no areas yet (areas/*.md)");
if (errors.length) { console.error(`\n${errors.length} problem(s):\n- ${errors.join("\n- ")}`); process.exit(1); }
