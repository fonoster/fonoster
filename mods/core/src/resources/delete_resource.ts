import routr from "../common/routr";
import getResource from "./get_resource";
import { DeleteResourceRequest } from "./types";

export default async function deleteResource(request: DeleteResourceRequest): Promise<string> {
  await routr.connect();
  if (await getResource(request)) {
    await routr.resourceType(`${request.kind.toLowerCase()}s`).delete(request.ref);
  }
  return request.ref
}
