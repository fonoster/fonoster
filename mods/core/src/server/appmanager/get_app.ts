import redis from "../../common/redis";
import { App } from "../protos/appmanager_pb";
import { FonosError } from "@fonos/errors";
import jsonToApp from "./json_to_app";

export default async function (ref: string, accessKeyId: string): Promise<App> {
  const jsonString = await redis.get(ref);
  const app: App = jsonToApp(JSON.parse(jsonString));
  if (!jsonString || App.Status.REMOVED == app.getStatus())
    throw new FonosError(`App ${ref} does not exist`);
  return accessKeyId === app.getAccessKeyId() ? app : null;
}
