import '../../config'
import Providers from '@fonos/providers'
import Numbers from '@fonos/numbers'
import Apps from '@fonos/appmanager'
import { CLIError } from '@oclif/errors'
import { Command } from '@oclif/command'
import { cli } from 'cli-ux'
import { View } from '../../../../numbers/node_modules/@fonos/core/src/server/protos/common_pb'
import { App } from '../../../../agents/node_modules/@fonos/core/src/server/protos/appmanager_pb'
import { Provider } from '../../../../providers/node_modules/@fonos/core/src/server/protos/providers_pb'
const inquirer = require('inquirer')

export default class CreateCommand extends Command {
  static description = `creates a new number resource
  ...
  Creates a new Number in the SIP Proxy subsystem
  `

  async run () {
    console.log('This utility will help you create a new Number')
    console.log('Press ^C at any time to quit.')

    const view: View = View.BASIC
    try {
      // TODO: Consider using the autocomplete plugin
      const res = await new Apps().listApps({
        pageSize: 25,
        pageToken: '0',
        view
      })
      const apps = res.getAppsList().map((app: App) => app.getName())
      const response = await new Providers().listProviders({
        pageSize: 25,
        pageToken: '0'
      })
      const providers = response.getProvidersList().map((p: Provider) => {
        const obj: any = {}
        obj.name = p.getName()
        obj.value = p.getRef()
        return obj
      })

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
        if (apps.length === 0) {
          throw new Error('Did not find any applications')
        }

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
