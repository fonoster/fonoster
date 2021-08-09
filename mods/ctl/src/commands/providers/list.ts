import "../../config";
import Providers from "@fonos/providers";
import {CLIError} from "@oclif/errors";
import {Command, flags as oclifFlags} from "@oclif/command";
import inquirer from "inquirer";
import {CommonPB} from "@fonos/providers";
import {cli} from "cli-ux";

export default class ListCommand extends Command {
  static description = `list registered providers
  ...
  List the registered providers
  `;
  static flags = {
    size: oclifFlags.integer({
      char: "s",
      default: 25,
      description: "provider of result per page"
    })
  };

  static aliases = ["providers:ls"];

  async run() {
    const {flags} = this.parse(ListCommand);
    try {
      const providers = new Providers();
      let firstBatch = true;
      let pageToken = "1";
      const pageSize = flags.size;
      const view: CommonPB.View = CommonPB.View.BASIC;
      while (true) {
        // Get a list
        const result = await providers.listProviders({
          pageSize,
          pageToken,
          view
        });
        const list = result.providers;
        pageToken = result.nextPageToken;

        // Dont ask this if is the first time or empty data
        if (list.length > 0 && !firstBatch) {
          const answer: any = await inquirer.prompt([
            {name: "q", message: "More", type: "confirm"}
          ]);
          if (!answer.q) break;
        }

        if (list.length < 1) break;

        cli.table(list, {
          ref: {minWidth: 13},
          name: {header: "Name", minWidth: 13},
          username: {
            header: "Username",
            minWidth: 13,
            get: (row) => row.username || "(static)"
          },
          host: {header: "Host", minWidth: 18},
          transport: {header: "Transport", minWidth: 13},
          expires: {header: "Expires", minWidth: 13}
        });

        firstBatch = false;
        if (!pageToken) break;
      }
    } catch (e) {
      throw new CLIError(e.message);
    }
  }
}
