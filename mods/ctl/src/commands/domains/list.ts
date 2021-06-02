import "../../config";
import Domains, {CommonPB} from "@fonos/domains";
import {CLIError} from "@oclif/errors";
import {Command, flags as oclifFlags} from "@oclif/command";
import inquirer from "inquirer";
import {Domain} from "@fonos/domains/src/client/types";

// Using import will cause: Error: easy_table_1.default is not a constructor
const Table = require("easy-table");

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

        const t = new Table();

        list.forEach((domain: Domain) => {
          const egressRule = domain.egressNumberRef ? domain.egressRule : "na";
          t.cell("Ref", domain.ref);
          t.cell("Name", domain.name);
          t.cell("Domain URI", domain.domainUri);
          t.cell("Egress Rule", egressRule);
          t.cell("Egress Number Ref", domain.egressNumberRef);
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
