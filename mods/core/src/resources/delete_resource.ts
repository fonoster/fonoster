import routr from "../common/routr";
import getResource from "./get_resource";
import { DeleteResourceRequest } from "./types";
import ot from '@opentelemetry/api';
import logger from "@fonoster/logger";
import {Tracer as T} from "@fonoster/common"

const tracer = T.init("core");

export default async function deleteResource(
  request: DeleteResourceRequest
): Promise<string> {
  const currentSpan = ot.trace.getSpan(ot.context.active());
  const meta =  { ...request, traceId: currentSpan.spanContext().traceId}
  const span = tracer.startSpan('delete_resource.ts:deleteResource()', {kind: 1});
  
  logger.verbose('deleting resource', meta);
  span.addEvent('deleting resource', meta);

  await routr.connect();

  if (await getResource(request)) {
    await routr
      .resourceType(`${request.kind.toLowerCase()}s`)
      .delete(request.ref);
  }

  span.end();
  return request.ref;
}
