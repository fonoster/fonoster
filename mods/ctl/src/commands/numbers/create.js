require('../../config')
const Providers = require('@yaps/providers')
const Numbers = require('@yaps/numbers')
const Apps = require('@yaps/appmanager')
const { Command } = require('@oclif/command')
const { CLIError } = require('@oclif/errors')
const inquirer = require('inquirer')
const path = require('path')
const { cli } = require('cli-ux')

class CreateCommand extends Command {
  async run () {
    console.log('This utility will help you create a new Number')
    console.log('Press ^C at any time to quit.')

    try {
      // TODO: Consider using the autocomplete plugin
      const res = await new Apps().listApps({ pageSize: 25, pageToken: '0' })
      const apps = res.getAppsList().map(app => app.getName())

      const response = await new Providers().listProviders({
        pageSize: 25,
        pageToken: '0'
      })
      const providers = response.getProvidersList().map(app => app.getRef())

      if (providers.length === 0) {
        throw new Error('You must create a Provider before adding any Number')
      }

      const answers = await inquirer.prompt([
        {
          name: 'e164Number',
          message: 'number in e164 format',
          type: 'input'
        },
        {
          name: 'providerRef',
          message: 'service provider',
          type: 'list',
          choices: providers
        },
        {
          name: 'aorLink',
          message: 'aor link',
          type: 'input',
          default: null
        }
      ])

      if (!answers.aorLink) {
        const prompt = await inquirer.prompt([
          {
            name: 'ingressApp',
            message: 'ingress app',
            type: 'list',
            choices: apps
          }
        ])

        answers.ingressApp = prompt.ingressApp
      }

      const prompt = await inquirer.prompt([
        {
          name: 'confirm',
          message: 'does everything look good?',
          type: 'confirm'
        }
      ])

      answers.confirm = prompt.confirm

      if (!answers.confirm) {
        console.log('Aborted')
      } else {
        cli.action.start(`Creating number ${answers.e164Number}`)
        const numbers = new Numbers()
        await numbers.createNumber(answers)
        await cli.wait(1000)
        cli.action.stop('All done')
      }
    } catch (e) {
      cli.action.stop()
      throw new CLIError(e.message)
    }
  }
}

CreateCommand.description = `creates a new number resource
...
Creates a new Number in the SIP Proxy subsystem
`

module.exports = CreateCommand
