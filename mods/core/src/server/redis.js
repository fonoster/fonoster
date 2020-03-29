const Redis = require('ioredis')
const host = process.env.DS_HOST || 'localhost'
const port = process.env.DS_PORT || 6379
module.exports = new Redis(`redis://${host}:${port}`)
