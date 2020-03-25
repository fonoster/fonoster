require('../../config')
const Domains = require('@yaps/domains')
const { CLIError } = require('@oclif/errors')
const { Command, flags } = require('@oclif/command')
const { cli } = require('cli-ux')
const prettyjson = require('prettyjson')

class GetCommand extends Command {
  async run () {
    const { args } = this.parse(GetCommand)

    try {
      const domains = new Domains()
      cli.action.start(`Getting domain ${args.ref}`)
      const domain = await domains.getDomain(args.ref)

      const allow =
        domain.getAccessDenyList().length > 0
          ? domain.getAccessDenyList().join(',')
          : 'None'

      const deny =
        domain.getAccessAllowList().length > 0
          ? domain.getAccessAllowList().join(',')
          : 'None'

      const jsonObj = {
        Name: domain.getName(),
        'Domain URI': domain.getDomainUri(),
        'Egress Rule': domain.getEgressRule() || 'None',
        'Egress Number Ref': domain.getEgressNumberRef() || 'None',
        'Access Deny List': deny,
        'Access Allow List': allow,
        Create: domain.getCreateTime(),
        'Last Update': domain.getUpdateTime()
      }

      await cli.wait(1000)
      cli.action.stop('')
      console.log(prettyjson.render(jsonObj, { noColor: true }))
    } catch (e) {
      throw new CLIError(e.message)
    }
  }
}

GetCommand.description = `get information about an existing domain
`

GetCommand.args = [{ name: 'ref' }]

module.exports = GetCommand
