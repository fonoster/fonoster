const flat = require('flat')
const crypto = require('crypto')

const computeFilename = (text, options = {}, format = 'wav') => {
    let c = text
    if (options.cachingFields) {
        const flatObj = flat(options)
        c = options.cachingFields.map(opt => flatObj[opt]).sort().join()
    }
    return crypto.createHash('md5')
        .update(`${text},${c}`).digest('hex') + '.' + format
}

// Expects a json object one level deep
const optionsToQueryString = (object = {}) => Object.keys(object)
      .map(key => `${key}=${object[key].toString()}`)
      .join('&');

// Keeping this simple for now
// Expects the input file to be a .wav
const transcode = (fileIn, fileOut) => new Promise((resolve, reject) => {
    // We need a new instance to avoid collitions
    const sox = require('sox-audio')()
    sox.on('error',
        (err, stdout, stderr) => reject(`Cannot process audio: ${err.message}`) )
    sox.input(fileIn)

    // TODO: Investigate other formats that can produce a better audio quality
    sox.output(fileOut)
       .outputSampleRate(8000)
       .outputFileType('wav')
    sox.run()
    sox.on('end', () => resolve(fileOut))
})

const transcodeSync = (fileIn, fileOut) =>  {
    const sleep = require('sync').sleep
    let result
    let error

    this.transcode(fileIn, fileOut)
      .then(r => result = r)
        .catch(e => error = e)

    while(result === undefined && error === undefined) sleep(100)

    if (error) throw error

    return result
}

module.exports.computeFilename = computeFilename
module.exports.transcode = transcode
module.exports.transcodeSync = transcodeSync
module.exports.optionsToQueryString = optionsToQueryString
