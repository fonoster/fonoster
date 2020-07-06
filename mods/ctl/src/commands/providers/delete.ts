import Command from '../../base/delete'
import Providers from '@fonos/providers'

export default class DeleteCommand extends Command {
  static description = 'removes a provider from a Fonos deployment'
  static args = [{ name: 'ref' }]
  static aliases = ['providers:del', 'providers:rm']

  async run () {
    super.deleteResource(new Providers(), 'deleteProvider')
  }
}
