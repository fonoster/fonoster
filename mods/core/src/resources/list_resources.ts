import { routr } from "../common/routr";
import { ListResourceRequest, ListResourceResponse } from "./types";
import opentelemetry from "@opentelemetry/api";
import logger from "@fonoster/logger";

const tracer = opentelemetry.trace.getTracer("fonoster-tracer");

export default async function (
  request: ListResourceRequest
): Promise<ListResourceResponse> {
  const currentSpan = opentelemetry.trace.getSpan(
    opentelemetry.context.active()
  );
  const meta = { ...request, traceId: currentSpan.spanContext().traceId };
  const span = tracer.startSpan("list_resource.ts:listResources()", {
    kind: 1
  });

  logger.verbose("listing resources", meta);
  span.addEvent("listing resources", meta);

  if (!request.page) return {};

  await routr.connect();
  const result = await routr
    .resourceType(`${request.kind.toLowerCase()}s`)
    .list(
      {
        page: request.page,
        itemsPerPage: request.itemsPerPage
      },
      request.accessKeyId
    );

  span.end();

  const resources = result.data;

  return {
    nextPageToken: resources.length > 0 ? request.page + 1 : null,
    resources
  };
}
