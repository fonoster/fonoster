// Runs every case of an area once and leaves its JUnit for report.cjs (the release gate's results;
// prove.cjs adds the proof records).
//
//   node mods/conformance/catalog/run.cjs --area DSH [--out reports/junit/run-DSH]
//
// The area's frontmatter may name the command (`run:`, with {junitDir}); otherwise its prove:
// command runs with {id} set to a pattern matching every case of the area ("DSH-\d{3}"), since
// every prove script selects tests by `[{id}]` in their titles. QA_RUN=1 tells a script it runs
// the whole area (e.g. to add the real-stack or Python parts). A run that fails still writes its
// JUnit: whether the release may go is the report's call, so this exits 0 unless nothing ran.
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const { repoRoot, loadAreas } = require("./lib.cjs");

const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, all) => (v.startsWith("--") ? [...a, [v.slice(2), all[i + 1]]] : a), []));
const prefix = args.area;
const area = loadAreas().find((a) => a.prefix === prefix);
if (!area) { console.error(`no area with prefix ${prefix} (--area)`); process.exit(2); }
const template = area.run || area.prove;
if (!template) { console.error(`${area.file} has neither run: nor prove:`); process.exit(2); }
const out = path.resolve(repoRoot, args.out || path.join("reports", "junit", `run-${prefix}`));
fs.mkdirSync(out, { recursive: true });
const cmd = template
  .replace(/\{id\}/g, `'${prefix}-\\d{3}'`)
  .replace(/\{junitDir\}/g, out)
  .replace(/\{junit\}/g, path.join(out, "junit.xml"));
console.log(`${prefix}: ${cmd}`);
const started = Date.now();
const r = spawnSync("sh", ["-c", cmd], { cwd: repoRoot, stdio: "inherit", env: { ...process.env, QA_RUN: "1" } });
const files = fs.readdirSync(out).filter((f) => f.endsWith(".xml"));
console.log(`${prefix}: exit ${r.status}, ${files.length} JUnit file(s) in ${path.relative(repoRoot, out)}, ${Math.round((Date.now() - started) / 1000)}s`);
process.exit(files.length ? 0 : 1);
