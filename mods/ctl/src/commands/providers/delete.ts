import '../../config'
import Providers from '@fonos/providers'
import { CLIError } from '@oclif/errors'
import { Command } from '@oclif/command'
import { cli } from 'cli-ux'

export default class DeleteCommand extends Command {
  static description = 'remove provider from a Fonos deployment'
  static args = [{ name: 'ref' }]
  static aliases = ['providers:del', 'providers:rm']

  async run () {
    const { args } = this.parse(DeleteCommand)
    const ref = args.ref

    try {
      const providers = new Providers()
      cli.action.start(`Deleting provider ${ref}`)
      await providers.deleteProvider(ref)
      await cli.wait(1000)
      cli.action.stop('done')
    } catch (e) {
      throw new CLIError(e.message)
    }
  }
}
