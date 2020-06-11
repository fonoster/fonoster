import Verb from './verb'

class Play extends Verb {
  _config: any
  channel: any

  constructor (config: any, channel: any) {
    super(config)
    this._config = config
    this.channel = channel
  }

  run (file: string, options?: any) {
    if (!file) throw new Error('you must indicate a file.')
    let finishOnKey = '#'

    if (options) {
      if (
        options.finishOnKey &&
        (options.finishOnKey.length !== 1 ||
          '1234567890#*'.indexOf(options.finishOnKey) < 0)
      )
        throw new Error(
          `Invalid finishOnKey parameter: found ${options.finishOnKey} but must be a single digit type of 0-9,#,*`
        )

      if (options.finishOnKey) finishOnKey = options.finishOnKey
    }

    const result = this.channel.streamFile(file, finishOnKey)

    if (result.code === 200) return result.attributes.result

    throw new Error(result.rawReply)
  }
}

export default Play
