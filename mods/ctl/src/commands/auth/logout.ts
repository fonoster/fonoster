import "../../config";
import {CLIError} from "@oclif/errors";
import {Command} from "@oclif/command";
import {cli} from "cli-ux";
import {join} from "path";
import {homedir} from "os";

const BASE_DIR = join(homedir(), ".fonos");
const fs = require("fs");

export default class extends Command {
  static description = `log out from a fonos deployment`;

  async run() {
    cli.action.start(`Login out`);

    try {
      fs.rmSync(BASE_DIR, {recursive: true});
      await cli.wait(1000);
      cli.action.stop("Done");
    } catch (e) {
      cli.action.stop();
      throw new CLIError(e.message);
    }
  }
}
