import routr from '../../common/routr'
import { Kind } from '../../common/resource_encoder'

export default async function (
  kind: Kind,
  page: number,
  itemsPerPage: number,
  decoder: Function
) {
  await routr.connect()
  const result = await routr
    .resourceType(`${kind.toLowerCase()}s`)
    .list({ page, itemsPerPage })

  const resource = result.data
  const resources = []

  for (const jsonObj in resource) {
    resources.push(decoder(jsonObj))
  }

  return {
    nextToken: page + 1,
    resources
  }
}
