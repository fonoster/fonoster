import '../../config'
import Agents from '@fonos/agents'
import Domains from '@fonos/domains'
import { CLIError } from '@oclif/errors'
import { Command } from '@oclif/command'
import inquirer from 'inquirer'
import { cli } from 'cli-ux'

export default class CreateCommand extends Command {
  static description = `creates a new agent resource
  ...
  Creates a new Agent in the SIP Proxy subsystem
  `

  async run () {
    console.log('This utility will help you create a new Agent')
    console.log('Press ^C at any time to quit.')

    // TODO: Consider using the autocomplete plugin
    const response = await new Domains().listDomains({
      pageSize: 25,
      pageToken: '1'
    })
    const domains = response
      .getDomainsList()
      .map((app: any) => app.getDomainUri())

    const answers: any = await inquirer.prompt([
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
