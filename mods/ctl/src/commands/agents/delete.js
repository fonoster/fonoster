require('../../config')
const Agents = require('@fonos/agents')
const { CLIError } = require('@oclif/errors')
const { Command } = require('@oclif/command')
const { cli } = require('cli-ux')

class DeleteCommand extends Command {
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

DeleteCommand.description = `remove agent from a Fonos deployment
`

DeleteCommand.args = [{ name: 'ref' }]

DeleteCommand.aliases = ['agents:del', 'agents:rm']

module.exports = DeleteCommand
