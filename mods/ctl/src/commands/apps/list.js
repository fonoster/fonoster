require('../../config')
const AppManager = require('@yaps/appmanager')
const Table = require('easy-table')
const truncate = require('truncate')
const {CLIError} = require('@oclif/errors')
const {Command, flags} = require('@oclif/command')
const moment = require('moment')
const inquirer = require('inquirer')
const APPS_BUCKET = 'apps'
const appmanager = new AppManager({bucket: APPS_BUCKET})

class ListCommand extends Command {
  async run() {
    const {flags} = this.parse(ListCommand)
    try{
      let firstBatch = true
      let pageToken = '0'
      const pageSize = flags.size
      while(true) {
        // Get a list
        const result = await appmanager.listApps({pageSize, pageToken})
        const apps = result.getAppsList()
        pageToken = result.getNextPageToken()

        // Dont ask this if is the first time or empty data
        if (apps.length > 0 && !firstBatch) {
          const answer = await inquirer.prompt([
            {name:'q', message: 'More', type: 'confirm'}
          ])
          if (!answer.q) break
        }

        /*const table = new Table({
          head: ['NAME', 'DESCRIPTION', 'CREATE', 'LAST UPDATE'],
          colWidths: [18, 24, 16, 16],
          style: {head: ['green']}
        })

        // Show the data
        apps.forEach(app => {
          table.push([
            app.getName(),
            app.getDescription(),
            moment(app.getCreateTime()).fromNow(),
            moment(app.getUpdateTime()).fromNow()
          ])
        })*/

        const t = new Table()

        apps.forEach(app => {
          t.cell('Name', app.getName())
          t.cell('Description', truncate(app.getDescription(), 32))
          t.cell('Created', moment(app.getCreateTime()).fromNow())
          t.cell('Updated', moment(app.getCreateTime()).fromNow())
          t.newRow()
        })

        if(apps.length > 0) console.log(t.toString())

        firstBatch = false
        if (!pageToken) break
      }
    } catch(e) {
      throw new CLIError(e.message)
    }
  }
}

ListCommand.description = `list registered applications
...
List the registered applications
`

ListCommand.flags = {
  size: flags.integer({char: 's', default: 25, description: 'number of result per page'})
}

module.exports = ListCommand
