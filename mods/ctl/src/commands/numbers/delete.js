require('../../config')
const Numbers = require('@yaps/numbers')
const { CLIError } = require('@oclif/errors')
const { Command } = require('@oclif/command')
const { cli } = require('cli-ux')

class DeleteCommand extends Command {
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

DeleteCommand.description = `remove number from a YAPS deployment
`

DeleteCommand.args = [{ name: 'ref' }]

DeleteCommand.aliases = ['numbers:del', 'numbers:rm']

module.exports = DeleteCommand
