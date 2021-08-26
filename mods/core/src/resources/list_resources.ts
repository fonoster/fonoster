import routr from "../common/routr";
import {ListResourceRequest, ListResourceResponse} from "./types";

export default async function (
  request: ListResourceRequest
): Promise<ListResourceResponse> {
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

  const resources = result.data;

  return {
    nextPageToken: resources.length > 0 ? request.page + 1 : null,
    resources
  };
}
