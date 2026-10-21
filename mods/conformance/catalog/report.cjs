#!/usr/bin/env node
// Builds the release QA report (markdown) from the area documents and the JUnit XML the suites produced.
// Results live here and in the release, never in the area documents.
//
//   node mods/conformance/catalog/report.cjs --results reports/junit --version v1.0.0 --sha abc1234 --out reports/qa-v1.0.0.md
//
// A test belongs to a catalog case when its name contains the case id, for example
//   it("[MQ-004] packet loss 5% (random)", ...)   or   func TestMQ004_Loss5Random
// Results: Pass, Fail, Blocked (skipped or errored before running), Waived (mods/conformance/catalog/waivers.json), Not run.
// Exit code 1 when the release gate fails, so the release pipeline can stop.
const fs = require("fs");
const path = require("path");

const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, all) => (v.startsWith("--") ? [...a, [v.slice(2), all[i + 1]]] : a), []));
const resultsDir = args.results || "reports/junit";
const version = args.version || "unreleased";
const sha = args.sha || "unknown";
const out = args.out || `reports/qa-${version}.md`;

// ---- catalog (area documents)
const { loadAreas } = require("./lib.cjs");
const areas = loadAreas();
const cases = areas.flatMap((a) => a.tests);
const byId = new Map(cases.map((t) => [t.id, t]));

// ---- waivers: [{ id, reason, approvedBy, expires: "2026-12-01" }]
const waiverFile = path.join(__dirname, "waivers.json");
const today = new Date().toISOString().slice(0, 10);
const waivers = new Map((fs.existsSync(waiverFile) ? JSON.parse(fs.readFileSync(waiverFile, "utf8")) : []).filter((w) => w.expires >= today).map((w) => [w.id, w]));

// ---- tiers and trials from the catalog build
const tiersFile = path.join(__dirname, "tiers.json");
const tiers = fs.existsSync(tiersFile) ? JSON.parse(fs.readFileSync(tiersFile, "utf8")) : {};

// ---- flake history and quarantine
// flake-history.json: { "<id>": [{ "sha": "...", "flaked": true|false, "at": "YYYY-MM-DD" }, ...] }  (written by the harness)
// quarantine.json:    [{ "id": "...", "since": "YYYY-MM-DD", "reason": "..." }]
const FLAKE_WINDOW = 20, QUARANTINE_DAYS = 14;
const histFile = path.join(__dirname, "flake-history.json");
const history = fs.existsSync(histFile) ? JSON.parse(fs.readFileSync(histFile, "utf8")) : {};
const flakeRate = (id) => { const h = (history[id] || []).slice(-FLAKE_WINDOW); return h.length ? h.filter((x) => x.flaked).length / h.length : 0; };
const flakes = (id) => (history[id] || []).slice(-FLAKE_WINDOW).filter((x) => x.flaked).length;
const qFile = path.join(__dirname, "quarantine.json");
const quarantine = new Map((fs.existsSync(qFile) ? JSON.parse(fs.readFileSync(qFile, "utf8")) : []).map((q) => [q.id, q]));
const daysSince = (d) => Math.floor((Date.parse(today) - Date.parse(d)) / 86400000);
const expiredQuarantine = [...quarantine.values()].filter((q) => daysSince(q.since) > QUARANTINE_DAYS);

// ---- JUnit parsing (mocha-junit-reporter, Playwright, go-junit-report, pytest)
const unesc = (s) => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");
const attr = (s, k) => { const m = s.match(new RegExp(`\\b${k}="([^"]*)"`)); return m ? unesc(m[1]) : ""; };
const rank = { Fail: 4, Blocked: 3, Pass: 1 };
const found = new Map(); // id -> { status, message, seconds, props, tests }

function walk(d) {
  return fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith(".xml") ? [path.join(d, e.name)] : [])) : [];
}
for (const file of walk(resultsDir)) {
  const xml = fs.readFileSync(file, "utf8");
  for (const m of xml.matchAll(/<testcase\b([^>]*?)(\/>|>([\s\S]*?)<\/testcase>)/g)) {
    const head = m[1], body = m[3] || "";
    const name = `${attr(head, "name")} ${attr(head, "classname")}`;
    const id = (name.match(/\b([A-Z]{2,4})[-_]?(\d{3})\b/) || []).slice(1, 3).join("-");
    if (!byId.has(id)) continue;
    let status = "Pass", message = "";
    const bad = body.match(/<(failure|error)\b([^>]*)>?([\s\S]*?)(<\/\1>|$)/);
    if (bad) { status = bad[1] === "failure" ? "Fail" : "Blocked"; message = attr(bad[2], "message") || unesc(bad[3]).trim().split("\n")[0]; }
    else if (/<skipped\b/.test(body)) { status = "Blocked"; message = "skipped"; }
    const props = [...body.matchAll(/<property\b([^>]*)\/>/g)].map((p) => [attr(p[1], "name"), attr(p[1], "value")]);
    const cur = found.get(id) || { status: "Pass", message: "", seconds: 0, props: [], tests: 0, runs: [], proven: false, rerun: false };
    if ((rank[status] || 0) >= (rank[cur.status] || 0)) { cur.status = status; if (message) cur.message = message; }
    cur.seconds += parseFloat(attr(head, "time") || "0");
    cur.props.push(...props.filter(([k]) => !["proven", "rerun", "trial"].includes(k)));
    if (props.some(([k, v]) => k === "proven" && v === "true")) cur.proven = true;
    if (props.some(([k]) => k === "rerun") || /<flakyFailure\b/.test(body)) cur.rerun = true;
    cur.runs.push(status);
    cur.tests += 1;
    found.set(id, cur);
  }
}

// ---- final status per case
const rows = cases.map((t) => {
  const r = found.get(t.id);
  const meta = tiers[t.id] || {};
  let status = r ? r.status : "Not run";
  let note = "";
  if (r && meta.trials) {
    const passed = r.runs.filter((x) => x === "Pass").length;
    if (r.runs.length < meta.trials.k) { status = "Blocked"; note = `${r.runs.length} of ${meta.trials.k} trials ran`; }
    else if (passed / r.runs.length < meta.trials.rate) { status = "Fail"; note = `${passed} of ${r.runs.length} trials passed, bar ${meta.trials.k}×${meta.trials.rate}`; }
  }
  const q = quarantine.get(t.id);
  if (q) { status = "Blocked"; note = `quarantined since ${q.since} (${daysSince(q.since)} days): ${q.reason}`; }
  const waiver = waivers.get(t.id);
  if (waiver && status !== "Pass") status = "Waived";
  const proven = !!(r && r.proven);
  return { t, status, r, waiver, note, proven, tier: meta.tier || "nightly", flakeRate: flakeRate(t.id), flakes: flakes(t.id) };
});
const count = (f) => rows.filter(f).length;
const S = ["Pass", "Fail", "Blocked", "Waived", "Not run"];
const statusCount = (list) => Object.fromEntries(S.map((s) => [s, list.filter((x) => x.status === s).length]));

// ---- gate: P0 all Pass; P1 Pass or Waived; nothing Blocked or Not run at P0/P1
const gateFails = rows.filter(({ t, status, proven }) => (t.pri === "P0" && (status !== "Pass" || !proven)) || (t.pri === "P1" && !["Pass", "Waived"].includes(status)));
const gate = gateFails.length === 0 && expiredQuarantine.length === 0 ? "PASS" : "FAIL";

// ---- markdown
const md = [];
const cell = (s) => String(s).replace(/\|/g, "\\|").replace(/\n/g, " ");
md.push(`# QA release report: ${version}`, "");
md.push(`**Gate: ${gate}**${gate === "FAIL" ? ` (${gateFails.length} blocking case${gateFails.length === 1 ? "" : "s"})` : ""}`, "");
md.push("| | |", "| --- | --- |", `| Version | ${version} |`, `| Git SHA | \`${sha}\` |`, `| Report date | ${today} |`, `| Catalog | ${cases.length} cases in ${areas.length} areas |`, `| Results read from | \`${resultsDir}\` (${walk(resultsDir).length} JUnit files) |`, "");
md.push("Gate rule: every P0 case passes **and is proven** (its test has been seen red on a seeded fault); every P1 case passes or has an unexpired waiver in `waivers.json`. A quarantined case counts as Blocked. A quarantine older than 14 days fails the build. P2 is reported, not gated.", "");
const provenCount = rows.filter((x) => x.proven).length;
md.push("## Proven", "", `| Pass | Proven (seen red on a seeded fault) | Pass but unproven |`, "| ---: | ---: | ---: |", `| ${rows.filter((x) => x.status === "Pass").length} | ${provenCount} | ${rows.filter((x) => x.status === "Pass" && !x.proven).length} |`, "");
md.push("## Tiers", "", "| Tier | Cases | Pass | Proven | Not run |", "| --- | ---: | ---: | ---: | ---: |");
for (const tr of ["pr", "nightly", "release", "production"]) { const l = rows.filter((x) => x.tier === tr); md.push(`| ${tr} | ${l.length} | ${l.filter((x) => x.status === "Pass").length} | ${l.filter((x) => x.proven).length} | ${l.filter((x) => x.status === "Not run").length} |`); }
const prTime = rows.filter((x) => x.tier === "pr" && x.r).reduce((a, x) => a + x.r.seconds, 0);
md.push("", `Last \`pr\` tier wall time (sum of reported test times): ${(prTime / 60).toFixed(1)} min. Budget: 15 min.`, "");
md.push("## Flakes and quarantine", "", "| Area | Flake rate (last 20 runs) | In quarantine |", "| --- | ---: | ---: |");
for (const a of areas) { const l = rows.filter((x) => x.t.area === a); const rate = l.length ? l.reduce((s, x) => s + x.flakeRate, 0) / l.length : 0; md.push(`| ${a.prefix} ${a.title} | ${(100 * rate).toFixed(1)}% | ${l.filter((x) => quarantine.has(x.t.id)).length} |`); }
md.push("");
if (quarantine.size) { md.push("| ID | Since | Age (days) | Reason |", "| --- | --- | ---: | --- |"); for (const q of quarantine.values()) md.push(`| ${q.id} | ${q.since} | ${daysSince(q.since)}${daysSince(q.since) > QUARANTINE_DAYS ? " (expired)" : ""} | ${cell(q.reason)} |`); md.push(""); }
if (expiredQuarantine.length) md.push(`**${expiredQuarantine.length} quarantine(s) past ${QUARANTINE_DAYS} days: fix or delete the test. The gate fails until then.**`, "");
const rerunPasses = rows.filter((x) => x.r && x.r.rerun && x.status === "Pass");
if (rerunPasses.length) md.push(`${rerunPasses.length} case(s) passed only after a rerun and were counted as flakes: ${rerunPasses.map((x) => x.t.id).join(", ")}.`, "");

const total = statusCount(rows);
md.push("## Summary", "", `| ${S.join(" | ")} | Total |`, `| ${S.map(() => "---:").join(" | ")} | ---: |`, `| ${S.map((s) => total[s]).join(" | ")} | ${rows.length} |`, "");
md.push("### By priority", "", `| Priority | ${S.join(" | ")} |`, `| --- | ${S.map(() => "---:").join(" | ")} |`);
for (const p of ["P0", "P1", "P2"]) { const c = statusCount(rows.filter((x) => x.t.pri === p)); md.push(`| ${p} | ${S.map((s) => c[s]).join(" | ")} |`); }
md.push("", "### By area", "", `| Area | ${S.join(" | ")} |`, `| --- | ${S.map(() => "---:").join(" | ")} |`);
for (const a of areas) { const c = statusCount(rows.filter((x) => x.t.area === a)); md.push(`| ${a.prefix} ${a.title} | ${S.map((s) => c[s]).join(" | ")} |`); }
md.push("");

const section = (title, list, extra) => {
  md.push(`## ${title}`, "");
  if (!list.length) { md.push("None.", ""); return; }
  md.push("| ID | Case | Priority | Detail |", "| --- | --- | --- | --- |");
  for (const x of list) md.push(`| ${x.t.id} | ${cell(x.t.name)} | ${x.t.pri} | ${cell(extra(x))} |`);
  md.push("");
};
section("Blocking the release", gateFails, (x) => `${x.status}${x.status === "Pass" && !x.proven ? " but unproven: no seeded-fault run reported" : ""}. ${x.note || (x.r && x.r.message) || (x.status === "Not run" ? "No result found for this case." : "")}`);
section("Failures", rows.filter((x) => x.status === "Fail"), (x) => `${x.note || x.r.message || "failed"}. Expected: ${x.t.pass}`);
section("Blocked (skipped, errored, incomplete trials or quarantined)", rows.filter((x) => x.status === "Blocked"), (x) => x.note || (x.r && x.r.message) || "");
section("Waived", rows.filter((x) => x.waiver), (x) => `${x.waiver.reason} (approved by ${x.waiver.approvedBy}, expires ${x.waiver.expires})`);
section("Known gaps", rows.filter((x) => /known gap/i.test(x.t.fail + x.t.pass)), (x) => `${x.status}. ${x.t.fail}`);

const withProps = rows.filter((x) => x.r && x.r.props.length);
md.push("## Measurements", "");
if (!withProps.length) md.push("No measurements were reported. Tests report numbers as JUnit properties (for example `visqol`, `latency_p95_ms`).", "");
else {
  md.push("| ID | Case | Metric | Value |", "| --- | --- | --- | --- |");
  for (const x of withProps) for (const [k, v] of x.r.props) md.push(`| ${x.t.id} | ${cell(x.t.name)} | ${k} | ${v} |`);
  md.push("");
}

md.push("## Results by area", "");
for (const a of areas) {
  md.push(`### ${a.prefix} ${a.title}`, "", `Unit under test: ${a.uut}`, "", "| ID | Case | Priority | Tier | Result | Proven | Flakes | Time (s) |", "| --- | --- | --- | --- | --- | --- | ---: | ---: |");
  for (const x of rows.filter((r) => r.t.area === a)) md.push(`| ${x.t.id} | ${cell(x.t.name)} | ${x.t.pri} | ${x.tier} | ${x.status}${x.note ? ` (${cell(x.note)})` : ""} | ${x.proven ? "yes" : ""} | ${x.flakes || ""} | ${x.r ? x.r.seconds.toFixed(1) : ""} |`);
  md.push("");
}
const unknown = [];
md.push("---", "", `Generated by \`mods/conformance/catalog/report.cjs\` from \`mods/conformance/catalog/areas\`. ${found.size} of ${cases.length} cases had results.`, "");

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, md.join("\n"));
console.log(`${out}: gate ${gate}; ${S.map((s) => `${s} ${total[s]}`).join(", ")}; proven ${provenCount}`);
process.exit(gate === "PASS" ? 0 : 1);
