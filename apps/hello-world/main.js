const AGIServer = require('ding-dong');

function main(context) {
  context.onEvent('variables')
      .then(function (vars) {
          console.log('vars', vars);
          return context.streamFile('beep');
      })
      .then(function (result) {
          return context.setVariable('RECOGNITION_RESULT', 'I\'m your father, Luc');
      })
      .then(function (result) {
          return context.end();
      })
}

var agi = new AGIServer(main, {debug: true});
agi.start(4573);
