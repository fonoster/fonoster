import RabbitQConnector from './rabbitq_connector'
import logger from '@fonos/logger'

export default class EventsSender extends RabbitQConnector {
  constructor (address: string[], q: string) {
    super(address, q)
  }

  async sendToQ (payload: any) {
    logger.log(
      'debug',
      `events.EventsSender.sendToQ [sent message to q => ${this.q}]`
    )
    await this.channelWrapper.sendToQueue(this.q, {
      data: payload
    })
  }
}
