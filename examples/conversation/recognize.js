const GoogleASR = require('@fonos/googleasr').default
const googleCredentials = require('./credentials')

module.exports = chan => {
    const result = chan.record()
    const asr = new GoogleASR(googleCredentials)
    return asr.transcribeSync(result.recordingUri)
}