const { NodeVM } = require('vm2')
const fs = require('fs')

const vm = new NodeVM({
    require: {
        builtin: ['fs'],
        import: ['/Users/psanders/Projects/yaps/apps/hello-world/yaps-functions.js']
    }
})

const script = fs.readFileSync('/Users/psanders/Projects/yaps/apps/hello-world/index.js', 'utf8')
vm.run(script)
