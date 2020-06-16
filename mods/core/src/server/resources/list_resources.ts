import routr from '../../common/routr'
import { ListAgentsResponse } from '../protos/agents_pb'
import { Kind } from '../../common/resource_encoder'

export default async function listAgents (
  kind: Kind,
  page: number,
  itemsPerPage: number,
  decoder: Function
) {
  if (!page) return new ListAgentsResponse()

  await routr.connect()
  const result = await routr
    .resourceType(`${kind.toLowerCase()}s`)
    .list({ page, itemsPerPage })
  const resource = result.data

  const response = new ListAgentsResponse()
  const resources = []

  for (const jsonObj in resource) {
    resources.push(decoder(jsonObj))
  }

  return {
    nextToken: page + 1,
    resources
  }
}
