const {Command, flags} = require('@oclif/command')
const { cli } = require('cli-ux')

class InitCommand extends Command {
  async run() {
    const name = await cli.prompt('What is your name?')
    console.log('name: ' + name)
  }
}

InitCommand.description = `deletes an existing voice application
...
Extra documentation goes here
`

InitCommand.flags = {
  file: flags.string({char: 'f', description: 'path to project'}),
}

InitCommand.args = [
  {name: 'file_path'}
]

module.exports = InitCommand
