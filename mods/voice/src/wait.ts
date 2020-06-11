import Verb from './verb'
import Play from './play'

class Wait extends Verb {
  _config: any
  channel: any

  constructor (config: any, channel: any) {
    super(config)
    this._config = config
    this.channel = channel
  }

  run (time: number) {
    let t = 1

    if (time && time <= 0)
      throw new Error('time must an number equal or greater than zero.')
    if (time) t = time

    while (t > 0) {
      new Play(this._config, this.channel).run('silence/1')
      t--
    }
  }
}

export default Wait
