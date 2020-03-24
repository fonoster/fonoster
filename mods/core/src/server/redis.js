const Redis = require('ioredis')

module.exports = new Redis(
  `redis://${process.env.DS_HOST}:${process.env.DS_PORT}`
)
