const fs = require("fs");
const path = require("path");

// Permissions for Linux and macOS (read, write, execute for the owner)
const posixPermissions = 0o700;

// Permissions for Windows (read, write, execute for the owner)
const windowsPermissions = {
  mode: fs.constants.F_OK | fs.constants.R_OK | fs.constants.W_OK | fs.constants.X_OK,
};

function setPermissions(targetPath) {
  const isWindows = process.platform === "win32";
  const isLinux = process.platform === "linux";

  if (isLinux) {
    console.log(`skipping set-permissions for: ${targetPath}`);
    return;
  }

  try {
    if (isWindows) {
      fs.accessSync(targetPath, windowsPermissions.mode);
    } else {
      fs.chmodSync(targetPath, posixPermissions);
    }
    console.log(`successfully changed permissions for: ${targetPath}`);
  } catch (error) {
    console.error(`error changing permissions for: ${targetPath}`, error);
  }
}

const crossEnvPath = path.join(__dirname, "../node_modules/.bin/cross-env");
const tsNodePath = path.join(__dirname, "../node_modules/.bin/ts-node");

setPermissions(crossEnvPath);
setPermissions(tsNodePath);