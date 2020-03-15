/**
 * @author Pedro Sanders
 * @since v1
 */
const flat = require('flat')
const crypto = require('crypto')

const computeFilename = (text, options = {}) => {
    let c = text
    if (options.cachingFields) {
        const flatObj = flat(options)
        c = options.cachingFields.map(opt => flatObj[opt]).sort().join()
    }
    return crypto.createHash('md5')
        .update(`${text},${c}`).digest('hex')
}

// Expects a json object one level deep
const optionsToQueryString = (object = {}) => Object.keys(object)
      .map(key => `${key}=${object[key].toString()}`)
      .join('&');

// Keeping this simple for now
// Expects the input file to be a .wav
const transcode = file => new Promise((resolve, reject) => {
    const fileOut = file + '_transcoded'
    const sox = require('sox-audio')()
    sox.on('error',
      (err, stdout, stderr) => reject(`Cannot process audio: ${err.message}`) )
    sox.input(file)
    sox.output(fileOut)
       .outputSampleRate(8000)
       .outputFileType('wav')
    sox.run()
    sox.on('end', () => resolve(fileOut))
})

module.exports.computeFilename = computeFilename
module.exports.transcode = transcode
module.exports.optionsToQueryString = optionsToQueryString
