const AGIServer = require('agi-node').AGIServer
const { NodeVM } = require('vm2')
const fs = require('fs')
const vm = new NodeVM(require('./vm.json'))

function dispatcher(channel) {
    try {
        const appPath = `/functions${process.env.MC_APP_ENTRYPOINT}`
        const contents =
            fs.readFileSync(appPath, 'utf8')
        vm.run(contents)(channel)
    } catch(e) {
        console.err(e)
    }
}

new AGIServer(dispatcher, process.env.MC_AGI_PORT)
