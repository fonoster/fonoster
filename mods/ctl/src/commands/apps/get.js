const AppManager = require('@yaps/appmanager')
const {CLIError} = require('@oclif/errors')
const {Command, flags} = require('@oclif/command')
const { cli } = require('cli-ux')
const prettyjson = require('prettyjson')
const APPS_BUCKET = 'apps'
const appmanager = new AppManager({bucket: APPS_BUCKET})

class GetCommand extends Command {
  async run() {
    const {args} = this.parse(GetCommand)
    const name =  args.name

    try{
      const app = await appmanager.getApp(name)

      const appJson = {
        Name: app.getName(),
        Description: app.getDescription(),
        Create: app.getCreateTime(),
        "Last Update": app.getUpdateTime()
      }

      console.log(prettyjson.render(appJson, {noColor: true}))
    } catch(e) {
      throw new CLIError(e.message)
    }
  }
}

GetCommand.description = `get information about an existing application
...
Obtain information about an application
`

GetCommand.args = [
  {name: 'name'}
]

module.exports = GetCommand
