import "../../config";
import {CLIError} from "@oclif/errors";
import {Command} from "@oclif/command";
import {CliUx} from "@oclif/core";
import {join} from "path";
import {homedir} from "os";

const BASE_DIR = join(homedir(), ".fonoster");
const fs = require("fs");

export default class extends Command {
  static description = `log out from a fonoster deployment`;

  async run() {
    CliUx.ux.action.start(`Login out`);
    if (fs.existsSync(BASE_DIR)) {
      try {
        fs.rmSync(BASE_DIR, {recursive: true});
        await CliUx.ux.wait(1000);
      } catch (e) {
        CliUx.ux.action.stop();
        throw new CLIError(e.message);
      }
    }
    CliUx.ux.action.stop("Done");
  }
}
