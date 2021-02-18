import Verb, { VerbConfig } from './verb'
import Play from './play'

class Wait extends Verb {
  constructor (channel: any, config: VerbConfig) {
    super(channel, config)
  }

  run (time: number): void {
    let t = 1

    if (time && time <= 0)
      throw new Error('time must an number equal or greater than zero.')
    if (time) t = time

    while (t > 0) {
      new Play(this.config, this.channel).run('silence/1')
      t--
    }
  }
}

export default Wait
