import routr from "../../common/routr";

export default async function (resource: any, decoder: Function) {
  await routr.connect();
  const ref = await routr
    .resourceType(`${resource.kind.toLowerCase()}s`)
    .create(resource);
  const jsonObj = await routr
    .resourceType(`${resource.kind.toLowerCase()}s`)
    .get(ref);
  return decoder(jsonObj);
}
