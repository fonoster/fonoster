import '../../config'
import Numbers from '@fonos/numbers'
import { CLIError } from '@oclif/errors'
import { Command } from '@oclif/command'
import { cli } from 'cli-ux'

export default class DeleteCommand extends Command {
  static description = 'remove number from a Fonos deployment'
  static args = [{ name: 'ref' }]
  static aliases = ['numbers:del', 'numbers:rm']

  async run () {
    const { args } = this.parse(DeleteCommand)
    const ref = args.ref

    try {
      const numbers = new Numbers()
      cli.action.start(`Deleting number ${ref}`)
      await numbers.deleteNumber(ref)
      await cli.wait(1000)
      cli.action.stop('done')
    } catch (e) {
      throw new CLIError(e.message)
    }
  }
}
