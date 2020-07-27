import { EventsSender } from '@fonos/events'
import logger from '@fonos/logger'

try {
  if (!process.env.EVENTS_BROKERS)
    throw 'core.common.events [environment variable EVENTS_BROKERS not set]'
  const brokers = process.env.EVENTS_BROKERS.split(',')
  const instance = new EventsSender(brokers, process.env.EVENTS_QUEUE)
  instance.connect()
} catch (e) {
  logger.error(e)
}

export default instance
