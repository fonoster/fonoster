import {UpdateNotifier} from "update-notifier";
const pkg = require("../package.json");

export function checkUpdate() {
  const notifier = new UpdateNotifier({
    pkg: {
      name: "@fonos/ctl",
      version: pkg.version
    }
  });

  notifier.check();

  if (notifier.update) {
    const message = `
      Update available: ${notifier.update.current} -> ${notifier.update.latest}
      To install run npm install -g @fonos/ctl \n`;

    return console.log(message);
  }
}
