import '../../config'
import Domains from '@fonos/domains'
import { CLIError } from '@oclif/errors'
import { Command } from '@oclif/command'
import { cli } from 'cli-ux'
const inquirer = require('inquirer')

export default class CreateCommand extends Command {
  static description = `creates a new domain resource
  ...
  Creates a new Domain in the SIP Proxy subsystem
  `

  async run () {
    console.log('This utility will help you create a new Domain')
    console.log('Press ^C at any time to quit.')

    const answers = await inquirer.prompt([
      {
        name: 'name',
        message: 'domain name',
        type: 'input'
      },
      {
        name: 'domainUri',
        message: 'domain uri',
        type: 'input'
      },
      { name: 'egressRule', message: 'egress rule', type: 'input' },
      {
        name: 'egressNumberRef',
        message: 'number reference',
        type: 'input'
      },
      {
        name: 'accessDeny',
        message: 'access deny list',
        type: 'input',
        default: '0.0.0.0/1'
      },
      {
        name: 'accessAllow',
        message: 'access allow list',
        type: 'input'
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
        const accessDeny = answers.accessDeny
        const accessAllow = answers.accessAllow
        answers.accessDeny = accessDeny ? accessDeny.split(',') : []
        answers.accessAllow = accessAllow ? accessAllow.split(',') : []

        cli.action.start(`Creating domain ${answers.name}`)

        const domains = new Domains()
        await domains.createDomain(answers)
        await cli.wait(1000)

        cli.action.stop('All done')
      } catch (e) {
        cli.action.stop()
        throw new CLIError(e.message)
      }
    }
  }
}
