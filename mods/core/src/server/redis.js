/**
 * @author Pedro Sanders
 * @since v1
 */
const Redis = require('ioredis')

// This should be a singleton
module.exports = new Redis('redis://127.0.0.1:6379')
