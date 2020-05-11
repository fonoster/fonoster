/**
 * @author Pedro Sanders
 * @since v1
 */
const MaryTTS = require('@fonos/tts/marytts')
const { transcodeSync } = require('@fonos/tts/utils')
const { storage } = require('./config')

// This is how the Say verb works under the hood
module.exports = chan => {
    // Default TTS
    const tts = new MaryTTS({ host: process.env.TTS_ENGINE_HOST })

    // MaryTTS generates an audio and places at MC_TTS_TEMP_FOLDER
    const pathToFile = tts.synthesizeSync('Hello World')

    // The file must be transcoded to a format Asterisk understand.
    // We transcode to 8k pcm wav format by default.
    // Npm package 'sox-audio' is available if you need other options
    const pathToTranscodedFile = transcodeSync(pathToFile)

    // Upload transcode audio to files server
    const url = storage.uploadFileSync('hello-world.wav', pathToTranscodedFile)

    // Stream the file from the files server
    chan.play(url)
}
