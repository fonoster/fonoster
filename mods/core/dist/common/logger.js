var winston = require('winston')
var fluentTransport = require('fluent-logger').support.winstonTransport()
var config = {
  host: process.env.LOGS_DRIVER_HOST,
  port: process.env.LOGS_DRIVER_PORT,
  timeout: 3.0,
  requireAckResponse: true // Add this option to wait response from Fluentd certainly
}
var fluent = new fluentTransport(
  process.env.LOG_OPT_TAG_PREFIX +
    '.' +
    process.env.COMPOSE_PROJECT_NAME +
    '.mediacontroller',
  config
)
var logger = winston.createLogger({
  level: 'debug',
  levels: winston.config.npm.levels,
  format: winston.format.json(),
  transports: [fluent, new winston.transports.Console()]
})
if (process.env.NODE_ENV === 'dev') {
  logger.remove(fluent)
}
logger.on('flush', function () {
  console.log('flush')
})
logger.on('finish', function () {
  console.log('finish')
  fluent.sender.end('end', {}, function () {})
})
// WARNING: Using logger.end() causes an exception (Error: write after end)
module.exports = logger
//# sourceMappingURL=logger.js.map
