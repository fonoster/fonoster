const fs = require("fs");
const path = require("path");

// Change this to the file or folder you want to modify the permissions for
const targetPath = path.join(__dirname, "../node_modules/.bin");

// Permissions for Linux and macOS (read, write, execute for the owner)
const posixPermissions = 0o700;

// Permissions for Windows (read, write, execute for the owner)
const windowsPermissions = {
  mode: fs.constants.F_OK | fs.constants.R_OK | fs.constants.W_OK | fs.constants.X_OK,
};

function setPermissions() {
  const isWindows = process.platform === "win32";

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

setPermissions();
