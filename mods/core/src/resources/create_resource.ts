import { routr } from "../common/routr";
import { getLogger } from "@fonoster/logger";

const logger = getLogger({ service: "core", filePath: __filename });

export default async function (resource: any): Promise<any> {
  const meta = {
    kind: resource.kind,
    accessKeyId: resource.metadata.accessKeyId
    //traceId: currentSpan.spanContext().traceId
  };

  logger.verbose("creating resource", meta);
  //span.addEvent("creating resource", meta);

  await routr.connect();

  const ref = await routr
    .resourceType(`${resource["kind"].toLowerCase()}s`)
    .create(resource);

  // Get from the database
  const result = await routr
    .resourceType(`${resource["kind"].toLowerCase()}s`)
    .get(ref);

  return result;
}
