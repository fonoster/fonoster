import Verb from './verb'

const objectid = require('objectid')

interface RecordOptions {
  beep: boolean
  maxDuration: number
  finishOnKey: string
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

  run (callDetailRecord: any, options?: RecordOptions) {
    let {
      beep = true,
      maxDuration = 3600,
      finishOnKey = '1234567890#*'
    } = options
    validateMaxDuration(maxDuration)
    validateBeep(beep)

    const format = 'wav'
    const filename = objectid()
    const file = `/tmp/${filename}`
    const offset = 0
    const res = this.channel.recordFile(
      file,
      format,
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

export default Record
