import crypto from 'crypto'

const computeFilename = (text: string, options:any = {}, format:string = 'wav') => {
  const flat = require('flat')
  let c = text
  if (options.cachingFields) {
    const flatObj = flat(options)
    c = options.cachingFields
      .map((opt:string) => flatObj[opt])
      .sort()
      .join()
  }
  return (
    crypto
      .createHash('md5')
      .update(`${text},${c}`)
      .digest('hex') +
    '.' +
    format
  )
}

// Expects a json object one level deep
const optionsToQueryString = (object: any) =>
  Object.keys(object)
    .map((key:string) => `${key}=${object[key].toString()}`)
    .join('&')

// Keeping this simple for now
// Expects the input file to be a .wav
const transcode = (fileIn: string, fileOut: string) =>
  new Promise((resolve, reject) => {
    // We need a new instance to avoid collitions
    const sox = require('sox-audio')()
    sox.on('error', (err: any, stdout: any, stderr: any) =>
      reject(`Cannot process audio: ${err.message}`)
    )
    sox.input(fileIn)

    // TODO: Investigate other formats that can produce a better audio quality
    sox
      .output(fileOut)
      .outputSampleRate(8000)
      .outputFileType('wav')
    sox.run()
    sox.on('end', () => resolve(fileOut))
  })

const transcodeSync = (fileIn: string, fileOut: string) => {
  const sleep = require('sync').sleep
  let result
  let error

  transcode(fileIn, fileOut)
    .then(r => (result = r))
    .catch(e => (error = e))

  while (result === undefined && error === undefined) sleep(100)

  if (error) throw error

  return result
}

export {
  computeFilename,
  transcode,
  transcodeSync,
  optionsToQueryString
}