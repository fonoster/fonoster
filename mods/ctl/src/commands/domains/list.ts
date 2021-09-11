import "../../config";
import Domains, {CommonPB} from "@fonos/domains";
import {CLIError} from "@oclif/errors";
import {Command, flags as oclifFlags} from "@oclif/command";
import {cli} from "cli-ux";
import {Domain} from "@fonos/domains/src/client/types";
const inquirer = require("inquirer");

export default class ListCommand extends Command {
  static description = `list registered domains
  ...
  List the registered domains
  `;
  static flags = {
    size: oclifFlags.integer({
      char: "s",
      default: 25,
      description: "number of result per page"
    })
  };
  static aliases = ["domains:ls"];

  async run() {
    const {flags} = this.parse(ListCommand);
    try {
      const domains = new Domains();
      let firstBatch = true;
      let pageToken = "1";
      const pageSize = flags.size;
      const view: CommonPB.View = CommonPB.View.BASIC;
      while (true) {
        // Get a list
        const result = await domains.listDomains({pageSize, pageToken, view});
        const list = result.domains;
        pageToken = result.nextPageToken;

        // Dont ask this if is the first time or empty data
        if (list.length > 0 && !firstBatch) {
          const answer: any = await inquirer.prompt([
            {name: "q", message: "More", type: "confirm"}
          ]);
          if (!answer.q) break;
        }

        if (list.length < 1) break;

        const showTable = (showHeader: boolean, data: Domain[]) => {
          cli.table(
            data,
            {
              ref: {minWidth: 15},
              name: {header: "Name", minWidth: 15},
              domainUri: {header: "Domain URI", minWidth: 15},
              egressRule: {
                header: "Egress Rule",
                minWidth: 15,
                get: (row) => (row.egressNumberRef ? row.egressRule : "na")
              },
              egressNumberRef: {
                header: "Egress Number Ref",
                minWidth: 15
              }
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
