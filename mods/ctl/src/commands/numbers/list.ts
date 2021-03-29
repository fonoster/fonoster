import '../../config'
import Numbers from '@fonos/numbers'
import { CLIError } from '@oclif/errors'
import { Command, flags as oclifFlags } from '@oclif/command'
import inquirer from 'inquirer'
import { CommonPB, NumbersPB } from '@fonos/core'
import { Number } from '@fonos/numbers/src/types'

const Table = require('easy-table')

export default class ListCommand extends Command {
  static description = `list registered numbers
  ...
  List the registered numbers
  `;

  static flags = {
    size: oclifFlags.integer({
      char: "s",
      default: 25,
      description: "number of result per page"
    })
  };

  static aliases = ["numbers:ls"];

  async run() {
    const {flags} = this.parse(ListCommand);
    try {
      const numbers = new Numbers();
      let firstBatch = true;
      let pageToken = "1";
      const pageSize = flags.size;
      const view: CommonPB.View = CommonPB.View.BASIC;
      while (true) {
        // Get a list
        const result: any = await numbers.listNumbers({
          pageSize,
          pageToken,
          view
<<<<<<< HEAD
        })
        const list = result.numbers;
        pageToken = result.nextPageToken;
=======
        });
        const list = result.getNumbersList();
        pageToken = result.getNextPageToken();
>>>>>>> fonosorigin/dev

        // Dont ask this if is the first time or empty data
        if (list.length > 0 && !firstBatch) {
          const answer: any = await inquirer.prompt([
            {name: "q", message: "More", type: "confirm"}
          ]);
          if (!answer.q) break;
        }

        const t = new Table();

<<<<<<< HEAD
        list.forEach((number: Number) => {
          t.cell('Ref', number.ref)
          t.cell('Provider Ref', number.providerRef)
          t.cell('E164 Number', number.e164Number)
          t.cell('AOR Link', number.aorLink || '--')
          t.cell('Ingress App', number.ingressApp || '--')
          t.newRow()
        })
=======
        list.forEach((number: NumbersPB.Number) => {
          t.cell("Ref", number.getRef());
          t.cell("Provider Ref", number.getProviderRef());
          t.cell("E164 Number", number.getE164Number());
          t.cell("AOR Link", number.getAorLink() || "--");
          t.cell("Ingress App", number.getIngressApp() || "--");
          t.newRow();
        });
>>>>>>> fonosorigin/dev

        if (list.length > 0) console.log(t.toString());

        firstBatch = false;
        if (!pageToken) break;
      }
    } catch (e) {
      throw new CLIError(e.message);
    }
  }
}
