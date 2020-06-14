require('../config')
const AppManager = require('@fonos/appmanager')
const { CLIError } = require('@oclif/errors')
const { Command, flags } = require('@oclif/command')
const inquirer = require('inquirer')
const fs = require('fs')
const path = require('path')
const os = require('os')

class LoginCommand extends Command {
  async run () {
    const { flags } = this.parse(LoginCommand)

    let access = {}
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
        access = JSON.parse(fs.readFileSync(flags.file))
      } catch (e) {
        throw new CLIError(`file ${flags.file} does not exist or is malformed`)
      }
    }

    const targetDir = path.join(os.homedir(), '.fonos')
    const pathToAccess = path.join(os.homedir(), '.fonos', 'access')

    try {
      const appmanager = new AppManager({
        endpoint: access.endpoint,
        accessKeyId: access.accessKeyId,
        accessKeySecret: access.accessKeySecret
      })
      // validate (call something inside fonos)
      await appmanager.listApps({ pageSize: 0 })

      // write credentials at ~/.fonos/access
      const content = JSON.stringify(access, null, '  ')

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

LoginCommand.description = `authenticates current station`

LoginCommand.flags = {
  file: flags.string({
    char: 'f',
    description: 'json file with access credentials'
  })
}

module.exports = LoginCommand
