#!/usr/bin/env node
// Proves cases: applies each case's fault patch, runs only that case, expects it red, reverts.
// Writes one JUnit proof record per case (property proof=true, proven=true|false) for report.cjs.
//
//   node mods/conformance/catalog/prove.cjs --area API [--case API-003,API-007] [--out reports/junit/proofs-API.xml]
//
// The area's frontmatter names the command that runs one case and writes JUnit:
//   prove: npx mocha --config mods/conformance/api/.mocharc.cjs --grep "\[{id}\]" --reporter xunit --reporter-option output={junit}
// {id} is the case id, {junit} a file and {junitDir} an empty directory this script reads back (every
// .xml in it, for cases whose tests span several runs). A case is proven only when that JUnit has a
// test carrying the id with a failure: a command that crashes before running the case (a fault that
// breaks the build) proves nothing. A case with no **Fault:** patch is unproven.
// An optional reset: command runs after each fault is reverted, with PROVE_FILES set to the files the
// fault touched (to rebuild a package the command built with the fault in it).
// Exit code 1 when any selected case is not proven.
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync, spawnSync } = require("child_process");
const { catalogDir, repoRoot, loadAreas } = require("./lib.cjs");

const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, all) => (v.startsWith("--") ? [...a, [v.slice(2), all[i + 1]]] : a), []));
const prefix = args.area;
const only = args.case ? new Set(args.case.split(",")) : null;
const timeout = Number(args.timeout || 600) * 1000;

const area = loadAreas().find((a) => a.prefix === prefix);
if (!area) { console.error(`no area with prefix ${prefix} (--area)`); process.exit(2); }
if (!area.prove) { console.error(`${area.file} has no prove: command`); process.exit(2); }
const out = args.out || path.join("reports", "junit", `proofs-${prefix}.xml`);
const cases = area.tests.filter((t) => !only || only.has(t.id));
if (only) for (const id of only) if (!cases.some((t) => t.id === id)) { console.error(`${id} is not a ${prefix} case`); process.exit(2); }

const git = (...a) => execFileSync("git", a, { cwd: repoRoot, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// The fault being applied, so an interrupted run still reverts it.
let applied = null;
const revert = () => { if (applied) { try { git("apply", "-R", applied); } catch (e) { console.error(`could not revert ${applied}: ${e.message}`); } applied = null; } };
for (const sig of ["SIGINT", "SIGTERM"]) process.on(sig, () => { revert(); process.exit(130); });

// The ids that failed in the JUnit files of a directory.
function redIds(dir) {
  const ids = new Set();
  for (const f of fs.readdirSync(dir).filter((n) => n.endsWith(".xml"))) {
    const xml = fs.readFileSync(path.join(dir, f), "utf8");
    for (const m of xml.matchAll(/<testcase\b([^>]*?)(\/>|>([\s\S]*?)<\/testcase>)/g)) {
      if (!/<(failure|error)\b/.test(m[3] || "")) continue;
      for (const id of m[1].matchAll(/\b([A-Z]{2,4}-\d{3})\b/g)) ids.add(id[1]);
    }
  }
  return ids;
}

function prove(t) {
  if (!t.fault) return { proven: false, why: "no fault patch" };
  const patch = path.join(catalogDir, t.fault);
  if (!fs.existsSync(patch)) return { proven: false, why: `fault patch ${t.fault} not found` };
  const files = git("apply", "--numstat", patch).trim().split("\n").filter(Boolean).map((l) => l.split("\t")[2]);
  // Never revert someone's edits: the files the fault touches must be clean.
  const dirty = files.filter((f) => git("status", "--porcelain", "--", f).trim());
  if (dirty.length) return { proven: false, why: `uncommitted changes in ${dirty.join(", ")}` };
  try { git("apply", "--check", patch); } catch (e) { return { proven: false, why: `fault does not apply: ${e.stderr.trim().split("\n")[0]}` }; }
  const junitDir = fs.mkdtempSync(path.join(os.tmpdir(), "prove-"));
  const junit = path.join(junitDir, "junit.xml");
  const cmd = area.prove.replace(/\{id\}/g, t.id).replace(/\{junitDir\}/g, junitDir).replace(/\{junit\}/g, junit);
  const started = Date.now();
  // PROVE_FILES: what the fault touches, for commands that must rebuild a package around it.
  const env = { ...process.env, MOCHA_FILE: junit, PROVE_FILES: files.join(" ") };
  git("apply", patch);
  applied = patch;
  let run;
  try { run = spawnSync(cmd, { cwd: repoRoot, shell: true, encoding: "utf8", timeout, env }); }
  finally {
    revert();
    // The area's reset: command undoes what the run left behind (a package built with the fault).
    if (area.reset) spawnSync(area.reset, { cwd: repoRoot, shell: true, stdio: "inherit", env });
  }
  const seconds = (Date.now() - started) / 1000;
  if (run.error) return { proven: false, why: `command did not finish: ${run.error.message}`, seconds };
  if (redIds(junitDir).has(t.id)) return { proven: true, why: `red on ${t.fault}`, seconds };
  return { proven: false, why: run.status === 0 ? `stayed green on ${t.fault}` : `no failing test carries ${t.id} (exit ${run.status}): ${(run.stderr || run.stdout || "").trim().split("\n").slice(-1)[0] || ""}`, seconds };
}

const results = [];
for (const t of cases) {
  const r = prove(t);
  results.push({ t, ...r });
  console.log(`${r.proven ? "proven  " : "UNPROVEN"} ${t.id} ${t.name}: ${r.why}`);
}

fs.mkdirSync(path.dirname(path.resolve(repoRoot, out)), { recursive: true });
fs.writeFileSync(path.resolve(repoRoot, out), [
  '<?xml version="1.0" encoding="UTF-8"?>',
  `<testsuites name="proofs"><testsuite name="proofs ${esc(prefix)}" tests="${results.length}">`,
  ...results.map(({ t, proven, why, seconds }) => `<testcase classname="proof" name="[${t.id}] proof" time="${(seconds || 0).toFixed(1)}"><properties><property name="proof" value="true"/><property name="proven" value="${proven}"/></properties><system-out>${esc(why)}</system-out></testcase>`),
  "</testsuite></testsuites>",
  "",
].join("\n"));
const unproven = results.filter((r) => !r.proven).length;
console.log(`${out}: ${results.length - unproven} of ${results.length} proven`);
process.exit(unproven ? 1 : 0);
