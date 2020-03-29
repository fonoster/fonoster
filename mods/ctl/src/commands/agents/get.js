require('../../config')
const Agents = require('@yaps/agents')
const { CLIError } = require('@oclif/errors')
const { Command, flags } = require('@oclif/command')
const { cli } = require('cli-ux')
const prettyjson = require('prettyjson')

class GetCommand extends Command {
  async run () {
    const { args } = this.parse(GetCommand)

    try {
      const agents = new Agents()
      cli.action.start(`Getting agent ${args.ref}`)
      const agent = await agents.getAgent(args.ref)

      const jsonObj = {
        Ref: agent.getRef(),
        Name: agent.getName(),
        Username: agent.getUsername(),
        Privacy: agent.getPrivacy(),
        Domains: agent.getDomainsList().join(','),
        Created: agent.getCreateTime(),
        Updated: agent.getUpdateTime()
      }

      await cli.wait(1000)
      cli.action.stop('')
      console.log(prettyjson.render(jsonObj, { noColor: true }))
    } catch (e) {
      throw new CLIError(e.message)
    }
  }
}

GetCommand.description = `get information about an existing agent
`

GetCommand.args = [{ name: 'ref' }]

module.exports = GetCommand
