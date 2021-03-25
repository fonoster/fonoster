import '../../config'
import Domains from '@fonos/domains'
import { CLIError } from '@oclif/errors'
import { Command } from '@oclif/command'
import { cli } from 'cli-ux'
import { render } from 'prettyjson'
const moment = require('moment')

export default class GetCommand extends Command {
  static description = 'get information about an existing domain'
  static args = [{ name: 'ref' }]

  async run () {
    const { args } = this.parse(GetCommand)

    try {
      const domains = new Domains()
      cli.action.start(`Getting domain ${args.ref}`)
      const domain = await domains.getDomain(args.ref)
      console.log('geting domain: ')

      const allow =
        domain.accessDeny.length > 0
          ? domain.accessDeny.join(',')
          : 'None'

      const deny =
        domain.accessAllow.length > 0
          ? domain.accessAllow.join(',')
          : 'None'

      const jsonObj = {
        Name: domain.name,
        'Domain URI': domain.domainUri,
        'Egress Rule': domain.egressRule || 'None',
        'Egress Number Ref': domain.egressNumberRef || 'None',
        'Access Deny List': deny,
        'Access Allow List': allow,
        Created: moment(domain.createdTime).fromNow(),
        Updated: moment(domain.updatedTime).fromNow()
      }

      await cli.wait(1000)
      cli.action.stop('')
      console.log(render(jsonObj, { noColor: true }))
    } catch (e) {
      throw new CLIError(e.message)
    }
  }
}
