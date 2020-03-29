require('../../config')
const Providers = require('@yaps/providers')
const { CLIError } = require('@oclif/errors')
const { Command, flags } = require('@oclif/command')
const { cli } = require('cli-ux')
const prettyjson = require('prettyjson')

class GetCommand extends Command {
  async run () {
    const { args } = this.parse(GetCommand)

    try {
      const providers = new Providers()
      cli.action.start(`Getting provider ${args.ref}`)
      const provider = await providers.getProvider(args.ref)

      const jsonObj = {
        Ref: provider.getRef(),
        Name: provider.getName(),
        Username: provider.getUsername() + '(static)',
        Host: provider.getHost(),
        Transport: provider.getTransport(),
        Expires: provider.getExpires(),
        Created: provider.getCreateTime(),
        Updated: provider.getUpdateTime()
      }

      await cli.wait(1000)
      cli.action.stop('')
      console.log(prettyjson.render(jsonObj, { noColor: true }))
    } catch (e) {
      throw new CLIError(e.message)
    }
  }
}

GetCommand.description = `get information about an existing provider
`

GetCommand.args = [{ name: 'ref' }]

module.exports = GetCommand
