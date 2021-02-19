import '../../config'
import AppManager from '@fonos/appmanager'
import { CLIError } from '@oclif/errors'
import { cli } from 'cli-ux'
import { Command } from '@oclif/command'
import moment from 'moment'

export default class DeployCommand extends Command {
  static args = [{ name: 'ref' }]
  static description = `deploys application to a Fonos instance
  ...
  Run this command from the app root to deploy to Fonos.
  `

  async run () {
    const { args } = this.parse(DeployCommand)
    try {
      cli.action.start('Deploying application')
      const appmanager = new AppManager()
      const app = await appmanager.deployApp(process.cwd(), args.ref)
      await cli.wait(1000)
      cli.action.stop(app.getRef())
    } catch (e) {
      throw new CLIError(e.message)
    }
  }
}
