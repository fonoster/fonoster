import winston from 'winston'
import fluentLogger from 'fluent-logger'

const fluentTransport = fluentLogger.support.winstonTransport()

const fluent = new fluentTransport(
  `${process.env.LOG_OPT_TAG_PREFIX}.${process.env.COMPOSE_PROJECT_NAME}.mediacontroller`,
  {
    host: process.env.LOGS_DRIVER_HOST,
    port: process.env.LOGS_DRIVER_PORT,
    timeout: 3.0,
    requireAckResponse: true
  }
)

const transports = process.env.NODE_ENV === 'dev' ?
  [new winston.transports.Console()]:
  [fluent]

const logger = winston.createLogger({
  level: 'debug',
  levels: winston.config.npm.levels,
  format: winston.format.json(),
  transports
})

logger.on('finish', () => {
  fluent.sender.end('end', {}, () => {})
})

const mute = () => logger.transports.forEach((t: any) => (t.silent = true))

export { logger as default, mute }
