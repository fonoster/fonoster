import "../config";
import { CliUx } from "@oclif/core";
import { Command } from "@oclif/command";

export default class extends Command {
  static description = `start a bug report 🐞
  ...
  Opens github issues with a predefine bug template
  `;

  async run() {
    await CliUx.ux.open(
      "https://github.com/fonoster/fonoster/issues/new?assignees=&labels=&template=bug_report.md&title="
    );
  }
}
