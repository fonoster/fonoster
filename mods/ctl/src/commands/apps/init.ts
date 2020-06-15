import { Command } from '@oclif/command'
import { prompt } from 'inquirer'
import { join, basename } from 'path'
const nodePlop = require('node-plop')
const plop = nodePlop(join(__dirname, '..', '..', '..', 'dist', 'plopfile.js'))
const init = plop.getGenerator('init')

export default class InitCommand extends Command {
  static description = `creates a new empty application
  ...
  Extra documentation goes here
  `

  async run () {
    console.log('This utility will help you create a basic voice application')
    console.log('to help you get start quickly. Press ^C at any time to quit.')

    const dirname = basename(process.cwd())
    const answers: any = await prompt([
      {
        name: 'pckgName',
        message: 'package name',
        type: 'input',
        default: dirname
      },
      {
        name: 'pckgVersion',
        message: 'version',
        type: 'input',
        default: '1.0.0'
      },
      { name: 'pckgDesc', message: 'description', type: 'input' },
      {
        name: 'entryPoint',
        message: 'entry point',
        type: 'input',
        default: 'src/index.js'
      },
      {
        name: 'bucket',
        message: 'bucket name',
        type: 'input',
        default: 'default'
      },
      { name: 'author', message: 'author', type: 'input' },
      { name: 'license', message: 'license', type: 'input', default: 'ISC' },
      { name: 'locale', message: 'locale', type: 'input', default: 'en_US' },
      {
        name: 'confirm',
        message: 'does everything look good?',
        type: 'confirm'
      }
    ])

    answers.cwd = process.cwd()

    if (!answers.confirm) {
      console.log('Aborted')
    } else {
      init.runActions(answers).then(() => console.log('All done'))
    }
  }
}
