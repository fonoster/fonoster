#!/usr/bin/env node
// Builds the QA catalog from mods/conformance/catalog/areas/*.cjs.
//   node mods/conformance/catalog/build.cjs [path-to-html] [--update-lock] [--allow-new-gaps]
// Writes test-cases.md and test-cases.csv next to this file and, when a path is given, a standalone HTML page.
const fs = require("fs");
const path = require("path");

const dir = path.join(__dirname, "areas");
const areas = fs
  .readdirSync(dir)
  .filter((f) => f.endsWith(".cjs"))
  .sort()
  .map((f) => {
    const a = require(path.join(dir, f));
    a.tests = a.tests.map((t, i) => ({ ...t, id: `${a.prefix}-${String(i + 1).padStart(3, "0")}`, area: a }));
    return a;
  });

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const all = areas.flatMap((a) => a.tests);

const ids = new Set();
for (const t of all) {
  if (ids.has(t.id)) throw new Error(`duplicate id ${t.id}`);
  ids.add(t.id);
}
const TIERS = ["pr", "nightly", "release", "production"];
for (const t of all) {
  t.tier = t.tier || t.area.tier;
  t.trials = t.trials || t.area.trials;
  if (!TIERS.includes(t.tier)) throw new Error(`${t.id} has tier "${t.tier}", expected one of ${TIERS.join(", ")}`);
  if (t.trials && !(t.trials.k >= 2 && t.trials.rate > 0 && t.trials.rate <= 1)) throw new Error(`${t.id} trials must be { k >= 2, 0 < rate <= 1 }`);
}
for (const t of all) {
  for (const k of ["name", "objective", "pre", "steps", "pass", "fail", "pri", "ref"]) {
    if (!t[k] || (Array.isArray(t[k]) && !t[k].length)) throw new Error(`${t.id} missing ${k}`);
  }
}
const tierCount = Object.fromEntries(TIERS.map((x) => [x, all.filter((t) => t.tier === x).length]));
const withProof = all.filter((t) => t.proof).length;
fs.writeFileSync(path.join(__dirname, "tiers.json"), JSON.stringify(Object.fromEntries(all.map((t) => [t.id, { tier: t.tier, pri: t.pri, trials: t.trials || null }])), null, 2) + "\n");

// ID lock: ids are positional inside an area file, and tests carry them in their names, so they must
// never move. Append new cases at the end of an area. Never reorder or delete; run with --update-lock
// to record new cases or a deliberate rename (review the lock diff). A removed id always fails.
const lockFile = path.join(__dirname, "ids.lock.json");
const lock = fs.existsSync(lockFile) ? JSON.parse(fs.readFileSync(lockFile, "utf8")) : {};
const problems = [];
for (const [id, name] of Object.entries(lock)) {
  const t = all.find((x) => x.id === id);
  if (!t) problems.push(`${id} was removed (keep the case, do not delete)`);
  else if (t.name !== name && !process.argv.includes("--update-lock")) problems.push(`${id} was "${name}", now "${t.name}" (an id moved; append instead of inserting, or run --update-lock for a rename)`);
}
if (problems.length) {
  console.error(`ID lock violated:\n  ${problems.join("\n  ")}`);
  process.exit(1);
}
if (process.argv.includes("--update-lock")) fs.writeFileSync(lockFile, JSON.stringify(Object.fromEntries(all.map((t) => [t.id, t.name])), null, 2) + "\n");
else if (all.some((t) => !(t.id in lock))) {
  console.error(`New cases not in ids.lock.json: ${all.filter((t) => !(t.id in lock)).map((t) => t.id).join(", ")}. Run with --update-lock.`);
  process.exit(1);
}

// Coverage gate: every capability in openspec/specs must be referenced by at least one case.
const specDir = path.join(__dirname, "..", "..", "..", "openspec", "specs");
const capabilities = fs.readdirSync(specDir).filter((f) => fs.statSync(path.join(specDir, f)).isDirectory()).sort();
const coverage = new Map(capabilities.map((c) => [c, []]));
for (const t of all) for (const ref of t.ref.split(",").map((x) => x.trim())) if (coverage.has(ref)) coverage.get(ref).push(t.id);
const uncovered = [...coverage].filter(([, v]) => !v.length).map(([k]) => k);
if (uncovered.length) {
  console.error(`Uncovered capabilities (no test case references them): ${uncovered.join(", ")}`);
  process.exit(1);
}
// Contract cases run conformance scenario files (`runs`: paths under mods/conformance). Every scenario
// file must belong to a case, and every `runs` entry must match files.
const pkgRoot = path.join(__dirname, "..");
const walkYaml = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walkYaml(path.join(d, e.name)) : e.name.endsWith(".yaml") ? [path.join(d, e.name)] : []));
const scenarioFiles = walkYaml(path.join(pkgRoot, "scenarios"));
const claimed = new Map();
for (const t of all) for (const run of t.runs || []) {
  const base = path.join(pkgRoot, run);
  const hit = scenarioFiles.filter((f) => f === base || f.startsWith(base + path.sep));
  if (!hit.length) { console.error(`${t.id} runs "${run}", which matches no scenario file`); process.exit(1); }
  hit.forEach((f) => claimed.set(f, [...(claimed.get(f) || []), t.id]));
}
const orphans = scenarioFiles.filter((f) => !claimed.has(f));
if (orphans.length) {
  console.error(`Scenario files not claimed by any case (add them to a case's runs): ${orphans.map((f) => path.relative(pkgRoot, f)).slice(0, 10).join(", ")}${orphans.length > 10 ? " ..." : ""}`);
  process.exit(1);
}

// Scenario-level coverage: every spec scenario must be run by a claimed conformance scenario (its
// `spec:` field) or named in a case's `covers`, or be listed in uncovered-scenarios.txt. The list is a
// ratchet: it may shrink and never grow.
const norm = (x) => x.toLowerCase().replace(/[`*_\\"]/g, "").replace(/\s+/g, " ").trim();
const specScenarios = [];
for (const cap of capabilities) {
  let req = "";
  for (const line of fs.readFileSync(path.join(specDir, cap, "spec.md"), "utf8").split("\n")) {
    let m;
    if ((m = line.match(/^### Requirement:\s*(.*)/))) req = m[1].trim();
    else if ((m = line.match(/^#### Scenario:\s*(.*)/))) specScenarios.push({ cap, req, name: m[1].trim(), key: `${cap} | ${req} / ${m[1].trim()}` });
  }
}
const covered = new Set();
const byNorm = new Map(specScenarios.map((x) => [`${x.cap}|${norm(x.req)}|${norm(x.name)}`, x]));
for (const f of scenarioFiles) {
  const txt = fs.readFileSync(f, "utf8");
  const spec = (txt.match(/^spec:\s*(.*)$/m) || [])[1];
  const cap = (txt.match(/^contract:\s*(.*)$/m) || [])[1];
  if (!spec) continue;
  const parts = spec.trim().replace(/^["']|["']$/g, "").split(" / ");
  const hit = [...byNorm.entries()].find(([k]) => k.endsWith(`|${norm(parts[0])}|${norm(parts.slice(1).join(" / "))}`));
  if (hit) covered.add(hit[1].key);
}
for (const t of all) for (const c of t.covers || []) {
  const x = specScenarios.find((s) => s.key === c);
  if (!x) { console.error(`${t.id} covers "${c}", which is not a spec scenario`); process.exit(1); }
  covered.add(x.key);
}
const gapFile = path.join(__dirname, "uncovered-scenarios.txt");
const listed = new Set(fs.existsSync(gapFile) ? fs.readFileSync(gapFile, "utf8").split("\n").filter(Boolean) : []);
const uncoveredNow = specScenarios.filter((x) => !covered.has(x.key)).map((x) => x.key);
const grew = uncoveredNow.filter((k) => !listed.has(k));
const stale = [...listed].filter((k) => !uncoveredNow.includes(k));
if (grew.length && !process.argv.includes("--allow-new-gaps")) {
  console.error(`${grew.length} spec scenarios have no test and are not in uncovered-scenarios.txt (add a case, or --allow-new-gaps):\n  ${grew.slice(0, 10).join("\n  ")}`);
  process.exit(1);
}
if (process.argv.includes("--update-lock") || process.argv.includes("--allow-new-gaps")) fs.writeFileSync(gapFile, uncoveredNow.sort().join("\n") + "\n");
else if (stale.length) {
  console.error(`${stale.length} scenarios in uncovered-scenarios.txt are now covered; run --update-lock to shrink the list.`);
  process.exit(1);
}
const scenarioStats = { total: specScenarios.length, covered: specScenarios.length - uncoveredNow.length };

const bad = all.filter((t) => /manual|by hand|human|a person/i.test([t.name, t.objective, t.pre, t.steps.join(" "), t.pass, t.fail].join(" ")));
if (bad.length) {
  console.error(`Manual wording in: ${bad.map((t) => t.id).join(", ")}`);
  process.exit(1);
}

const styled = (d) =>
  `${d}
  style TESTER fill:#0b8a9322,stroke:#0b8a93
  style UUT fill:#c26a1424,stroke:#c26a14
  ${/subgraph SUP/.test(d) ? "style SUP fill:none,stroke:#8a959c,stroke-dasharray: 4 3" : ""}
  ${/subgraph DATA/.test(d) ? "style DATA fill:none,stroke:#8a959c,stroke-dasharray: 4 3" : ""}`;

const count = (a, f) => a.tests.filter(f).length;

// ---------- Markdown ----------
const md = [];
md.push("# QA test catalog", "");
md.push("Generated by `node mods/conformance/catalog/build.cjs` from `mods/conformance/catalog/areas/*.cjs`. Edit the area files, not this file.", "");
md.push(`**${all.length} test cases in ${areas.length} areas.** Every case is automated. ${capabilities.length} spec capabilities, all covered. ${scenarioStats.covered} of ${scenarioStats.total} spec scenarios have a test (${Math.round((100 * scenarioStats.covered) / scenarioStats.total)}%); the rest are listed in \`uncovered-scenarios.txt\` and can only shrink. ${scenarioFiles.length} conformance scenario files belong to cases. Tiers: ${TIERS.map((x) => `${x} ${tierCount[x]}`).join(", ")}. ${withProof} of ${all.length} cases declare a proof (how the test is shown red); a test without one cannot merge.`, "");
md.push("## How the catalog is organized", "");
md.push("- **Area:** one part of the system, with one diagram that shows the **tester** (what drives and judges the test) and the **unit under test** (what is being judged). Anything else in the path is **support**.");
md.push("- **Test case:** ID, name, objective, preconditions, numbered steps, pass criteria, fail criteria, priority, type, traceability.");
md.push("- **Level:** L1 component, L2 integration, L3 system, L4 acceptance (manual).");
md.push("- **Priority:** P0 blocks release; P1 must pass or have a waiver; P2 tracked.");
md.push("- **Automation:** every case is automated. There is no manual test. A feature is either covered by a case that a machine runs, or it is not in the catalog and the build fails (see Coverage).");
md.push("- **Result:** recorded per run by the test runner in `test-cases.csv`: Not run, Pass, Fail, Blocked, Waived.");
md.push("- **Proven:** a case counts only once its test has been seen red against a seeded fault (`proof`). The report counts Proven separately from Pass.");
md.push("- **Tier:** pr (under 15 minutes, fakes and mocks only), nightly, release, production. Set per area, overridable per case.");
md.push("- **Trials:** a stochastic case declares `trials: { k, rate }` and is judged over all k runs; passing some runs is a Fail, not a flake.");
md.push("- **Flakes:** marked by data only, rerun once, quarantined for at most 14 days as Blocked.");
md.push("- **Known gaps:** a case that is expected to fail today says so in its fail criteria, and stays in the catalog until fixed.", "");
md.push("| Area | Level | Cases | P0 |", "| --- | --- | --- | --- |");
for (const a of areas) md.push(`| [${a.prefix} ${a.title}](#${a.prefix.toLowerCase()}) | ${a.level} | ${a.tests.length} | ${count(a, (t) => t.pri === "P0")} |`);
md.push("", "## Coverage by spec capability", "", "| Capability | Cases |", "| --- | --- |");
for (const [c, v] of coverage) md.push(`| ${c} | ${v.join(", ")} |`);
md.push("");
for (const a of areas) {
  md.push(`## ${a.prefix}`, "", `### ${a.title}`, "", a.scope, "");
  md.push("| | |", "| --- | --- |", `| Level | ${a.level} |`, `| Unit under test | ${a.uut} |`, `| Tester | ${a.tester} |`, `| Environment | ${a.env} |`, `| Cadence | ${a.cadence} |`, "");
  md.push("```mermaid", styled(a.diagram), "```", "");
  for (const t of a.tests) {
    md.push(`#### ${t.id} ${t.name}`, "");
    md.push(`${t.pri} · ${t.tier}${t.trials ? ` · trials ${t.trials.k}×${t.trials.rate}` : ""} · Ref: ${t.ref}${t.runs ? ` · Runs: ${t.runs.map((r) => `\`${r}\` (${scenarioFiles.filter((f) => f.startsWith(path.join(pkgRoot, r))).length} scenario files)`).join(", ")}` : ""}`, "");
    md.push(`**Objective.** ${t.objective}`, "", `**Preconditions.** ${t.pre}`, "", "**Steps.**", "");
    t.steps.forEach((s, i) => md.push(`${i + 1}. ${s}`));
    md.push("", `**Pass.** ${t.pass}`, "", `**Fail.** ${t.fail}`, "");
    if (t.proof) md.push(`**Proof.** ${t.proof}`, "");
  }
}
fs.writeFileSync(path.join(__dirname, "test-cases.md"), md.join("\n"));

// ---------- CSV ----------
const q = (s) => `"${String(s).replace(/"/g, '""')}"`;
const rows = [["ID", "Area", "Level", "Name", "Objective", "Preconditions", "Steps", "Pass criteria", "Fail criteria", "Priority", "Traceability", "Result", "Run date", "Git SHA", "Notes"]];
for (const t of all) rows.push([t.id, t.area.title, t.area.level, t.name, t.objective, t.pre, t.steps.map((s, i) => `${i + 1}. ${s}`).join("\n"), t.pass, t.fail, t.pri, t.ref, "Not run", "", "", ""]);
fs.writeFileSync(path.join(__dirname, "test-cases.csv"), rows.map((r) => r.map(q).join(",")).join("\n") + "\n");

// ---------- HTML ----------
const out = process.argv.slice(2).find((x) => !x.startsWith("--"));
if (out) {
  const nav = areas.map((a) => `<li><a href="#${a.prefix.toLowerCase()}"><span class="pfx">${a.prefix}</span>${esc(a.title)}<span class="n">${a.tests.length}</span></a></li>`).join("");
  const summary = areas
    .map((a) => `<tr><td><a href="#${a.prefix.toLowerCase()}">${a.prefix}</a></td><td>${esc(a.title)}</td><td>${esc(a.level)}</td><td class="num">${a.tests.length}</td><td class="num">${count(a, (t) => t.pri === "P0")}</td></tr>`)
    .join("");
  const sections = areas
    .map((a) => {
      const body = a.tests
        .map(
          (t) => `<tr data-pri="${t.pri}" data-tier="${t.tier}" data-area="${a.prefix}">
<td data-label="Test case"><div class="tid" id="${t.id.toLowerCase()}">${t.id}</div><div class="tname">${esc(t.name)}</div><div class="badges"><span class="b ${t.pri}">${t.pri}</span><span class="b">${t.tier}</span>${t.trials ? `<span class="b">${t.trials.k}× trials</span>` : ""}</div><div class="ref">${esc(t.ref)}</div>${t.runs ? `<div class="ref">runs ${t.runs.map((r) => `${esc(r)} (${scenarioFiles.filter((f) => f.startsWith(path.join(pkgRoot, r))).length})`).join(", ")}</div>` : ""}</td>
<td data-label="Description"><p><strong>Objective.</strong> ${esc(t.objective)}</p><p><strong>Preconditions.</strong> ${esc(t.pre)}</p></td>
<td data-label="Steps"><ol>${t.steps.map((s) => `<li>${esc(s)}</li>`).join("")}</ol></td>
<td data-label="Pass / Fail criteria"><p class="pass"><strong>Pass.</strong> ${esc(t.pass)}</p><p class="fail"><strong>Fail.</strong> ${esc(t.fail)}</p>${t.proof ? `<p><strong>Proof.</strong> ${esc(t.proof)}</p>` : ""}</td>
<td data-label="Result"><span class="res">Not run</span></td></tr>`,
        )
        .join("\n");
      return `<section id="${a.prefix.toLowerCase()}" class="area">
<div class="eyebrow">${a.prefix} · ${a.tests.length} cases</div>
<h2>${esc(a.title)}</h2>
<p class="scope">${esc(a.scope)}</p>
<dl class="uut">
<div><dt>Level</dt><dd>${esc(a.level)}</dd></div>
<div class="uutb"><dt>Unit under test</dt><dd>${esc(a.uut)}</dd></div>
<div class="tstb"><dt>Tester</dt><dd>${esc(a.tester)}</dd></div>
<div><dt>Environment</dt><dd>${esc(a.env)}</dd></div>
<div><dt>Cadence</dt><dd>${esc(a.cadence)}</dd></div>
</dl>
<div class="diagram"><pre class="mermaid">${esc(styled(a.diagram))}</pre></div>
<div class="tablewrap"><table class="cases"><thead><tr><th>Test case</th><th>Description</th><th>Steps</th><th>Pass / Fail criteria</th><th>Result</th></tr></thead><tbody>
${body}
</tbody></table></div>
</section>`;
    })
    .join("\n");

  const html = `<title>Fonoster QA Catalog</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&display=swap">
<style>
/* Layout: sticky area index on the left; each area shows tester and unit under test, a diagram, then the case table. */
:root {
  --bg: #f6f7f8; --surface: #ffffff; --fg: #1b2328; --muted: #5b6770; --line: #d9dfe3;
  --accent: #0b6e75; --accent-soft: #dff0f1; --uut: #b45309; --uut-soft: #fbeedb;
  --good: #1a7f3c; --bad: #b3261e; --good-soft: #e3f3e8; --bad-soft: #fbe7e5;
  --font-body: "IBM Plex Sans", system-ui, -apple-system, "Segoe UI", sans-serif;
  --font-mono: "IBM Plex Mono", ui-monospace, "SF Mono", Menlo, monospace;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --bg: #12181b; --surface: #1a2227; --fg: #e4eaed; --muted: #92a0a8; --line: #2f3a40;
    --accent: #5cc4cb; --accent-soft: #17383b; --uut: #f0b562; --uut-soft: #3a2b14;
    --good: #6fd08c; --bad: #ff8d84; --good-soft: #16301e; --bad-soft: #3b1d1b; color-scheme: dark;
  }
}
:root[data-theme="dark"] {
  --bg: #12181b; --surface: #1a2227; --fg: #e4eaed; --muted: #92a0a8; --line: #2f3a40;
  --accent: #5cc4cb; --accent-soft: #17383b; --uut: #f0b562; --uut-soft: #3a2b14;
  --good: #6fd08c; --bad: #ff8d84; --good-soft: #16301e; --bad-soft: #3b1d1b; color-scheme: dark;
}
* { box-sizing: border-box; }
body { background: var(--bg); color: var(--fg); font: 400 15px/1.55 var(--font-body); margin: 0;
  padding-block: 32px 80px; padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); }
.wrap { max-width: 1280px; margin: 0 auto; display: grid; grid-template-columns: 240px minmax(0, 1fr); gap: 40px; }
nav { position: sticky; top: calc(24px + env(safe-area-inset-top, 0px)); align-self: start; max-height: calc(100vh - 48px); overflow-y: auto; font-size: 14px; }
nav ol { list-style: none; margin: 8px 0 0; padding: 0; }
nav a { display: flex; gap: 8px; align-items: baseline; padding: 5px 8px; color: var(--fg); text-decoration: none; border-radius: 3px; }
nav a:hover, nav a:focus-visible { background: var(--accent-soft); outline: none; }
nav .pfx { font: 500 12px var(--font-mono); color: var(--accent); min-width: 34px; }
nav .n { margin-left: auto; font: 400 12px var(--font-mono); color: var(--muted); }
.eyebrow, nav .label { font: 500 12px var(--font-mono); letter-spacing: .08em; text-transform: uppercase; color: var(--muted); }
main { min-width: 0; }
h1 { font: 600 36px/1.15 var(--font-body); letter-spacing: -.02em; margin: 6px 0 10px; text-wrap: balance; }
h2 { font: 600 26px/1.25 var(--font-body); letter-spacing: -.01em; margin: 4px 0 8px; text-wrap: balance; }
h3 { font: 600 17px/1.35 var(--font-body); margin: 28px 0 8px; }
p { margin: 0 0 10px; max-width: 70ch; }
code { font: 400 .88em var(--font-mono); background: var(--accent-soft); padding: 1px 5px; border-radius: 3px; }
.lede { color: var(--muted); max-width: 70ch; }
.org { display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 12px; margin: 16px 0; }
.org div { background: var(--surface); border: 1px solid var(--line); padding: 12px 14px; }
.org strong { display: block; font: 500 12px var(--font-mono); letter-spacing: .06em; text-transform: uppercase; color: var(--accent); margin-bottom: 4px; }
.org p { font-size: 14px; margin: 0; }
.tablewrap { overflow-x: auto; margin: 12px 0 16px; border: 1px solid var(--line); background: var(--surface); }
table { border-collapse: collapse; width: 100%; font-size: 14px; }
th, td { text-align: left; vertical-align: top; padding: 10px 12px; border-bottom: 1px solid var(--line); }
th { font: 500 12px var(--font-mono); text-transform: uppercase; letter-spacing: .06em; color: var(--muted); background: var(--bg); position: sticky; top: 0; }
tr:last-child td { border-bottom: 0; }
td.num, th.num { font-variant-numeric: tabular-nums; }
.summary td, .summary th { padding: 7px 12px; }
.controls { display: flex; flex-wrap: wrap; gap: 8px; margin: 16px 0 0; }
.controls input, .controls select { font: 400 14px var(--font-body); padding: 7px 10px; border: 1px solid var(--line); background: var(--surface); color: var(--fg); border-radius: 3px; min-width: 0; }
.controls input { flex: 1 1 220px; }
.controls input:focus-visible, .controls select:focus-visible, a:focus-visible, .toggle:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.count { align-self: center; font: 400 13px var(--font-mono); color: var(--muted); }
.area { padding-top: 48px; border-top: 1px solid var(--line); margin-top: 48px; }
.scope { color: var(--muted); }
.uut { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 10px; margin: 14px 0; }
.uut > div { background: var(--surface); border: 1px solid var(--line); padding: 10px 12px; min-width: 0; }
.uut .uutb { background: var(--uut-soft); border-color: var(--uut); }
.uut .tstb { background: var(--accent-soft); border-color: var(--accent); }
.uut dt { font: 500 11px var(--font-mono); letter-spacing: .08em; text-transform: uppercase; color: var(--muted); margin-bottom: 2px; }
.uut .uutb dt { color: var(--uut); } .uut .tstb dt { color: var(--accent); }
.uut dd { margin: 0; font-size: 14px; }
.diagram { overflow-x: auto; background: var(--surface); border: 1px solid var(--line); padding: 12px; margin: 14px 0; }
.diagram pre { margin: 0; }
.cases td:first-child { min-width: 180px; width: 200px; }
.cases td:nth-child(2) { min-width: 260px; } .cases td:nth-child(3) { min-width: 260px; } .cases td:nth-child(4) { min-width: 280px; }
.cases td p { margin: 0 0 8px; } .cases td p:last-child { margin: 0; }
.cases ol { margin: 0; padding-left: 20px; } .cases li { margin-bottom: 3px; }
.tid { font: 500 13px var(--font-mono); color: var(--accent); }
.tname { font-weight: 600; margin: 2px 0 6px; }
.badges { display: flex; gap: 4px; flex-wrap: wrap; }
.b { font: 500 11px var(--font-mono); padding: 1px 6px; border: 1px solid var(--line); border-radius: 2px; color: var(--muted); }
.b.P0 { color: var(--bad); border-color: var(--bad); } .b.P1 { color: var(--uut); border-color: var(--uut); }
.ref { font: 400 12px var(--font-mono); color: var(--muted); margin-top: 6px; overflow-wrap: anywhere; }
.pass strong { color: var(--good); } .fail strong { color: var(--bad); }
.res { font: 500 12px var(--font-mono); color: var(--muted); white-space: nowrap; }
.toggle { margin-top: 16px; font: 400 13px var(--font-mono); background: none; color: var(--muted); border: 1px solid var(--line); padding: 5px 10px; cursor: pointer; border-radius: 3px; }
@media (max-width: 900px) {
  .wrap { grid-template-columns: minmax(0, 1fr); gap: 20px; }
  nav { position: static; max-height: none; }
  h1 { font-size: 28px; }
  .cases thead { display: none; }
  .cases, .cases tbody, .cases tr, .cases td { display: block; width: 100%; min-width: 0 !important; }
  .cases tr { border-bottom: 8px solid var(--bg); }
  .cases td { border-bottom: 1px solid var(--line); }
  .cases td::before { content: attr(data-label); display: block; font: 500 11px var(--font-mono); text-transform: uppercase; letter-spacing: .08em; color: var(--muted); margin-bottom: 4px; }
  .cases td:first-child { width: 100%; }
}
</style>

<div class="wrap">
<nav aria-label="Areas">
  <div class="label">Areas</div>
  <ol>
    <li><a href="#how"><span class="pfx">—</span>How it is organized</a></li>
    ${nav}
  </ol>
  <button class="toggle" id="theme" type="button">Toggle theme</button>
</nav>
<main>
<header id="how">
  <div class="eyebrow">QA test catalog · draft ${new Date().toISOString().slice(0, 10)}</div>
  <h1>Fonoster QA catalog</h1>
  <p class="lede">${all.length} test cases in ${areas.length} areas. Every case is automated; there are no manual tests. ${scenarioStats.covered} of ${scenarioStats.total} spec scenarios have a test. Each area names its tester and its unit under test, shows the systems involved, and lists the cases with steps and pass and fail criteria. A run of the whole catalog is the release gate.</p>
  <h3>How it is organized</h3>
  <div class="org">
    <div><strong>Area</strong><p>One part of the system, with one diagram. Tester (what drives and judges) is teal. Unit under test is amber. Support systems are dashed.</p></div>
    <div><strong>Level</strong><p>L1 component, L2 integration, L3 system, L4 acceptance (manual, real carriers).</p></div>
    <div><strong>Test case</strong><p>ID, name, objective, preconditions, numbered steps, pass criteria, fail criteria, priority, type, traceability to the specs.</p></div>
    <div><strong>Priority</strong><p>P0 blocks a release. P1 must pass or carry a waiver. P2 is tracked.</p></div>
    <div><strong>Automation</strong><p>Every case is run by a machine: in CI, nightly, or as a release gate. Each area states its cadence. If a feature cannot be tested by a machine, the first work item is the tool that lets it be.</p></div>
    <div><strong>Results</strong><p>Recorded by the runner in test-cases.csv: Not run, Pass, Fail, Blocked, Waived, with the date and git SHA.</p></div>
    <div><strong>Coverage gate</strong><p>The build fails if any capability in the OpenSpec specs has no case. A new capability cannot land without tests.</p></div>
    <div><strong>Proven, not just green</strong><p>A case counts only once its test has been seen red against a seeded fault, declared as its proof. The report shows Proven and Pass separately.</p></div>
    <div><strong>Tiers and trials</strong><p>pr runs under 15 minutes on fakes and mocks; nightly, release and production carry the rest. Stochastic cases declare k trials and are judged over all of them.</p></div>
    <div><strong>Flakes</strong><p>Marked by data only, rerun once, quarantined for at most 14 days as Blocked. The report shows the flake rate per area.</p></div>
    <div><strong>Known gaps</strong><p>A case that fails today because of a known gap says so in its fail criteria and stays until the fix lands.</p></div>
  </div>
  <div class="tablewrap"><table class="summary"><thead><tr><th>Area</th><th>Name</th><th>Level</th><th class="num">Cases</th><th class="num">P0</th></tr></thead><tbody>${summary}
  <tr><td></td><td><strong>Total</strong></td><td></td><td class="num"><strong>${all.length}</strong></td><td class="num"><strong>${all.filter((t) => t.pri === "P0").length}</strong></td></tr></tbody></table></div>
  <h3>Coverage by spec capability</h3>
  <div class="tablewrap"><table class="summary"><thead><tr><th>Capability</th><th>Cases</th></tr></thead><tbody>${[...coverage].map(([c, v]) => `<tr><td><code>${c}</code></td><td>${v.map((i) => `<a href="#${i.toLowerCase()}">${i}</a>`).join(", ")}</td></tr>`).join("")}</tbody></table></div>
  <div class="controls">
    <input id="q" type="search" placeholder="Search id, name, steps or criteria" aria-label="Search test cases">
    <select id="ftier" aria-label="Tier"><option value="">All tiers</option><option>pr</option><option>nightly</option><option>release</option><option>production</option></select>
    <select id="fp" aria-label="Priority"><option value="">All priorities</option><option>P0</option><option>P1</option><option>P2</option></select>
    <span class="count" id="cnt"></span>
  </div>
</header>
${sections}
</main>
</div>
<script>
(function () {
  var root = document.documentElement;
  function isDark() {
    var t = root.getAttribute("data-theme");
    return t === "dark" || (!t && window.matchMedia("(prefers-color-scheme: dark)").matches);
  }
  document.getElementById("theme").addEventListener("click", function () {
    root.setAttribute("data-theme", isDark() ? "light" : "dark");
  });
  var rows = Array.prototype.slice.call(document.querySelectorAll(".cases tbody tr"));
  rows.forEach(function (r) { r._t = r.textContent.toLowerCase(); });
  var q = document.getElementById("q"), fp = document.getElementById("fp"), ftier = document.getElementById("ftier"), cnt = document.getElementById("cnt");
  function apply() {
    var s = q.value.trim().toLowerCase(), n = 0;
    rows.forEach(function (r) {
      var ok = (!s || r._t.indexOf(s) > -1) && (!fp.value || r.dataset.pri === fp.value) && (!ftier.value || r.dataset.tier === ftier.value);
      r.hidden = !ok;
      if (ok) n++;
    });
    cnt.textContent = n + " of " + rows.length + " cases";
  }
  [q, fp, ftier].forEach(function (el) { el.addEventListener("input", apply); });
  apply();
})();
</script>`;
  fs.writeFileSync(out, html);
}
console.log(`${all.length} cases, ${areas.length} areas`);
