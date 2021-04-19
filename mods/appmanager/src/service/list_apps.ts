import redis from "@fonos/core/src/common/redis";
import {App} from "./protos/appmanager_pb";
import jsonToApp from "./json_to_app";

export default async function (
  pageToken: number,
  pageSize: number,
  accessKeyId: string
) {
  if (!pageToken) return {};
  pageToken--;
  pageSize--;

  let upperRange = pageToken + pageSize;

  const appsRefs = await redis.lrange("apps", pageToken, upperRange);
  const apps: App[] = [];

  for (const idx in appsRefs) {
    const jsonString = await redis.get(appsRefs[idx]);
    const app: App = jsonToApp(JSON.parse(jsonString));

    if (
      app.getStatus() != App.Status.REMOVED &&
      app.getAccessKeyId() === accessKeyId
    )
      apps.push(jsonToApp(JSON.parse(jsonString)));
  }

  upperRange++;

  return {
    apps,
    pageToken: upperRange
  };
}
