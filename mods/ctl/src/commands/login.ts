import '../config'
import AppManager from '@fonos/appmanager'
import { CLIError } from '@oclif/errors'
import { Command, flags } from '@oclif/command'
import { join } from 'path'
import * as fs from 'fs'
import * as os from 'os'
import { CommonPB } from '@fonos/core'

const inquirer = require('inquirer')

export default class LoginCommand extends Command {
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
    const { flags } = this.parse(LoginCommand)

    let access: any = {}
    if (!flags.file) {
      console.log(`Fonos Login`)
      access = await inquirer.prompt([
        {
          name: 'endpoint',
          message: 'Endpoint',
          type: 'input',
          default: 'localhost:50052'
        },
        { name: 'accessKeyId', message: 'Access Key Id', type: 'input' },
        { name: 'accessKeySecret', message: 'Access Key Secret', type: 'input' }
      ])
    } else {
      try {
        access = JSON.parse(`${fs.readFileSync(flags.file)}`)
      } catch (e) {
        throw new CLIError(`file ${flags.file} does not exist or is malformed`)
      }
    }

    const targetDir = join(os.homedir(), '.fonos')
    const pathToAccess = join(os.homedir(), '.fonos', 'access')

    let pageToken = '0'
    const pageSize = 1
    const view: CommonPB.View = CommonPB.View.BASIC

    try {
      const appmanager = new AppManager({
        endpoint: access.endpoint,
        accessKeyId: access.accessKeyId,
        accessKeySecret: access.accessKeySecret
      })
      // validate (call something inside fonos)
      await appmanager.listApps({ pageSize, pageToken, view })

      // write credentials at ~/.fonos/access
      const content = JSON.stringify(access, null, '')

      fs.mkdirSync(targetDir, { recursive: true })
      fs.writeFileSync(pathToAccess, content)
    } catch (e) {
      try {
        // If the access file is there then removed...
        fs.unlinkSync(pathToAccess)
      } catch (e) {}
      throw new CLIError(`please verify your credentials and endpoint`)
    }
  }
}
