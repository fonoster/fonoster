require('../../config')
const AppManager = require('@yaps/appmanager')
const {CLIError} = require('@oclif/errors')
const {Command} = require('@oclif/command')
const {cli} = require('cli-ux')
const appmanager = new AppManager()

class DeleteCommand extends Command {
  async run() {
    const {args} = this.parse(DeleteCommand)
    const name =  args.name

    try{
      cli.action.start(`Deleting application ${name}`)
      await appmanager.deleteApp(name)
      await cli.wait(1000)
      cli.action.stop('done')
    } catch(e) {
      throw new CLIError(e.message)
    }
  }
}

DeleteCommand.description = `get information about an existing application
...
Obtain information about an application
`

DeleteCommand.args = [
  {name: 'name'}
]

DeleteCommand.aliases = ['apps:del', 'apps:rm']

module.exports = DeleteCommand
