require('../../config')
import AppManager from '@fonos/appmanager'
import prettyjson from 'prettyjson'
import { CLIError } from '@oclif/errors'
import { cli } from 'cli-ux'
import { Command } from '@oclif/command'

export default class DeployCommand extends Command {
  static description = `deploys application to a Fonos instance
  ...
  Run this command from the app root to deploy to Fonos.
  `

  async run () {
    try {
      console.log('DBG000')
      cli.action.start('Deploying application')
      console.log('DBG001')
      const appmanager = new AppManager()
      console.log('DBG002')
      const app = await appmanager.deployApp(process.cwd())
      console.log('DBG003')
      await cli.wait(1000)
      console.log('DBG004')
      cli.action.stop('')

      const appJson = {
        Name: app.getName(),
        Description: app.getDescription(),
        Create: app.getCreateTime(),
        'Default Bucket': app.getBucket()
      }

      console.log(prettyjson.render(appJson, { noColor: true }))
    } catch (e) {
      throw new CLIError(e.message)
    }
  }
}
