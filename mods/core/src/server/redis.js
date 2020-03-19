const Redis = require('ioredis')

// This should be a singleton
module.exports = new Redis(`redis://${process.env.DS_HOST}:${process.env.DS_PORT}`)
