import '../../config'
import AppManager from '@fonos/appmanager'
import { CLIError } from '@oclif/errors'
import { Command } from '@oclif/command'
import { cli } from 'cli-ux'

export default class DeleteCommand extends Command {
  static description = `removes application`
  static args = [{ name: 'name' }]
  static aliases = ['apps:del', 'apps:rm']

  async run () {
    const { args } = this.parse(DeleteCommand)
    const name = args.name

    try {
      const appmanager = new AppManager()
      cli.action.start(`deleting application ${name}`)
      await appmanager.deleteApp(name)
      await cli.wait(1000)
      cli.action.stop('done')
    } catch (e) {
      throw new CLIError(e.message)
    }
  }
}
