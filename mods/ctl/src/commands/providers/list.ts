import "../../config";
import {CLIError} from "@oclif/errors";
import {Command, flags as oclifFlags} from "@oclif/command";
import {CommonPB} from "@fonoster/providers";
import {cli} from "cli-ux";
import {Provider} from "@fonoster/providers/src/client/types";
import {getProjectConfig, hasProjectConfig} from "../../config";

const Providers = require("@fonoster/providers");
const inquirer = require("inquirer");

export default class ListCommand extends Command {
  static description = `list all Fonoster Providers you have access to
  ...
  List all Fonoster Providers you have access to
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
    if (!hasProjectConfig()) {
      throw new CLIError("you must set a default project");
    }
    const {flags} = this.parse(ListCommand);
    try {
      const providers = new Providers(getProjectConfig());
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

        const showTable = (showHeader: boolean, data: Provider[]) => {
          cli.table(
            data,
            {
              ref: {minWidth: 13},
              name: {header: "Name", minWidth: 13},
              username: {
                header: "Username",
                minWidth: 13,
                get: (row) => row.username || "(static)"
              },
              host: {header: "Host", minWidth: 18},
              transport: {header: "Transport", minWidth: 13}
              //expires: {header: "SIP Registration Refresh", minWidth: 13}
            },
            {"no-header": !showHeader}
          );
        };
        showTable(firstBatch, list);

        firstBatch = false;
        if (!pageToken) break;
      }
    } catch (e) {
      throw new CLIError(e.message);
    }
  }
}
