import routr from '../../common/routr'
import { Empty } from '../protos/common_pb'
import { Kind } from '../../common/resource_encoder'

export default async function deleteResource (
  ref: string,
  kind: Kind
): Promise<Empty> {
  await routr.connect()
  await routr.resourceType(`${kind.toLowerCase()}s`).delete(ref)
  return new Empty()
}
