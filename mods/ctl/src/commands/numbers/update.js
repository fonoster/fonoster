require('../../config')
const Numbers = require('@yaps/numbers')
const Apps = require('@yaps/appmanager')
const { Command } = require('@oclif/command')
const { CLIError } = require('@oclif/errors')
const inquirer = require('inquirer')
const path = require('path')
const { cli } = require('cli-ux')

class UpdateCommand extends Command {
  async run () {
    console.log('This utility will help you update an existing Number')
    console.log('Press ^C at any time to quit.')

    // TODO: Consider using the autocomplete plugin
    const response = await new Apps().listApps({ pageSize: 25, pageToken: '0' })
    const appsNames = response.getAppsList().map(app => app.getName())

    const { args } = this.parse(UpdateCommand)
    const numbers = new Numbers()
    const number = await numbers.getNumber(args.ref)

    const answers = await inquirer.prompt([
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
          choices: appsNames
        }
      ])

      answers.ingressApp = prompt.ingressApp
    }

    const prompt = await inquirer.prompt([
      {
        name: 'confirm',
        message: 'are you sure you want to update?',
        type: 'confirm'
      }
    ])

    answers.confirm = prompt.confirm
    answers.ref = args.ref

    if (!answers.confirm) {
      console.log('Aborted')
    } else {
      try {
        const accessDeny = answers.accessDeny
        const accessAllow = answers.accessAllow
        answers.accessDeny = accessDeny ? accessDeny.split(',') : []
        answers.accessAllow = accessAllow ? accessAllow.split(',') : []

        cli.action.start(`Updating number ${answers.name}`)

        await numbers.updateNumber(answers)
        await cli.wait(1000)

        cli.action.stop('All done')
      } catch (e) {
        cli.action.stop()
        throw new CLIError(e.message)
      }
    }
  }
}

UpdateCommand.description = `updates a number at the SIP Proxy subsystem
...
Updates a number at the SIP Proxy subsystem
`

UpdateCommand.args = [{ name: 'ref' }]

module.exports = UpdateCommand
