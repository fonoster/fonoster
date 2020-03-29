require('../../config')
const Providers = require('@yaps/providers')
const Table = require('easy-table')
const truncate = require('truncate')
const { CLIError } = require('@oclif/errors')
const { Command, flags } = require('@oclif/command')
const moment = require('moment')
const inquirer = require('inquirer')

class ListCommand extends Command {
  async run () {
    const { flags } = this.parse(ListCommand)
    try {
      const providers = new Providers()
      let firstBatch = true
      let pageToken = '0'
      const pageSize = flags.size
      while (true) {
        // Get a list
        const result = await providers.listProviders({ pageSize, pageToken })
        const list = result.getProvidersList()
        pageToken = result.getNextPageToken()

        // Dont ask this if is the first time or empty data
        if (list.length > 0 && !firstBatch) {
          const answer = await inquirer.prompt([
            { name: 'q', message: 'More', type: 'confirm' }
          ])
          if (!answer.q) break
        }

        const t = new Table()

        list.forEach(provider => {
          t.cell('Ref', provider.getRef())
          t.cell('Name', provider.getName())
          t.cell('Username', provider.getUsername() || '(static)')
          t.cell('Host', provider.getHost())
          t.cell('Transport', provider.getTransport())
          t.cell('Expires', provider.getExpires())
          t.cell('Created', moment(provider.getCreateTime()).fromNow())
          t.cell('Updated', moment(provider.getCreateTime()).fromNow())
          t.newRow()
        })

        if (list.length > 0) console.log(t.toString())

        firstBatch = false
        if (!pageToken) break
      }
    } catch (e) {
      throw new CLIError(e.message)
    }
  }
}

ListCommand.description = `list registered providers
...
List the registered providers
`

ListCommand.flags = {
  size: flags.integer({
    char: 's',
    default: 25,
    description: 'provider of result per page'
  })
}

ListCommand.aliases = ['providers:ls']

module.exports = ListCommand
