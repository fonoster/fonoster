const AGIServer = require('agi-node').AGIServer
const funcs = require('./index')
new AGIServer(funcs, 4573)
