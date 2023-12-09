import { routr } from "../common/routr";
import { DeleteResourceRequest } from "./types";
import getResource from "./get_resource";
import logger from "@fonoster/logger";

export default async function deleteResource(
  request: DeleteResourceRequest
): Promise<string> {
  const meta = { ...request };

  logger.verbose("deleting resource", meta);

  await routr.connect();

  if (await getResource(request)) {
    await routr
      .resourceType(`${request.kind.toLowerCase()}s`)
      .delete(request.ref);
  }

  return request.ref;
}
