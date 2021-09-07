import "../config";
import cli from "cli-ux";
import {Command} from "@oclif/command";

export default class extends Command {
  static description = `let'us know how we're doing
  ...
  Help us improve by providing some feedback
  `;

  async run() {
    await cli.open(
      "https://docs.google.com/forms/d/e/1FAIpQLSd1G2ahRYqkbksOvz7XhNHfSLepUh3KzRHsXh2HXfZr68nhtQ/viewform?vc=0&c=0&w=1&flr=0"
    );
  }
}
