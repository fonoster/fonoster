require('../../config')
const Agents = require('@fonos/agents')
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
      const agents = new Agents()
      let firstBatch = true
      let pageToken = '0'
      const pageSize = flags.size
      while (true) {
        // Get a list
        const result = await agents.listAgents({ pageSize, pageToken })
        const list = result.getAgentsList()
        pageToken = result.getNextPageToken()

        // Dont ask this if is the first time or empty data
        if (list.length > 0 && !firstBatch) {
          const answer = await inquirer.prompt([
            { name: 'q', message: 'More', type: 'confirm' }
          ])
          if (!answer.q) break
        }

        const t = new Table()

        list.forEach(agent => {
          t.cell('Ref', agent.getRef())
          t.cell('Name', agent.getName())
          t.cell('Username', agent.getUsername())
          t.cell('Privacy', agent.getPrivacy())
          t.cell('Domains', agent.getDomainsList().join(','))
          t.cell('Created', moment(agent.getCreateTime()).fromNow())
          t.cell('Updated', moment(agent.getCreateTime()).fromNow())
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

ListCommand.description = `list registered agents
...
List the registered agents
`

ListCommand.flags = {
  size: flags.integer({
    char: 's',
    default: 25,
    description: 'agent of result per page'
  })
}

ListCommand.aliases = ['agents:ls']

module.exports = ListCommand
