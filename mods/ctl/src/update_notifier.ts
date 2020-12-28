import { UpdateNotifier } from 'update-notifier'
const pkg = require('../package.json')

export function Notifier () {
  const notifier = new UpdateNotifier({
    pkg: {
      name: '@fonos/ctl',
      version: pkg.version
    },
    updateCheckInterval: 1000 * 60 * 60 * 24
  })

  notifier.check()

  if (notifier.update) {
    let message = `
      Update available: ${notifier.update.current} -> ${notifier.update.latest}
      To install run npm i @fonos/ctl \n`

    return console.log(message)
  }
}
