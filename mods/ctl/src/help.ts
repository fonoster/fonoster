import {Help} from "@oclif/plugin-help";

const figlet = require("figlet");

export default class MyHelpClass extends Help {
  protected showRootHelp() {
    this.showLogo();

    console.log(this.formatRoot());
    console.log("");

    console.log(this.formatCommands(this.customCommands));
    console.log("");
  }

  private showLogo() {
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

  private get customCommands() {
    return this.sortedCommands
      .filter((c) => c.id)
      .sort((a, b) => (a.id.includes(":") ? 1 : b.id.includes(":") ? -1 : 0));
  }
}
