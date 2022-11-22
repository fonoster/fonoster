import { routr } from "../common/routr";
import getResource from "./get_resource";
import { DeleteResourceRequest } from "./types";
import opentelemetry from "@opentelemetry/api";
import logger from "@fonoster/logger";

const tracer = opentelemetry.trace.getTracer("fonoster-tracer");

export default async function deleteResource(
  request: DeleteResourceRequest
): Promise<string> {
  const currentSpan = opentelemetry.trace.getSpan(
    opentelemetry.context.active()
  );
  const meta = { ...request, traceId: currentSpan.spanContext().traceId };
  const span = tracer.startSpan("delete_resource.ts:deleteResource()", {
    kind: 1
  });

  logger.verbose("deleting resource", meta);
  span.addEvent("deleting resource", meta);

  await routr.connect();

  if (await getResource(request)) {
    await routr
      .resourceType(`${request.kind.toLowerCase()}s`)
      .delete(request.ref);
  }

  span.end();
  return request.ref;
}
