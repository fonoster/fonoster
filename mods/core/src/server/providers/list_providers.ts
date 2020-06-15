import { FonosAuthError } from '@fonos/errors'
import routr from '../../common/routr'
import providerDecoder from '../../common/decoders/provider_decoder'
import { ListProvidersResponse } from '../protos/providers_pb'
import { auth } from '../../common/trust_util'

export default async function (call: any, callback: any) {
  if (!auth(call)) return callback(new FonosAuthError())

  if (!call.request.getPageToken()) {
    // Nothing to send
    callback(null, new ListProvidersResponse())
    return
  }

  const page = parseInt(call.request.getPageToken()) + 1
  const itemsPerPage = call.request.getPageSize()

  await routr.connect()
  const result = await routr
    .resourceType('gateways')
    .list({ page, itemsPerPage })
  const providers = result.data

  const response = new ListProvidersResponse()

  for (const jsonObj in providers) {
    const provider = providerDecoder(jsonObj)
    response.addProviders(provider)
  }

  if (providers.length > 0) response.setNextPageToken('' + (page + 1))

  callback(null, response)
}
