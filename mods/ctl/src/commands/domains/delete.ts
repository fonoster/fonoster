import '../../config'
import Domains from '@fonos/domains'
import { CLIError } from '@oclif/errors'
import { Command } from '@oclif/command'
import { cli } from 'cli-ux'

export default class DeleteCommand extends Command {
  static description = 'remove domain from a Fonos deployment'
  static args = [{ name: 'ref' }]
  static aliases = ['domains:del', 'domains:rm']

  async run () {
    const { args } = this.parse(DeleteCommand)
    const ref = args.ref

    try {
      const domains = new Domains()
      cli.action.start(`Deleting domain ${ref}`)
      await domains.deleteDomain(ref)
      await cli.wait(1000)
      cli.action.stop('done')
    } catch (e) {
      throw new CLIError(e.message)
    }
  }
}
