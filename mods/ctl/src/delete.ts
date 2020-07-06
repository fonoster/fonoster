import '../../config'
import Agents from '@fonos/agents'
import { CLIError } from '@oclif/errors'
import { Command } from '@oclif/command'
import { cli } from 'cli-ux'

export default class DeleteCommand extends Command {
  static description = 'remove agent from a Fonos deployment'
  static args = [{ name: 'ref' }]
  static aliases = ['agents:del', 'agents:rm']

  async run () {
    const { args } = this.parse(DeleteCommand)
    const ref = args.ref

    try {
      const agents = new Agents()
      cli.action.start(`Deleting agent ${ref}`)
      await agents.deleteAgent(ref)
      await cli.wait(1000)
      cli.action.stop('done')
    } catch (e) {
      throw new CLIError(e.message)
    }
  }
}
