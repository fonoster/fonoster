// Shared by the root `npm test` and every module's own mocha scripts, which run from the module
// directory: the setup files are resolved against this file, not the working directory.
const path = require("path");

module.exports = {
  "node-option": ["import=tsx"],
  ignore: ["**/node_modules/**"],
  require: [
    path.join(__dirname, "mods/apiserver/test/setupConfig.ts"),
    path.join(__dirname, "mods/conformance/test/natsBusLock.ts")
  ]
};
