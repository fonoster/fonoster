/**
 * @author Pedro Sanders
 * @since v1
 */
//const config = require('./config')
//const recognize = require('./recognize')

module.exports = chan => {
  // Overwritting default TTS Engine
  //config(chan)
  //chan.('Hi! What is your name?')
  const result = chan.record()
  console.log(JSON.stringify(result))
  chan.play(result.recordingUri)
  //chan.say(`Hello ${recognize(chan)}. How can I help today`)
}