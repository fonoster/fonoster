import RabbitQConnector from "./rabbitq_connector";
import logger from "@fonos/logger";

export default class EventsSender extends RabbitQConnector {
  constructor(address: string[], q: string) {
    super(address, q);
  }

  async sendToQ(payload: any) {
    if (process.env.EVENTS_ENABLED !== "true") {
      logger.verbose(
        "@fonos/events rabbitq connector [ignoring event: events service is disabled]"
      );
      return;
    }
    logger.verbose(
      `events.EventsSender.sendToQ [sent message to q => ${this.q}]`
    );
    await this.channelWrapper.sendToQueue(this.q, {
      data: payload
    });
  }
}
