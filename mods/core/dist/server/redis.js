const Redis = require('ioredis')
const host = process.env.APISERVER_DS_HOST || 'localhost'
const port = process.env.APISERVER_DS_PORT || 6379
module.exports = new Redis(`redis://${host}:${port}`)
//# sourceMappingURL=redis.js.map
