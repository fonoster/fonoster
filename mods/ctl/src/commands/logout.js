require('../config')
const { Command } = require('@oclif/command')
const fs = require('fs')
const path = require('path')
const os = require('os')

class LogoutCommand extends Command {
  async run () {
    const pathToAccess = path.join(os.homedir(), '.yaps', 'access')

    try {
      fs.unlinkSync(pathToAccess)
    } catch (e) {}
    console.log('Done.')
  }
}

LogoutCommand.description = `revoke crendentials to current station`

module.exports = LogoutCommand
