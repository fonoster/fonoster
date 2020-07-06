import '../../config'
import Agents from '@fonos/agents'
import { CLIError } from '@oclif/errors'
import { Command, flags } from '@oclif/command'
import inquirer from 'inquirer'
import { View } from '../../../../core/src/server/protos/common_pb'
import { Agent } from '../../../../agents/node_modules/@fonos/core/src/server/protos/agents_pb'
const Table = require('easy-table')
const moment = require('moment')

export default class ListCommand extends Command {
  static description = `list registered agents
  ...
  List the registered agents
  `
  static flags = {
    size: flags.integer({
      char: 's',
      default: 25,
      description: 'agent of result per page'
    })
  }
  static aliases = ['agents:ls']

  async run () {
    const { flags } = this.parse(ListCommand)
    try {
      const agents = new Agents()
      let firstBatch = true
      let pageToken = '1'
      const pageSize = flags.size
      const view: View = View.BASIC
      while (true) {
        // Get a list
        const result = await agents.listAgents({ pageSize, pageToken, view })
        const list = result.getAgentsList()
        pageToken = result.getNextPageToken()

        // Dont ask this if is the first time or empty data
        if (list.length > 0 && !firstBatch) {
          const answer: any = await inquirer.prompt([
            { name: 'q', message: 'More', type: 'confirm' }
          ])
          if (!answer.q) break
        }

        const t = new Table()

        list.forEach((agent: Agent) => {
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
