import amqp from 'amqp-connection-manager'
import logger from '@fonos/logger'

export default class RabbitQConnector {
  address: string[]
  channelWrapper: any
  q: string
  constructor (address: string[], q: string) {
    this.address = address
    this.q = q
  }

  connect () {
    logger.info('events.RabbitQConnector.connect [connecting to rabbitq]')
    const connection = amqp.connect(this.address)
    this.channelWrapper = connection.createChannel({
      json: true,
      setup: (chanell: any) => {
        logger.info(
          `events.RabbitQConnector.connect [setting up q => ${this.q}, durable => false]`
        )
        return chanell.assertQueue(this.q, { durable: false })
      }
    })
  }
}
