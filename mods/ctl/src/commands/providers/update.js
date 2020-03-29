require('../../config')
const Providers = require('@yaps/providers')
const Apps = require('@yaps/appmanager')
const { Command } = require('@oclif/command')
const { CLIError } = require('@oclif/errors')
const inquirer = require('inquirer')
const path = require('path')
const { cli } = require('cli-ux')

class UpdateCommand extends Command {
  async run () {
    console.log('This utility will help you update an existing Provider')
    console.log('Press ^C at any time to quit.')

    // TODO: Consider using the autocomplete plugin
    const response = await new Apps().listApps({ pageSize: 25, pageToken: '0' })
    const appsNames = response.getAppsList().map(app => app.getName())

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
      console.log('Aborted')
    } else {
      try {
        cli.action.start(`Updating provider ${answers.name}`)

        await providers.updateProvider(answers)
        await cli.wait(1000)

        cli.action.stop('All done')
      } catch (e) {
        cli.action.stop()
        throw new CLIError(e.message)
      }
    }
  }
}

UpdateCommand.description = `updates a provider at the SIP Proxy subsystem
...
Updates a provider at the SIP Proxy subsystem
`

UpdateCommand.args = [{ name: 'ref' }]

module.exports = UpdateCommand
