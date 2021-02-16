import '../../config'
import { CLIError } from '@oclif/errors'
import { Command } from '@oclif/command'
import { cli } from 'cli-ux'
import fs from 'promise-fs'
import { join } from 'path'
import { homedir } from 'os'

const BASE_DIR = join(homedir(), '.fonos')
const PATH_TO_CONFIG = join(BASE_DIR, 'config')

export default class extends Command {
  static description = `log out from a fonos deployment`

  async run () {
    cli.action.start(`login out`)

    try {
      await fs.rmdir(BASE_DIR, { recursive: true })
      await cli.wait(1000)
      cli.action.stop('done')
    } catch (e) {
      cli.action.stop()
      throw new CLIError(e.message)
    }
  }
}
