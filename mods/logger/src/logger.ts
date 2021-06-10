import winston from "winston";
import fluentLogger from "fluent-logger";

const fluentTransport = fluentLogger.support.winstonTransport();

const fluent = new fluentTransport(
  `${process.env.LOG_OPT_TAG_PREFIX}.${process.env.COMPOSE_PROJECT_NAME}.mediacontroller`,
  {
    host: process.env.LOGS_DRIVER_HOST,
    port: process.env.LOGS_DRIVER_PORT,
    timeout: 3.0,
    requireAckResponse: true
  }
);

const level = process.env.NODE_ENV !== "production" ? "verbose" : "info";

const transports =
  process.env.NODE_ENV !== "production"
    ? [new winston.transports.Console()]
    : [fluent];

const format =
  process.env.NODE_ENV !== "production"
    ? winston.format.simple()
    : winston.format.json();

const logger = winston.createLogger({
  format: winston.format.combine(winston.format.colorize(), format),
  levels: winston.config.npm.levels,
  transports,
  level
});

logger.on("finish", () => {
  fluent.sender.end("end", {}, () => {});
});

const mute = () => logger.transports.forEach((t: any) => (t.silent = true));

const unmute = () => logger.transports.forEach((t: any) => (t.silent = false));

export {logger as default, mute, unmute};
