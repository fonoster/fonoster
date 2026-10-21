// The API area (mods/conformance/catalog/areas/api.md): its own mocha process, because the
// apiserver reads its configuration once, when its modules load.
const path = require("path");

// Every @fonoster package from source (see tsconfig.json here); mocha's node-option child inherits it.
process.env.TSX_TSCONFIG_PATH = path.join(__dirname, "tsconfig.json");

module.exports = {
  "node-option": ["import=tsx"],
  spec: [path.join(__dirname, "*.api.ts")],
  require: [path.join(__dirname, "hooks.ts")],
  timeout: 60000,
  exit: true
};
