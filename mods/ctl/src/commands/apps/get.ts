import '../../config'
import AppManager from '@fonos/appmanager'
import { CLIError } from '@oclif/errors'
import { Command } from '@oclif/command'
import { cli } from 'cli-ux'
import { render } from 'prettyjson'

export default class GetCommand extends Command {
  static description = `get information about an existing application
  ...
  Obtain information about an application
  `
  static args = [{ name: 'name' }]

  async run () {
    const { args } = this.parse(GetCommand)
    const name = args.name

    try {
      const appmanager = new AppManager()
      cli.action.start(`getting application ${name}`)
      const app = await appmanager.getApp(name)

      const appJson = {
        Name: app.getName(),
        Description: app.getDescription(),
        Create: app.getCreateTime(),
        'Last Update': app.getUpdateTime()
      }

      await cli.wait(1000)
      cli.action.stop('')
      console.log(render(appJson, { noColor: true }))
    } catch (e) {
      throw new CLIError(e.message)
    }
  }
}
