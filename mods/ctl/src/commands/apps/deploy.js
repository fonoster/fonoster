require('../../config')
const AppManager = require('@yaps/appmanager')
const prettyjson = require('prettyjson')
const { cli } = require('cli-ux')
const path = require('path')
const {Command, flags} = require('@oclif/command')
const {CLIError} = require('@oclif/errors')
const {updateBucketPolicy} = require('@yaps/core')


class DeployCommand extends Command {
  async run() {
    try {
      const appmanager = new AppManager()
      const pckg = path.join(process.cwd(), 'package.json')

      cli.action.start('Deploying application')
      const app = await appmanager.deployApp(process.cwd())

      let bucket = 'default'
      try {
        const yapsConfig = JSON.parse(path.join(process.cwd(), 'yaps.json'))
        bucket = yapsConfig.bucket || 'default'
      } catch(e) {}

      cli.action.start('Updating bucket policy')
      await updateBucketPolicy(bucket)

      await cli.wait(1000)
      cli.action.stop('')

      const appJson = {
        Name: app.getName(),
        Description: app.getDescription(),
        Create: app.getCreateTime(),
        "Default Bucket": bucket
      }

      console.log(prettyjson.render(appJson, {noColor: true}))
    } catch(e) {
      throw new CLIError(e.message)
    }
  }
}

DeployCommand.description = `deploys application to a YAPS instance
...
Run this command from the app root to deploy to YAPS.
`

module.exports = DeployCommand
