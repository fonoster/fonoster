#!/usr/bin/env node
// Writes a config folder from the bundle's files plus overlay folders (the dev container's and
// the QA stack's deltas):
//
//   node ops/rebuild/merge-config.cjs <bundle config dir> <out dir> [<overlay dir>...]
//
// Each bundle file is written to <out dir> under the same name. A YAML file with a same-named file in an overlay folder gets each overlay
// deep-merged over it, in order: objects merge, other values replace, `null` deletes a key. Files
// without an overlay, and folders, are copied as they are. Nothing else in <out dir> is touched
// (keys/, tls/ and the files a stack adds live there too). ${NAME} stays as written; run
// ops/bundle/init.sh --dir on the parent afterwards, which sets the SIP port.
const fs = require("fs");
const path = require("path");
const { parse, stringify } = require("yaml");

const [src, out, ...overlays] = process.argv.slice(2);
if (!src || !out) {
  console.error(
    "usage: merge-config.cjs <bundle config dir> <out dir> [<overlay dir>...]"
  );
  process.exit(2);
}

const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);

function deepMerge(base, overlay) {
  if (!isObj(base) || !isObj(overlay)) return overlay;
  const merged = { ...base };
  for (const [k, v] of Object.entries(overlay)) {
    if (v === null) delete merged[k];
    else merged[k] = k in merged ? deepMerge(merged[k], v) : v;
  }
  return merged;
}

fs.mkdirSync(out, { recursive: true });
const written = [];
for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
  const from = path.join(src, entry.name);
  const name = entry.name;
  const to = path.join(out, name);
  if (entry.isDirectory()) {
    fs.cpSync(from, to, { recursive: true });
    continue;
  }
  const found = overlays
    .map((d) => path.join(d, name))
    .filter((f) => fs.existsSync(f));
  if (!found.length || !/\.ya?ml$/.test(name)) {
    fs.copyFileSync(from, to);
  } else {
    let merged = parse(fs.readFileSync(from, "utf8")) ?? {};
    for (const f of found)
      merged = deepMerge(merged, parse(fs.readFileSync(f, "utf8")) ?? {});
    fs.writeFileSync(to, stringify(merged, { lineWidth: 0 }));
  }
  fs.chmodSync(to, 0o644);
  written.push(name);
}
console.log(`merged ${written.length} files into ${out}`);
