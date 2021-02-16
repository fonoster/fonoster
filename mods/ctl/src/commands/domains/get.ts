import '../../config'
import Domains from '@fonos/domains'
import { CLIError } from '@oclif/errors'
import { Command } from '@oclif/command'
import { cli } from 'cli-ux'
import { render } from 'prettyjson'

export default class GetCommand extends Command {
  static description = 'get information about an existing domain'
  static args = [{ name: 'ref' }]

  async run () {
    const { args } = this.parse(GetCommand)

    try {
      const domains = new Domains()
      cli.action.start(`getting domain ${args.ref}`)
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
      console.log(render(jsonObj, { noColor: true }))
    } catch (e) {
      throw new CLIError(e.message)
    }
  }
}
