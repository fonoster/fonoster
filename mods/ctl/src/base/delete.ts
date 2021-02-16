import '../config'
import Command from '@oclif/command'
import { Input } from '@oclif/parser'
import { cli } from 'cli-ux'

export default abstract class extends Command {
  ref: string
  async deleteResource (API: any, funcName: string) {
    cli.action.start(`deleting resource ${this.ref}`)
    await API[funcName](this.ref)
    await cli.wait(1000)
    cli.action.stop('done')
  }

  async init () {
    const { args } = this.parse(<Input<any>>this.constructor)
    this.ref = args.ref
  }

  async catch (err: any) {
    return super.catch(err)
  }

  async finally (err: any) {
    return super.finally(err)
  }
}
