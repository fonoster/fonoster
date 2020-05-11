const { logger } = require('@fonos/core')
logger.transports.forEach(t => (t.silent = true))
