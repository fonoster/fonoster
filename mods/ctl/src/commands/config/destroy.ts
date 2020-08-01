import '../../config'
import { Command, flags } from '@oclif/command'
import { join } from 'path'
import * as fs from 'fs'
import * as os from 'os'
import { cli } from 'cli-ux'

export default class LogoutCommand extends Command {
  static description = `revoke crendentials and removes certificates for current station`
  async run () {
    const pathToAccess = join(os.homedir(), '.fonos', 'config')

    cli.action.start(`Destroying configuration`)
    try {
      fs.unlinkSync(pathToAccess)
    } catch (e) {}
    cli.action.stop('All done')
  }
}
