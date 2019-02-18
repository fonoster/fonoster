var AGIServer = require('ding-dong');

var handler = function (context) {
  //context.answer()
  context.streamFile('beep')
  //context.hangup()
};

var agi = new AGIServer(handler, {debug: true});
agi.start(4573);
