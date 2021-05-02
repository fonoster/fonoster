import routr from "../common/routr";
import {ListResourceRequest, ListResourceResponse} from "./types";

export default async function (
  request: ListResourceRequest
): Promise<ListResourceResponse> {
  if (!request.page) return {};
  await routr.connect();
  const result = await routr
    .resourceType(`${request.kind.toLowerCase()}s`)
    .list({
      page: request.page,
      itemsPerPage: request.itemsPerPage
    });

  const resources = [];
  for (const i in result.data) {
    if (result.data[i].metadata.accessKeyId === request.accessKeyId) {
      resources.push(result.data[i]);
    }
  }

  return {
    nextPageToken: resources.length > 0 ? request.page + 1 : null,
    resources
  };
}
