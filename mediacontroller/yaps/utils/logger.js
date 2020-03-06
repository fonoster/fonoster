const winston = require('winston')
const fluentTransport = require('fluent-logger').support.winstonTransport()

const config = {
    host: process.env.LOGS_DRIVER_HOST,
    port: process.env.LOGS_DRIVER_PORT,
    timeout: 3.0,
    requireAckResponse: true // Add this option to wait response from Fluentd certainly
}

const fluent = new fluentTransport(
    `${process.env.LOG_OPT_TAG_PREFIX}.${process.env.COMPOSE_PROJECT_NAME}.mediacontroller`,
        config)

const logger = winston.createLogger({
    levels: winston.config.npm.levels,
    format: winston.format.json(),
    transports: [fluent, new (winston.transports.Console)()]
})

logger.on('flush', () => {
    console.log("flush")
})

logger.on('finish', () => {
    console.log("finish")
    fluent.sender.end("end", {}, () => {})
})

// WARNING: Using logger.end() causes an exception (Error: write after end)

module.exports = logger
