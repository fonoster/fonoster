import RabbitQConnector from "./rabbitq_connector";
import logger from "@fonoster/logger";

export default class EventsRecvr extends RabbitQConnector {
  constructor(address: string[], q: string) {
    super(address, q);
  }

  watchEvents(func: Function) {
    if (!this.channelWrapper) {
      throw `events.EventsClient.watchEvents [must connect to rabbitq before watching.]`;
    }
    this.channelWrapper.addSetup((channel: any) => {
      return Promise.all([
        channel.consume(
          this.q,
          (msg: any) => {
            logger.log(
              "debug",
              `events.EventsClient.watchEvents [new event on q => ${
                this.q
              }, payload ${msg.content.toString()}]`
            );
            func(msg.content);
          },
          { noAck: true, exclusive: false }
        )
      ]);
    });
  }
}
