import routr from '../../common/routr'
import { Kind } from '../../common/resource_encoder'

export default async function getResource (
  accessKeyId: string,
  ref: string,
  kind: Kind
) {
  await routr.connect()
  const jsonObj = await routr.resourceType(`${kind.toLowerCase()}s`).get(ref)
  return jsonObj.metadata.accessKeyId === accessKeyId? jsonObj : null
}
