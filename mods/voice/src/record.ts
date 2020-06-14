import Verb from './verb'

const objectid = require('objectid')

interface RecordOptions {
  beep?: boolean
  maxDuration?: number
  finishOnKey?: string
  offset?: number
}

const validateMaxDuration = (maxDuration: number) => {
  if (maxDuration && maxDuration < 1)
    throw `${maxDuration} is not an acceptable maxDuration value. Must be a number greater than 1. Default is 3600 (1 hour)`
}

const validateBeep = (beep: boolean) => {
  if (beep && typeof beep !== 'boolean')
    throw `${beep} is not an acceptable value. Must be a true or false`
}

class Record extends Verb {
  constructor (channel: any) {
    super(channel)
  }

  run (callDetailRecord: any, options: RecordOptions = {}) {
    let {
      beep = true,
      maxDuration = 3600,
      finishOnKey = '1234567890#*',
      offset = 0
    } = options
    validateMaxDuration(maxDuration)
    validateBeep(beep)

    const format = 'wav'
    const filename = objectid()
    const res = this.channel.recordFile(
      `/tmp/${filename}`,
      'wav',
      finishOnKey,
      maxDuration * 1000,
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

export { Record as default, RecordOptions }
