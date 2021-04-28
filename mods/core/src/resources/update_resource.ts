import routr from "../common/routr";


interface UpdateResourceRequest {
  accessKeyId: string,
  resource: object
}

export default async function (
request: UpdateResourceRequest
): Promise<string> {
  await routr.connect();

  const objFromDB = await routr
    .resourceType(`${request.resource['kind'].toLowerCase()}s`)
    .get(request['metadata'].ref);
  if (objFromDB.metadata.accessKeyId === request.accessKeyId) {
    request.resource['metadata'].accessKeyId = request.accessKeyId;
    await routr
      .resourceType(`${request.resource['kind'].toLowerCase()}s`)
      .update(request.resource);
    return request.resource['ref']
  }
  return null;
}
