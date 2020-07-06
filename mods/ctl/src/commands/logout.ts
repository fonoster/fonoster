import '../config'
import { Command, flags } from '@oclif/command'
import { join } from 'path'
import * as fs from 'fs'
import os from 'os'

export default class LogoutCommand extends Command {
  static description = `revoke crendentials to current station`
  async run () {
    const pathToAccess = join(os.homedir(), '.fonos', 'access')

    try {
      fs.unlinkSync(pathToAccess)
    } catch (e) {}
    console.log('Done.')
  }
}
