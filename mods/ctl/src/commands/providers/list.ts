import "../../config";
import Providers from "@fonos/providers";
import {CLIError} from "@oclif/errors";
import {Command, flags as oclifFlags} from "@oclif/command";
import inquirer from "inquirer";
import {CommonPB, ProvidersPB} from "@fonos/core";
import { Provider } from "@fonos/providers/src/types";
const Table = require("easy-table");

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

        const t = new Table();

        list.forEach((provider: Provider) => {
          t.cell("Ref", provider.ref);
          t.cell("Name", provider.name);
          t.cell("Username", provider.username || "(static)");
          t.cell("Host", provider.host);
          t.cell("Transport", provider.transport);
          t.cell("Expires", provider.expires);
          t.newRow();
        });

        if (list.length > 0) console.log(t.toString());

        firstBatch = false;
        if (!pageToken) break;
      }
    } catch (e) {
      throw new CLIError(e.message);
    }
  }
}
