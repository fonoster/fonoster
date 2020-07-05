import '../../config'
import Agents from '@fonos/agents'
import { CLIError } from '@oclif/errors'
import { Command, flags } from '@oclif/command'
import moment from 'moment'
import inquirer from 'inquirer'
import { View } from '../../../../core/src/server/protos/common_pb'
const Table = require('easy-table')

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
      let pageToken = '0'
      const pageSize = flags.size
      const view: View = View.BASIC
      console.log('TETAS 001')
      while (true) {
        // Get a list
        console.log('TETAS 001.2')
        const result = await agents.listAgents({ pageSize, pageToken, view })
        console.log('TETAS 002')
        const list = result.getAgentsList()
        pageToken = result.getNextPageToken()

        console.log('TETAS 003')
        // Dont ask this if is the first time or empty data
        if (list.length > 0 && !firstBatch) {
          console.log('TETAS 004')
          const answer: any = await inquirer.prompt([
            { name: 'q', message: 'More', type: 'confirm' }
          ])
          if (!answer.q) break
        }

        console.log('TETAS 005')
        const t = new Table()

        console.log('TETAS 006')

        list.forEach((agent: any) => {
          console.log('TETAS 007')
          t.cell('Ref', agent.getRef())
          t.cell('Name', agent.getName())
          t.cell('Username', agent.getUsername())
          t.cell('Privacy', agent.getPrivacy())
          t.cell('Domains', agent.getDomainsList().join(','))
          t.cell('Created', moment(agent.getCreateTime()).fromNow())
          t.cell('Updated', moment(agent.getCreateTime()).fromNow())
          t.newRow()
        })

        console.log('TETAS 008: list.length =', list.length)
        if (list.length > 0) console.log(t.toString())

        console.log('TETAS 009')
        firstBatch = false
        if (!pageToken) break
        console.log('TETAS 010')
      }
    } catch (e) {
      throw new CLIError(e.message)
    }
  }
}
