import '../../config'
import Providers from '@fonos/providers'
import Numbers from '@fonos/numbers'
import Apps from '@fonos/appmanager'
import { CLIError } from '@oclif/errors'
import { Command } from '@oclif/command'
import { cli } from 'cli-ux'
import { CommonPB, AppManagerPB, ProvidersPB } from '@fonos/core'
const phone = require('phone')
const inquirer = require('inquirer')

export default class CreateCommand extends Command {
  static description = `creates a new number resource
  ...
  Creates a new Number in the SIP Proxy subsystem
  `

  async run () {
    console.log('This utility will help you create a new Number')
    console.log('Press ^C at any time to quit.')

    const view: CommonPB.View = CommonPB.View.BASIC
    try {
      // TODO: Consider using the autocomplete plugin
      const res = await new Apps().listApps({
        pageSize: 25,
        pageToken: '1',
        view
      })
      const apps = res
        .getAppsList()
        .map((app: AppManagerPB.App) => app.getName())
      const response = await new Providers().listProviders({
        pageSize: 25,
        pageToken: '1'
      })
      const providers = response
        .getProvidersList()
        .map((p: ProvidersPB.Provider) => {
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
          message: 'number in e164 format (e.g. +16471234567)',
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
          throw new Error('Not application or aorLink found')
        }

        const ingresAppPrompt = await inquirer.prompt([
          {
            name: 'ingressApp',
            message: 'ingress app',
            type: 'list',
            choices: apps
          }
        ])

        answers.ingressApp = ingresAppPrompt.ingressApp
      }

      const confirmPrompt = await inquirer.prompt([
        {
          name: 'confirm',
          message: 'does everything look good?',
          type: 'confirm'
        }
      ])

      answers.confirm = confirmPrompt.confirm

      if (!answers.confirm) {
        console.log('Aborted')
      } else {
        const number = phone(answers.e164Number)[0]
        if (!number)
          throw `number ${answers.e164Number} is not a valid e164 number (e.g. +16471234567)`
        cli.action.start(`Creating number ${number}`)
        answers.e164Number = number
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
