import Verb from './verb'

const objectid = require('objectid')

class Record extends Verb {
  _config: any
  channel: any

  constructor (config: any, channel: any) {
    super(config)
    this._config = config
    this.channel = channel
  }

  run (callDetailRecord: any, options?: any) {
    const format = 'wav'
    let offset = 0
    let beep = true
    let maxDuration = 3600 * 1000
    let finishOnKey = '1234567890#*'

    if (options) {
      if (options.maxDuration && options.maxDuration < 1)
        throw new Error(
          `${options.maxDuration} is not an acceptable maxDuration value. Must be a number greater than 1. Default is 3600 (1 hour)`
        )
      if (options.beep && typeof options.beep !== 'boolean')
        throw new Error(
          `${options.beep} is not an acceptable value. Must be a true or false`
        )

      // Overwrite values
      if (options.maxDuration) maxDuration = options.maxDuration * 1000
      if (options.beep) beep = options.beep
      if (options.finishOnKey) finishOnKey = options.finishOnKey
    }

    const filename = objectid()
    const file = `/tmp/${filename}`
    const res = this.channel.recordFile(
      file,
      format,
      finishOnKey,
      maxDuration,
      offset,
      beep
    )

    if (res.code !== 200) throw new Error(res.rawReply)

    return {
      keyPressed: res.attributes.result,
      recordingUri: `/tmp/${filename}.${format}`,
      filename: filename,
      format: format,
      callRef: callDetailRecord.ref
    }
  }
}

export default Record
