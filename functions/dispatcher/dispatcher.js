const AGIServer = require('agi-node').AGIServer
const { NodeVM } = require('vm2')
const fs = require('fs')
const vm = new NodeVM(require('./vm.json'))
// const registry = 

function dispatcher(channel) {
  // TODO: build a routing module for ingressFunctions
  // registry.getHandlerFor(channel.request)
  const contents = fs.readFileSync(__dirname + '/../hello-world/index.js', 'utf8')
  vm.run(contents)(channel)
}

// TODO: This should be configurable
new AGIServer(dispatcher, 4573)
