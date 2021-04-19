import {nanoid} from "nanoid";
import redis from "@fonos/core/src/common/redis";
import {App} from "./protos/appmanager_pb";
import {EventsSender} from "@fonos/events";
import logger from "@fonos/logger";

let events: any;

try {
  if (!process.env.EVENTS_BROKERS)
    throw new Error(
      "core.common.events [environment variable EVENTS_BROKERS not set]"
    );
  const brokers = process.env.EVENTS_BROKERS.split(",");
  events = new EventsSender(brokers, "APP_CREATED");
  events.connect();
} catch (e) {
  logger.error(e);
}

export default async function (app: App, accessKeyId: string): Promise<App> {
  app.setAccessKeyId(accessKeyId);
  if (!app.getRef()) app.setRef(nanoid(10));
  app.setStatus(App.Status.CREATING);
  app.setCreateTime(new Date().toString());
  app.setUpdateTime(new Date().toString());

  await redis.lrem("apps", 0, app.getRef());
  await redis.lpush("apps", app.getRef());
  await redis.set(app.getRef(), JSON.stringify(app.toObject()));
  await events.sendToQ({
    name: app.getRef()
  });
  return app;
}
