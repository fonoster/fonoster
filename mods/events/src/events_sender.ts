import RabbitQConnector from './rabbitq_connector'
import logger from '@fonos/logger'

export default class EventsSender extends RabbitQConnector {
  constructor (address: string[], q: string) {
    super(address, q)
  }

  async sendToQ (event: string, payload: any) {
    logger.log(
      'debug',
      `events.EventsSender.sendToQ [sent event to q => ${this.q}, event: ${event}]`
    )
    await this.channelWrapper.sendToQueue(this.q, {
      name: event,
      data: payload
    })
  }
}
