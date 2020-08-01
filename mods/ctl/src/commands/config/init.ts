import '../../config'
import { CLIError } from '@oclif/errors'
import { Command, flags } from '@oclif/command'
import * as fs from 'fs'
import createCerts from '../../create_certs'
import {
  installConfig,
  installTLSCerts,
  installConfigLocal,
  cleanup
} from '../../install_secret'
import { cli } from 'cli-ux'

const inquirer = require('inquirer')

export default class ConfigCommand extends Command {
  static description = `authenticates current station`
  static flags = {
    file: flags.string({
      char: 'f',
      description: 'json file with access credentials'
    }),
    size: flags.string({
      char: 's',
      description: 'json file with access credentials'
    })
  }

  async run () {
    const { flags } = this.parse(ConfigCommand)

    let config: any = {}
    if (!flags.file) {
      console.log(`Fonos Configuration`)
      config = await inquirer.prompt([
        {
          name: 'kubeContext',
          message: 'Kube Context',
          type: 'input',
          default: 'default'
        },
        {
          name: 'subject',
          message: 'Domain',
          type: 'input'
        },
        {
          name: 'accessKeyId',
          message: 'Access Key Id',
          type: 'input',
          default: 'fonos'
        }
      ])
    } else {
      try {
        config = JSON.parse(`${fs.readFileSync(flags.file)}`)
      } catch (e) {
        throw new CLIError(`file ${flags.file} does not exist or is malformed`)
      }
    }

    try {
      if (!config.kubeContext) throw new Error('You must input a Context')
      if (!config.subject) throw new Error('You must input a Domain')
      if (!config.accessKeyId)
        throw new Error('You must input an Access Key Id')

      cli.action.start('Configuring deployment secrets')

      await createCerts(config.subject)
      await installConfig(config.kubeContext)
      await installTLSCerts(config.kubeContext)
      await installConfigLocal(config.subject)
      cleanup()

      cli.action.stop()
    } catch (e) {
      throw new CLIError(e.message)
    }
  }
}
