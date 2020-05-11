require('../../config')
const Domains = require('@fonos/domains')
const { CLIError } = require('@oclif/errors')
const { Command } = require('@oclif/command')
const { cli } = require('cli-ux')

class DeleteCommand extends Command {
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

DeleteCommand.description = `remove domain from a Fonos deployment
`

DeleteCommand.args = [{ name: 'ref' }]

DeleteCommand.aliases = ['domains:del', 'domains:rm']

module.exports = DeleteCommand
