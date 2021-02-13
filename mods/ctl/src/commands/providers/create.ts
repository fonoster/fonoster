import '../../config'
import Providers from '@fonos/providers'
import { CLIError } from '@oclif/errors'
import { Command } from '@oclif/command'
import { cli } from 'cli-ux'
const inquirer = require('inquirer')

export default class CreateCommand extends Command {
  static description = `creates a new provider resource
  ...
  Creates a new Provider in the SIP Proxy subsystem
  `

  async run () {
    console.log('This utility will help you create a new Provider')
    console.log('Press ^C at any time to quit.')

    const answers = await inquirer.prompt([
      {
        name: 'name',
        message: 'friendly name',
        type: 'input'
      },
      {
        name: 'username',
        message: 'username',
        type: 'input'
      },
      {
        name: 'secret',
        message: 'secret',
        type: 'password'
      },
      {
        name: 'host',
        message: 'host',
        type: 'input'
      },
      {
        name: 'transport',
        message: 'transport',
        type: 'list',
        choices: ['tcp', 'udp'],
        default: 'tcp'
      },
      {
        name: 'expires',
        message: 'expire',
        type: 'input',
        default: 60
      },
      {
        name: 'confirm',
        message: 'does everything look good?',
        type: 'confirm'
      }
    ])

    if (!answers.confirm) {
      console.log('Aborted')
    } else {
      try {
        cli.action.start(`Creating provider ${answers.name}`)

        const providers = new Providers()
        await providers.createProvider(answers)
        await cli.wait(1000)

        cli.action.stop('All done')
      } catch (e) {
        cli.action.stop()
        throw new CLIError(e.message)
      }
    }
  }
}
