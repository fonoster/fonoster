import '../../config'
import Agents from '@fonos/agents'
import { CLIError } from '@oclif/errors'
import { Command } from '@oclif/command'
import { cli } from 'cli-ux'
const inquirer = require('inquirer')

export default class UpdateCommand extends Command {
  static args = [{ name: 'ref' }]
  static description = `updates a agent at the SIP Proxy subsystem
  ...
  Updates a agent at the SIP Proxy subsystem
  `
  async run () {
    console.log('This utility will help you update an existing Agent')
    console.log('Press ^C at any time to quit.')

    const { args } = this.parse(UpdateCommand)
    const agents = new Agents()
    const agent = await agents.getAgent(args.ref)

    const answers = await inquirer.prompt([
      {
        name: 'name',
        message: 'friendly name',
        type: 'input',
        default: agent.getName()
      },
      {
        name: 'secret',
        message: 'secret',
        type: 'password',
        mask: true,
        default: agent.getSecret()
      },
      {
        name: 'privacy',
        message: 'privacy',
        type: 'list',
        choices: ['None', 'Private'],
        default: agent.getPrivacy()
      },
      {
        name: 'confirm',
        message: 'everything looks good?',
        type: 'confirm'
      }
    ])

    answers.ref = args.ref

    if (!answers.confirm) {
      console.log('Aborted')
    } else {
      try {
        cli.action.start(`Updating agent ${answers.name}`)

        await agents.updateAgent(answers)
        await cli.wait(1000)

        cli.action.stop('Done')
      } catch (e) {
        cli.action.stop()
        throw new CLIError(e.message)
      }
    }
  }
}
