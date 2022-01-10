import {Help} from "@oclif/plugin-help";
const figlet = require("figlet");

export default class MyHelpClass extends Help {
  showHelp(args: string[]) {
    // Only shouw the figlet if user ask for help at the root
    // level.
    if (
      args.length === 0 ||
      (args.length === 1 &&
        (args[0].includes("help") || args[0].includes("-h")))
    ) {
      console.log("\x1b[32m");
      console.log(
        figlet.textSync("Fonoster", {
          horizontalLayout: "default",
          verticalLayout: "default",
          width: 60,
          whitespaceBreak: true
        })
      );
      console.log("\x1b[0m");
    }
    //super.showHelp(args);
  }
}
