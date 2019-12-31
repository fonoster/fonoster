const AGIServer = require('agi-node').AGIServer
const { NodeVM } = require('vm2')
const fs = require('fs')
const vm = new NodeVM(require('./vm.json'))

function dispatcher(channel) {
    try {
        const ep = process.env.MC_APP_ENTRYPOINT
        const contents =
            fs.readFileSync(`${__dirname}/../functions${entryPoint}`, 'utf8')
        vm.run(contents)(channel)
    } catch(e) {
        console.err(e)
    }
}

new AGIServer(dispatcher, process.env.MC_AGI_PORT)
