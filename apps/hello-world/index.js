module.exports = function(channel) {
  console.log('Script got call %s -> %s', channel.request.callerid, channel.request.extension)
  channel.answer()
  channel.streamFile('beep')
  channel.hangup()
}
