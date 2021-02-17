import '../../config'
import AppManager from '@fonos/appmanager'
import { CLIError } from '@oclif/errors'
import { cli } from 'cli-ux'
import { Command } from '@oclif/command'

const prettyjson = require('prettyjson')

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
      cli.action.stop('')

      const appJson = {
        Name: app.getName(),
        Description: app.getDescription(),
        Create: app.getCreateTime()
      }

      console.log(prettyjson.render(appJson, { noColor: true }))
    } catch (e) {
      console.error(e)
      throw new CLIError(e.message)
    }
  }
}
