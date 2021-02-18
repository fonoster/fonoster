import Command from '../../base/delete'
import Domains from '@fonos/domains'

export default class DeleteCommand extends Command {
  static description = 'remove a domain from a Fonos deployment'
  static args = [{ name: 'ref' }]
  static aliases = ['domains:del', 'domains:rm']

  async run () {
      super.deleteResource(new Domains(), 'deleteDomain')
  }
}
