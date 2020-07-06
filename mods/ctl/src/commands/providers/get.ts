import '../../config'
import Providers from '@fonos/providers'
import { CLIError } from '@oclif/errors'
import { Command, flags } from '@oclif/command'
import { cli } from 'cli-ux'
import { render } from 'prettyjson'

export default class GetCommand extends Command {
  static description = 'get information about an existing provider'
  static args = [{ name: 'ref' }]

  async run () {
    const { args } = this.parse(GetCommand)

    try {
      const providers = new Providers()
      cli.action.start(`Getting provider ${args.ref}`)
      const provider = await providers.getProvider(args.ref)

      const jsonObj = {
        Ref: provider.getRef(),
        Name: provider.getName(),
        Username: provider.getUsername() || '(static)',
        Host: provider.getHost(),
        Transport: provider.getTransport(),
        Expires: provider.getExpires(),
        Created: provider.getCreateTime(),
        Updated: provider.getUpdateTime()
      }

      await cli.wait(1000)
      cli.action.stop('')
      console.log(render(jsonObj, { noColor: true }))
    } catch (e) {
      throw new CLIError(e.message)
    }
  }
}
