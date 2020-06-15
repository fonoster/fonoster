import { FonosAuthError } from '@fonos/errors'
import routr from '../../common/routr'
import domainDecoder from '../../common/decoders/domain_decoder'
import { ListDomainsResponse } from '../protos/domains_pb'
import { auth } from '../../common/trust_util'

export default async function (call: any, callback: any) {
  if (!auth(call)) return callback(new FonosAuthError())

  if (!call.request.getPageToken()) {
    // Nothing to send
    callback(null, new ListDomainsResponse())
    return
  }

  const page = parseInt(call.request.getPageToken()) + 1
  const itemsPerPage = call.request.getPageSize()

  await routr.connect()
  const result = await routr
    .resourceType('domains')
    .list({ page, itemsPerPage })
  const domains = result.data

  const response = new ListDomainsResponse()

  for (const jsonObj in domains) {
    const domain = domainDecoder(jsonObj)
    response.addDomains(domain)
  }

  if (domains.length > 0) response.setNextPageToken('' + (page + 1))

  callback(null, response)
}
