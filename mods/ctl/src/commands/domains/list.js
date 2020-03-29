require('../../config')
const Domains = require('@yaps/domains')
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
      const domains = new Domains()
      let firstBatch = true
      let pageToken = '0'
      const pageSize = flags.size
      while (true) {
        // Get a list
        const result = await domains.listDomains({ pageSize, pageToken })
        const list = result.getDomainsList()
        pageToken = result.getNextPageToken()

        // Dont ask this if is the first time or empty data
        if (list.length > 0 && !firstBatch) {
          const answer = await inquirer.prompt([
            { name: 'q', message: 'More', type: 'confirm' }
          ])
          if (!answer.q) break
        }

        const t = new Table()

        list.forEach(domain => {
          t.cell('Ref', domain.getRef())
          t.cell('Name', domain.getName())
          t.cell('Domain URI', domain.getDomainUri())
          t.cell('Egress Rule', domain.getEgressRule())
          t.cell('Egress Number Ref', domain.getEgressNumberRef())
          t.cell('Created', moment(domain.getCreateTime()).fromNow())
          t.cell('Updated', moment(domain.getCreateTime()).fromNow())
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

ListCommand.description = `list registered domains
...
List the registered domains
`

ListCommand.flags = {
  size: flags.integer({
    char: 's',
    default: 25,
    description: 'number of result per page'
  })
}

ListCommand.aliases = ['domains:ls']

module.exports = ListCommand
