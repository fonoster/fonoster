import amqp from "amqp-connection-manager";
import logger from "@fonos/logger";

export default class RabbitQConnector {
  address: string[];
  channelWrapper: any;
  q: string;
  constructor(address: string[], q: string) {
    this.address = address;
    this.q = q;
  }

  connect() {
    logger.log(
      "verbose",
      "events.RabbitQConnector.connect [connecting to rabbitq]"
    );
    const connection = amqp.connect(this.address);
    this.channelWrapper = connection.createChannel({
      json: true,
      setup: (channel: any) => {
        logger.log(
          "info",
          `events.RabbitQConnector.connect [setting up q => ${this.q}, durable => false]`
        );
        return channel.assertQueue(this.q, {durable: false});
      }
    });
  }
}
