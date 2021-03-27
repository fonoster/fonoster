import routr from "../../common/routr";

export default async function (
  accessKeyId: string,
  resource: any,
  decoder: Function
) {
  await routr.connect();

  const objFromDB = await routr
    .resourceType(`${resource.kind.toLowerCase()}s`)
    .get(resource.metadata.ref);
  if (objFromDB.metadata.accessKeyId === accessKeyId) {
    resource.metadata.accessKeyId = accessKeyId;
    await routr
      .resourceType(`${resource.kind.toLowerCase()}s`)
      .update(resource);
    return decoder(resource);
  }
  return null;
}
