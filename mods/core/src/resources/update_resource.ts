import { routr } from "../common/routr";
import { UpdateResourceRequest } from "./types";

export default async function (request: UpdateResourceRequest): Promise<any> {
  await routr.connect();

  const objFromDB = await routr
    .resourceType(`${request.resource["kind"].toLowerCase()}s`)
    .get(request.resource["metadata"].ref);

  if (objFromDB.metadata.accessKeyId === request.accessKeyId) {
    request.resource["metadata"].accessKeyId = request.accessKeyId;
    await routr
      .resourceType(`${request.resource["kind"].toLowerCase()}s`)
      .update(request.resource);
    return request.resource;
  }
  return null;
}
