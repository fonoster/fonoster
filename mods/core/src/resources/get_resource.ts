import routr from "../common/routr";
import {Kind} from "../common/resource_encoder";

export default async function getResource(
  kind: Kind,
  decoder: Function,
  accessKeyId: string,
  ref: string
) {
  await routr.connect();
  const jsonObj = await routr.resourceType(`${kind.toLowerCase()}s`).get(ref);
  return jsonObj && jsonObj.metadata.accessKeyId === accessKeyId
    ? decoder(jsonObj)
    : null;
}
