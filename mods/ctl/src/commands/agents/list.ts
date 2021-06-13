import "../../config";
import Agents from "@fonos/agents";
import {CLIError} from "@oclif/errors";
import {Command, flags as oclifFlags} from "@oclif/command";
import inquirer from "inquirer";
import {AgentsPB, CommonPB} from "@fonos/agents";
import {Agent} from "@fonos/agents/src/client/types";

// Using import will cause: Error: easy_table_1.default is not a constructor
const Table = require("easy-table");

export default class ListCommand extends Command {
  static description = `list registered agents
  ...
  List the registered agents
  `;
  static flags = {
    size: oclifFlags.integer({
      char: "s",
      default: 25,
      description: "agent of result per page"
    })
  };
  static aliases = ["agents:ls"];

  async run() {
    const {flags} = this.parse(ListCommand);
    try {
      const agents = new Agents();
      let firstBatch = true;
      let pageToken = "1";
      const pageSize = flags.size;
      const view: CommonPB.View = CommonPB.View.BASIC;
      while (true) {
        // Get a list
        const result = await agents.listAgents({pageSize, pageToken, view});
        const list = result.agents;
        pageToken = result.nextPageToken;

        // Dont ask this if is the first time or empty data
        if (list.length > 0 && !firstBatch) {
          const answer: any = await inquirer.prompt([
            {name: "q", message: "More", type: "confirm"}
          ]);
          if (!answer.q) break;
        }

        const t = new Table();

        list.forEach((agent: Agent) => {
          t.cell("Ref", agent.ref);
          t.cell("Name", agent.name);
          t.cell("Username", agent.username);
          //t.cell('Privacy', agent.getPrivacy())
          t.cell("Domains", agent.domains.join(","));
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
