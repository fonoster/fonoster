import '../../config'
import Providers from '@fonos/providers'
import { CLIError } from '@oclif/errors'
import { Command } from '@oclif/command'
import { cli } from 'cli-ux'
const inquirer = require('inquirer')

export default class UpdateCommand extends Command {
  static args = [{ name: 'ref' }]
  static description = `updates a provider at the SIP Proxy subsystem
  ...
  Updates a provider at the SIP Proxy subsystem
  `

  async run () {
    console.log('This utility will help you update an existing Provider')
    console.log('Press ^C at any time to quit.')

    const { args } = this.parse(UpdateCommand)
    const providers = new Providers()
    const provider = await providers.getProvider(args.ref)

    const answers = await inquirer.prompt([
      {
        name: 'name',
        message: 'friendly name',
        type: 'input',
        default: provider.getName()
      },
      {
        name: 'username',
        message: 'username',
        type: 'input',
        default: provider.getUsername()
      },
      {
        name: 'secret',
        message: 'secret',
        type: 'password',
        default: provider.getSecret()
      },
      {
        name: 'host',
        message: 'host',
        type: 'input',
        default: provider.getHost()
      },
      {
        name: 'transport',
        message: 'host',
        type: 'list',
        choices: ['tcp', 'udp'],
        default: provider.getTransport()
      },
      {
        name: 'expires',
        message: 'expire',
        type: 'input',
        default: provider.getExpires()
      },
      {
        name: 'confirm',
        message: 'does everything look good?',
        type: 'confirm'
      }
    ])

    answers.ref = args.ref

    if (!answers.confirm) {
      console.log('aborted')
    } else {
      try {
        cli.action.start(`updating provider ${answers.name}`)

        await providers.updateProvider(answers)
        await cli.wait(1000)

        cli.action.stop('done')
      } catch (e) {
        cli.action.stop()
        throw new CLIError(e.message)
      }
    }
  }
}
