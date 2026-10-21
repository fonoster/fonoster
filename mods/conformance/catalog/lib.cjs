// Shared by build.cjs and report.cjs: reads the area documents (areas/*.md) and the OpenSpec scenarios.
//
// An area document is markdown with a YAML-like frontmatter and one `### <ID> <Name>` heading per
// case. Fields under a case are `- **Field:** value` lines. Prose between them is for people.
const fs = require("fs");
const path = require("path");

// The overrides are for the scripts' own tests, which run them on a throwaway repository.
const catalogDir = process.env.CATALOG_DIR || __dirname;
const repoRoot = process.env.CATALOG_REPO_ROOT || path.join(__dirname, "..", "..", "..");
const specDir = path.join(repoRoot, "openspec", "specs");

const norm = (s) => String(s).toLowerCase().replace(/[`*_\\"]/g, "").replace(/\s+/g, " ").trim();

// Minimal frontmatter: `key: value` and `key:` followed by `  - item` lines. Enough for areas.
function parseFrontmatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---\n/);
  if (!m) throw new Error("missing frontmatter");
  const out = {};
  let key = null;
  for (const line of m[1].split("\n")) {
    const kv = line.match(/^([a-zA-Z_]+):\s*(.*)$/);
    const item = line.match(/^\s+-\s+(.*)$/);
    if (kv) { key = kv[1]; out[key] = kv[2] === "" ? [] : kv[2].replace(/^["']|["']$/g, ""); }
    else if (item && key && Array.isArray(out[key])) out[key].push(item[1].replace(/^["']|["']$/g, ""));
  }
  return { meta: out, body: text.slice(m[0].length) };
}

function parseCases(body, prefix, file) {
  const parts = body.split(/^(?=### )/m).slice(1);
  return parts.map((part) => {
    const head = part.match(/^### ([A-Z]{2,4}-\d{3}) (.+)$/m);
    if (!head) throw new Error(`${file}: a case heading must read "### ${prefix}-001 Name": ${part.split("\n")[0]}`);
    const [, id, name] = head;
    if (!id.startsWith(prefix + "-")) throw new Error(`${file}: ${id} does not use the area prefix ${prefix}`);
    const fields = {};
    for (const f of part.matchAll(/^- \*\*([A-Za-z ]+):\*\*\s*(.*)$/gm)) {
      const k = f[1].toLowerCase();
      fields[k] = fields[k] ? [].concat(fields[k], f[2].trim()) : f[2].trim();
    }
    const prose = part.replace(/^### .*$/m, "").replace(/^- \*\*[A-Za-z ]+:\*\*.*$/gm, "").trim();
    const pass = (part.match(/\*\*Pass\.\*\*\s*([^\n]+)/) || [])[1] || "";
    const fail = (part.match(/\*\*Fail\.\*\*\s*([^\n]+)/) || [])[1] || "";
    const trials = fields.trials ? (String(fields.trials).match(/(\d+)\s*[x×]\s*([\d.]+)/) || []) : null;
    return {
      id, name: name.trim(),
      spec: [].concat(fields.spec || []),
      pri: fields.priority || "",
      tier: fields.tier || "",
      proof: fields.proof || "",
      fault: fields.fault || "",
      test: fields.test || "",
      runs: [].concat(fields.runs || []),
      trials: trials && trials[1] ? { k: Number(trials[1]), rate: Number(trials[2]) } : null,
      objective: prose.split("\n\n")[0] || "",
      pass, fail,
    };
  });
}

function loadAreas() {
  const dir = path.join(catalogDir, "areas");
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith(".md")).sort().map((f) => {
    const file = path.join(dir, f);
    const { meta, body } = parseFrontmatter(fs.readFileSync(file, "utf8"));
    const area = { file: path.relative(repoRoot, file), ...meta, tests: [] };
    area.capabilities = [].concat(meta.capabilities || []);
    area.contracts = [].concat(meta.contracts || []);
    area.testFiles = [].concat(meta.tests || []);
    area.diagram = (body.match(/```mermaid\n([\s\S]*?)```/) || [])[1] || "";
    area.scope = (body.replace(/^# .*$/m, "").split(/^## /m)[0] || "").trim();
    area.tests = parseCases(body.split(/^## Cases\s*$/m)[1] || "", meta.prefix, area.file).map((t) => ({ ...t, area, tier: t.tier || meta.tier }));
    return area;
  });
}

// Main specs, plus the ADDED and MODIFIED requirements of open changes (openspec/changes/*, not the
// archive), so a case can cite a scenario that is proposed but not yet synced. Those carry
// `proposed: "<change>"`. REMOVED (and MODIFIED) requirements of a started change are dropped from the
// main set; an unstarted one (no task checked) only adds, so what ships stays citable.
function readScenarios(file, cap, proposed) {
  const out = [];
  let req = "", section = "";
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    let m;
    if ((m = line.match(/^## (ADDED|MODIFIED|REMOVED|RENAMED) Requirements/))) section = m[1];
    else if ((m = line.match(/^### Requirement:\s*(.*)/))) req = m[1].trim();
    else if ((m = line.match(/^#### Scenario:\s*(.*)/)) && (!proposed || section === "ADDED" || section === "MODIFIED")) {
      out.push({ cap, req, name: m[1].trim(), key: `${cap} / ${req} / ${m[1].trim()}`, nkey: `${cap}|${norm(req)}|${norm(m[1])}`, proposed });
    }
  }
  return out;
}
function removedRequirements(file) {
  const out = new Set();
  let section = "";
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    let m;
    if ((m = line.match(/^## (ADDED|MODIFIED|REMOVED|RENAMED) Requirements/))) section = m[1];
    else if ((m = line.match(/^### Requirement:\s*(.*)/)) && (section === "REMOVED" || section === "MODIFIED")) out.add(norm(m[1]));
  }
  return out;
}
function loadSpecScenarios() {
  const caps = fs.readdirSync(specDir).filter((c) => fs.statSync(path.join(specDir, c)).isDirectory()).sort();
  let scenarios = caps.flatMap((cap) => readScenarios(path.join(specDir, cap, "spec.md"), cap, null));
  const changesDir = path.join(repoRoot, "openspec", "changes");
  const changes = fs.existsSync(changesDir) ? fs.readdirSync(changesDir).filter((c) => c !== "archive" && fs.statSync(path.join(changesDir, c)).isDirectory()) : [];
  for (const change of changes) {
    const specs = path.join(changesDir, change, "specs");
    if (!fs.existsSync(specs)) continue;
    // An unstarted proposal (no task checked) adds its scenarios but does not replace what ships yet.
    const tasks = path.join(changesDir, change, "tasks.md");
    const started = !fs.existsSync(tasks) || /^\s*- \[x\]/im.test(fs.readFileSync(tasks, "utf8"));
    for (const cap of fs.readdirSync(specs)) {
      const file = path.join(specs, cap, "spec.md");
      if (!fs.existsSync(file)) continue;
      const gone = started ? removedRequirements(file) : new Set();
      scenarios = scenarios.filter((s) => !(s.cap === cap && !s.proposed && gone.has(norm(s.req))));
      scenarios.push(...readScenarios(file, cap, change));
    }
  }
  return { capabilities: caps, scenarios };
}

// "cap / requirement / scenario" -> scenario object or null
function resolveSpec(ref, scenarios) {
  const parts = String(ref).split(" / ").map((x) => x.trim());
  if (parts.length < 3) return null;
  const cap = parts[0], req = norm(parts[1]), name = norm(parts.slice(2).join(" / "));
  return scenarios.find((s) => s.cap === cap && norm(s.req) === req && norm(s.name) === name) || null;
}

// Tiny glob: supports `dir/**/*.ext` and `dir/*.ext`.
function glob(pattern) {
  const abs = path.join(repoRoot, pattern);
  const [base, rest] = abs.includes("**") ? abs.split("**") : [path.dirname(abs), "/" + path.basename(abs)];
  const suffix = new RegExp("^" + rest.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, "[^/]*") + "$");
  const out = [];
  const walk = (d, deep) => {
    if (!fs.existsSync(d)) return;
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) { if (deep && e.name !== "node_modules") walk(p, deep); }
      else if (suffix.test(p.slice(base.replace(/\/$/, "").length))) out.push(p);
    }
  };
  walk(base.replace(/\/$/, ""), abs.includes("**"));
  return out.map((p) => path.relative(repoRoot, p)).sort();
}

// Test titles in a file: test("..."), it("..."), test.describe is ignored. Go: func TestXxx.
// Python: def test_xxx, tagged by a @case("ID") decorator above it (tests/conftest.py adds the id
// to the test's name in the JUnit results). Titles built at run time (it(scenario.name)) aren't
// seen here: scenario tests take their id from the case that Runs their file.
function testTitles(file) {
  const text = fs.readFileSync(path.join(repoRoot, file), "utf8");
  const titles = [];
  if (file.endsWith(".py")) {
    let from = 0;
    for (const m of text.matchAll(/((?:^@[^\n]*\n)*)^(?:async )?def (test_[A-Za-z0-9_]+)\(/gm)) {
      const before = text.slice(from, m.index);
      from = m.index + m[0].length;
      // Parametrized by scenario file, with ids from the catalog (case_for): tagged at run time.
      if (/case_for\(/.test(before.slice(before.lastIndexOf("\n\n")))) continue;
      const id = (m[1].match(/@case\(\s*["']([A-Z]{2,4}-\d{3})["']\s*\)/) || [])[1];
      titles.push(id ? `[${id}] ${m[2]}` : m[2]);
    }
    return titles;
  }
  // test(...), it(...), and their .skip/.only/.fixme forms: a skipped test still needs a case or deletion.
  // A title built from scenarioCase(...) takes its id from the case that Runs the file.
  for (const m of text.matchAll(/^\s*(?:test|it)(?:\.(?:skip|only|fixme))?\(\s*(["'`])((?:\\.|(?!\1).)*)\1/gm)) if (!m[2].includes("scenarioCase(")) titles.push(m[2]);
  // Go: TestMain is the package's entry point, not a test.
  for (const m of text.matchAll(/^func (Test[A-Za-z0-9_]+)\(/gm)) if (m[1] !== "TestMain") titles.push(m[1]);
  return titles;
}

// The case ids a test name carries: "[DSH-003] ...", or a Go test named TestROM012 / TestROM012_Name
// (go test and gotestsum report subtests as TestROM012_Name/sub).
function caseIds(name) {
  const ids = [...String(name).matchAll(/\b([A-Z]{2,4}-\d{3})\b/g)].map((m) => m[1]);
  for (const m of String(name).matchAll(/(?:^|[\s."'(/=])Test([A-Z]{2,4})(\d{3})(?=_|\/|\b)/g)) ids.push(`${m[1]}-${m[2]}`);
  return [...new Set(ids)];
}

module.exports = { caseIds, catalogDir, repoRoot, specDir, loadAreas, loadSpecScenarios, resolveSpec, glob, testTitles, norm };
