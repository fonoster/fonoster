require('../../config')
const Providers = require('@yaps/providers')
const { CLIError } = require('@oclif/errors')
const { Command } = require('@oclif/command')
const { cli } = require('cli-ux')

class DeleteCommand extends Command {
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

DeleteCommand.description = `remove provider from a YAPS deployment
`

DeleteCommand.args = [{ name: 'ref' }]

DeleteCommand.aliases = ['providers:del', 'providers:rm']

module.exports = DeleteCommand
