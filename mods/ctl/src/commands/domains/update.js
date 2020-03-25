require('../../config')
const Domains = require('@yaps/domains')
const { Command } = require('@oclif/command')
const { CLIError } = require('@oclif/errors')
const inquirer = require('inquirer')
const path = require('path')
const { cli } = require('cli-ux')

class UpdateCommand extends Command {
  async run () {
    console.log('This utility will help you create a basic voice application')
    console.log('to help you get start quickly. Press ^C at any time to quit.')

    const { args } = this.parse(UpdateCommand)
    const domains = new Domains()
    const domain = await domains.getDomain(args.ref)

    const answers = await inquirer.prompt([
      {
        name: 'name',
        message: 'domain name',
        type: 'input',
        default: domain.getName()
      },
      {
        name: 'egressRule',
        message: 'egress rule',
        type: 'input',
        default: domain.getEgressRule()
      },
      {
        name: 'egressNumberRef',
        message: 'number reference',
        type: 'input',
        default: domain.getEgressNumberRef()
      },
      {
        name: 'accessDeny',
        message: 'access deny list',
        type: 'input',
        default: domain.getAccessDenyList().join(',')
      },
      {
        name: 'accessAllow',
        message: 'access allow list',
        type: 'input',
        default: domain.getAccessAllowList().join(',')
      },
      {
        name: 'confirm',
        message: 'does everything look good?',
        type: 'confirm'
      }
    ])

    answers.ref = args.ref

    if (!answers.confirm) {
      console.log('Aborted')
    } else {
      try {
        const accessDeny = answers.accessDeny
        const accessAllow = answers.accessAllow
        answers.accessDeny = accessDeny ? accessDeny.split(',') : []
        answers.accessAllow = accessAllow ? accessAllow.split(',') : []

        cli.action.start(`Updating domain ${answers.name}`)

        await domains.updateDomain(answers)
        await cli.wait(1000)

        cli.action.stop('All done')
      } catch (e) {
        cli.action.stop()
        throw new CLIError(e.message)
      }
    }
  }
}

UpdateCommand.description = `updates a domain at the SIP Proxy subsystem
...
Updates a domain at the SIP Proxy subsystem
`

UpdateCommand.args = [{ name: 'ref' }]

module.exports = UpdateCommand
