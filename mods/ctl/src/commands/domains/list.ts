import '../../config'
import Domains from '@fonos/domains'
import { CLIError } from '@oclif/errors'
import { Command, flags as oclifFlags } from '@oclif/command'
import inquirer from 'inquirer'
import { CommonPB, DomainsPB } from '@fonos/core'
const Table = require('easy-table')
const moment = require('moment')

export default class ListCommand extends Command {
  static description = `list registered domains
  ...
  List the registered domains
  `
  static flags = {
    size: oclifFlags.integer({
      char: 's',
      default: 25,
      description: 'number of result per page'
    })
  }
  static aliases = ['domains:ls']

  async run () {
    const { flags } = this.parse(ListCommand)
    try {
      const domains = new Domains()
      let firstBatch = true
      let pageToken = '1'
      const pageSize = flags.size
      const view: CommonPB.View = CommonPB.View.BASIC
      while (true) {
        // Get a list
        const result = await domains.listDomains({ pageSize, pageToken, view })
        const list = result.getDomainsList()
        pageToken = result.getNextPageToken()

        // Dont ask this if is the first time or empty data
        if (list.length > 0 && !firstBatch) {
          const answer: any = await inquirer.prompt([
            { name: 'q', message: 'More', type: 'confirm' }
          ])
          if (!answer.q) break
        }

        const t = new Table()

        list.forEach((domain: DomainsPB.Domain) => {
          const egressRule = domain.getEgressNumberRef()
            ? domain.getEgressRule()
            : 'na'
          t.cell('Ref', domain.getRef())
          t.cell('Name', domain.getName())
          t.cell('Domain URI', domain.getDomainUri())
          t.cell('Egress Rule', egressRule)
          t.cell('Egress Number Ref', domain.getEgressNumberRef())
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
