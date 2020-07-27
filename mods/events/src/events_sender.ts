import RabbitQConnector from './rabbitq_connector'

export default class EventsSender extends RabbitQConnector {
  constructor (address: string[], q: string) {
    super(address, q)
  }

  async sendToQ (payload: any) {
    await this.channelWrapper.sendToQueue(this.q, {
      name: this.q,
      data: payload
    })
  }
}
