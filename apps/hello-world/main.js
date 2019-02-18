const AGIServer = require('ding-dong');

function main(channel) {
  channel.answer()
  channel.streamFile('beep')
  channel.hangup()
}

var agi = new AGIServer(main, {debug: true});
agi.start(4573);
