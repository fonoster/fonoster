require('../../config')
const Numbers = require('@yaps/numbers')
const { CLIError } = require('@oclif/errors')
const { Command, flags } = require('@oclif/command')
const { cli } = require('cli-ux')
const prettyjson = require('prettyjson')

class GetCommand extends Command {
  async run () {
    const { args } = this.parse(GetCommand)

    try {
      const numbers = new Numbers()
      cli.action.start(`Getting number ${args.ref}`)
      const number = await numbers.getNumber(args.ref)

      const jsonObj = {
         Ref: number.getRef(),
        'Provider Ref': number.getProviderRef(),
        'E164 Numbe': number.getE164Number(),
        'AOR Link': number.getAorLink() || '--',
        'Ingress App': number.getIngressApp() || '--',
        Created: number.getCreateTime(),
        Updated: number.getUpdateTime()
      }

      await cli.wait(1000)
      cli.action.stop('')
      console.log(prettyjson.render(jsonObj, { noColor: true }))
    } catch (e) {
      throw new CLIError(e.message)
    }
  }
}

GetCommand.description = `get information about an existing number
`

GetCommand.args = [{ name: 'ref' }]

module.exports = GetCommand
