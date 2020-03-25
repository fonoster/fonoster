const { logger } = require('@yaps/core')
logger.transports.forEach(t => (t.silent = true))
