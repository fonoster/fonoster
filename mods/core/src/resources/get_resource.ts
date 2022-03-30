import routr from "../common/routr";
import {GetResourceRequest} from "./types";
import ot from "@opentelemetry/api";
import logger from "@fonoster/logger";
import {Tracer as T} from "@fonoster/common";

const tracer = T.init("core");

export default async function getResource(
  request: GetResourceRequest
): Promise<unknown> {
  const currentSpan = ot.trace.getSpan(ot.context.active());
  const meta = {...request, traceId: currentSpan.spanContext().traceId};
  const span = tracer.startSpan("get_resource.ts:getResource()", {kind: 1});

  logger.verbose("getting resource", meta);
  span.addEvent(`getting resource`, meta);

  await routr.connect();

  const jsonObj = await routr
    .resourceType(`${request.kind.toLowerCase()}s`)
    .get(request.ref);
  // Return only if exist and is the owner of the resource

  span.end();

  return jsonObj && jsonObj.metadata.accessKeyId === request.accessKeyId
    ? jsonObj
    : null;
}
