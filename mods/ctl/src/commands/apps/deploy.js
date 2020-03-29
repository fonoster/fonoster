require('../../config')
const AppManager = require('@yaps/appmanager')
const prettyjson = require('prettyjson')
const { cli } = require('cli-ux')
const path = require('path')
const fs = require('fs')
const { Command, flags } = require('@oclif/command')
const { CLIError } = require('@oclif/errors')

class DeployCommand extends Command {
  async run () {
    try {
      cli.action.start('Deploying application')
      const appmanager = new AppManager()
      const app = await appmanager.deployApp(process.cwd())
      await cli.wait(1000)
      cli.action.stop('')

      const appJson = {
        Name: app.getName(),
        Description: app.getDescription(),
        Create: app.getCreateTime(),
        'Default Bucket': app.getBucket()
      }

      console.log(prettyjson.render(appJson, { noColor: true }))
    } catch (e) {
      throw new CLIError(e.message)
    }
  }
}

DeployCommand.description = `deploys application to a YAPS instance
...
Run this command from the app root to deploy to YAPS.
`

module.exports = DeployCommand
