const GoogleTTS = require('@fonos/googletts').default
const googleCredentials = require('./credentials')

module.exports = chan => {
    const conf = chan._config
    conf.tts = new GoogleTTS(googleCredentials)
    conf.bucket = 'default'
    chan.config(conf)
}