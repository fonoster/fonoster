import routr from "../common/routr";

export default async function (resource: object) {
  await routr.connect();
  const ref = await routr
    .resourceType(`${resource['kind'].toLowerCase()}s`)
    .create(resource);
  // Get from the database
  return await routr
    .resourceType(`${resource['kind'].toLowerCase()}s`)
    .get(ref);
}
