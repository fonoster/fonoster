import { routr } from "../common/routr";
import opentelemetry from "@opentelemetry/api";
import logger from "@fonoster/logger";

const tracer = opentelemetry.trace.getTracer("fonoster-tracer");

export default async function (resource: any): Promise<any> {
  const currentSpan = opentelemetry.trace.getSpan(
    opentelemetry.context.active()
  );
  const meta = {
    kind: resource.kind,
    accessKeyId: resource.metadata.accessKeyId,
    traceId: currentSpan.spanContext().traceId
  };
  const span = tracer.startSpan("create_resource.ts:createResource()", {
    kind: 1
  });

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

  span.end();

  return result;
}
