import Command from '../../base/delete'
import Numbers from '@fonos/numbers'

export default class DeleteCommand extends Command {
  static description = 'remove a number from a Fonos deployment'
  static args = [{ name: 'ref' }]
  static aliases = ['numbers:del', 'numbers:rm']

  async run () {
    super.deleteResource(new Numbers(), 'deleteNumber')
  }
}
