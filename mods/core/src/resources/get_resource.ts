import { routr } from "../common/routr";
import { GetResourceRequest } from "./types";
import logger from "@fonoster/logger";

export default async function getResource(
  request: GetResourceRequest
): Promise<unknown> {
  logger.verbose("getting resource", { request });

  await routr.connect();

  const jsonObj = await routr
    .resourceType(`${request.kind.toLowerCase()}s`)
    .get(request.ref);

  return jsonObj && jsonObj.metadata.accessKeyId === request.accessKeyId
    ? jsonObj
    : null;
}
