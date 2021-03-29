import redis from "../../common/redis";
import {FonosError} from "@fonos/errors";
import jsonToApp from "./json_to_app";
import {App} from "../protos/appmanager_pb";
import {EventsSender} from "@fonos/events";
import logger from "@fonos/logger";

let events: any;

try {
  if (!process.env.EVENTS_BROKERS)
    throw new Error(
      "core.common.events [environment variable EVENTS_BROKERS not set]"
    );
  const brokers = process.env.EVENTS_BROKERS.split(",");
  events = new EventsSender(brokers, "APP_REMOVED");
  events.connect();
} catch (e) {
  logger.error(e);
}

export default async function (ref: string, accessKeyId: string) {
  const result = await redis.get(ref);
  if (!result) throw new FonosError(`App ${ref} does not exist`);
  const app: App = jsonToApp(JSON.parse(result));

  if (!app || app.getAccessKeyId() !== accessKeyId)
    throw new FonosError("resource does not exist");

  app.setStatus(App.Status.REMOVED);
  // NEED TO ALSO REMOVE FROM LRANGE
  await redis.set(app.getRef(), JSON.stringify(app.toObject()));
  await events.sendToQ({
    name: app.getRef()
  });
}
