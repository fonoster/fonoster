import routr from "../../common/routr";
import {Empty} from "../protos/common_pb";
import {Kind} from "../../common/resource_encoder";
import getResource from "./get_resource";

export default async function deleteResource(
  accessKeyId: string,
  ref: string,
  kind: Kind,
  decoder: Function
): Promise<Empty> {
  await routr.connect();
  if (await getResource(kind, decoder, accessKeyId, ref)) {
    await routr.resourceType(`${kind.toLowerCase()}s`).delete(ref);
  }
  return new Empty();
}
