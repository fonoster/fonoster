import {EventsSender} from "@fonos/events";
import logger from "@fonos/logger";

let instance: any;

try {
  if (!process.env.EVENTS_BROKERS)
    throw new Error("voice [environment variable EVENTS_BROKERS not set]");
  const brokers = process.env.EVENTS_BROKERS.split(",");
  instance = new EventsSender(brokers, process.env.EVENTS_QUEUE);
  instance.connect();
} catch (e) {
  logger.error(e);
}

export default instance;
