require('../../config')
const Numbers = require('@yaps/numbers')
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
      const numbers = new Numbers()
      let firstBatch = true
      let pageToken = '0'
      const pageSize = flags.size
      while (true) {
        // Get a list
        const result = await numbers.listNumbers({ pageSize, pageToken })
        const list = result.getNumbersList()
        pageToken = result.getNextPageToken()

        // Dont ask this if is the first time or empty data
        if (list.length > 0 && !firstBatch) {
          const answer = await inquirer.prompt([
            { name: 'q', message: 'More', type: 'confirm' }
          ])
          if (!answer.q) break
        }

        const t = new Table()

        list.forEach(number => {
          t.cell('Ref', number.getRef())
          t.cell('Provider Ref', number.getProviderRef())
          t.cell('E164 Number', number.getE164Number())
          t.cell('AOR Link', number.getAorLink() || '--')
          t.cell('Ingress App', number.getIngressApp() || '--')
          t.cell('Created', moment(number.getCreateTime()).fromNow())
          t.cell('Updated', moment(number.getCreateTime()).fromNow())
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

ListCommand.description = `list registered numbers
...
List the registered numbers
`

ListCommand.flags = {
  size: flags.integer({
    char: 's',
    default: 25,
    description: 'number of result per page'
  })
}

ListCommand.aliases = ['numbers:ls']

module.exports = ListCommand
