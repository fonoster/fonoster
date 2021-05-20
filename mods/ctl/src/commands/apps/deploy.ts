import "../../config";
import AppManager from "@fonos/appmanager";
import {CLIError} from "@oclif/errors";
import {cli} from "cli-ux";
import {Command} from "@oclif/command";
import {CommonPB} from "@fonos/appmanager";
const view: CommonPB.View = CommonPB.View.BASIC;

export default class DeployCommand extends Command {
  static args = [{name: "ref"}];
  static description = `deploys application to a Fonos instance
  ...
  Run this command from the app root to deploy to Fonos.
  `;
  async run() {
    const {args} = this.parse(DeployCommand);
    try {
      const appmanager = new AppManager();
      // Get a list
      const result = await appmanager.listApps({
        pageSize: 1000,
        pageToken: "1",
        view
      });
      const apps = result.apps;
      const appsName = apps.map((app: any) => app.name);
      const name = require(process.cwd() + "/package.json").name;

      if (appsName.includes(name) && !args.ref) {
        throw new Error(
          "App name already exist. To overwrite pass reference number."
        );
      }

      cli.action.start("Deploying application");

      const app = await appmanager.deployApp({
        path: process.cwd(),
        ref: args.ref
      });
      await cli.wait(1000);
      cli.action.stop(app.ref);
    } catch (e) {
      throw new CLIError(e.message);
    }
  }
}
