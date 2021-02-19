import Command from '../../base/delete'
import Providers from '@fonos/providers'
import { CLIError } from '@oclif/errors'

export default class DeleteCommand extends Command {
  static description = 'removes a provider from a Fonos deployment'
  static args = [{ name: 'ref' }]
  static aliases = ['providers:del', 'providers:rm']

  async run () {
    try {
      await super.deleteResource(new Providers(), 'deleteProvider')
    } catch(e) {
      if (e.code === 9) {
        throw new CLIError('Unable to remove! First ensure there are no Numbers under this Provider')
      } else {
        throw new CLIError(e.message)
      }
    }    
  }
}
