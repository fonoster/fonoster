var Redis = require('ioredis')
var host = process.env.DS_HOST || 'localhost'
var port = process.env.DS_PORT || 6379
module.exports = new Redis('redis://' + host + ':' + port)
//# sourceMappingURL=redis.js.map
