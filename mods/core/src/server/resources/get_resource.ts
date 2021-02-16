import routr from '../../common/routr'
import { Kind } from '../../common/resource_encoder'

export default async function getResource (
  accessKeyId: string,
  ref: string,
  kind: Kind,
  decoder: Function
) {
  await routr.connect()
  const jsonObj = await routr.resourceType(`${kind.toLowerCase()}s`).get(ref)
  return jsonObj.metadata.accessKeyId === accessKeyId? decoder(jsonObj) : null
}
