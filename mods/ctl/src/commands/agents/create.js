require('../../config')
const Agents = require('@yaps/agents')
const Domains = require('@yaps/domains')
const { Command } = require('@oclif/command')
const { CLIError } = require('@oclif/errors')
const inquirer = require('inquirer')
const path = require('path')
const { cli } = require('cli-ux')

class CreateCommand extends Command {
  async run () {
    console.log('This utility will help you create a new Agent')
    console.log('Press ^C at any time to quit.')

    // TODO: Consider using the autocomplete plugin
    const response = await new Domains().listDomains({ pageSize: 25, pageToken: '1' })
    const domains = response.getDomainsList().map(app => app.getDomainUri())

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
        name: 'domains',
        message: 'domains',
        type: 'checkbox',
        choices: domains
      },
      {
        name: 'privacy',
        message: 'privacy',
        type: 'list',
        choices: ['None', 'Private'],
        default: 'None'
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
        cli.action.start(`Creating agent ${answers.name}`)

        const agents = new Agents()
        await agents.createAgent(answers)
        await cli.wait(1000)

        cli.action.stop('All done')
      } catch (e) {
        cli.action.stop()
        throw new CLIError(e.message)
      }
    }
  }
}

CreateCommand.description = `creates a new agent resource
...
Creates a new Agent in the SIP Proxy subsystem
`

module.exports = CreateCommand
