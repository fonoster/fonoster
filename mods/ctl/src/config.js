if (process.env.NODE_ENV === 'dev' || !process.env.NODE_ENV) {
  require('dotenv').config({ path: __dirname + '/../../.env' })
} else {
  console.log('running production env')
}

const { logger } = require('@yaps/core')
logger.transports.forEach(t => (t.silent = true))
