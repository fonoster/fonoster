import "../config";
import cli from "cli-ux";
import {Command} from "@oclif/command";

export default class extends Command {
  static description = `start a bug report 🐞
  ...
  Opens github issues with a predefine bug template
  `;

  async run() {
    await cli.open(
      "https://github.com/fonoster/fonoster/issues/new?assignees=&labels=&template=bug_report.md&title="
    );
  }
}
