import { FonosAuthError } from '@fonos/errors'
import routr from '../../common/routr'
import logger from '@fonos/logger'
import domainDecoder from '../../common/decoders/domain_decoder'
import { REncoder, Kind } from '../../common/resource_encoder'
import { auth } from '../../common/trust_util'

export default async function (call: any, callback: any) {
  if (!auth(call)) return callback(new FonosAuthError())

  const domain = call.request.getDomain()

  logger.info(
    'verbose',
    `@fonos/core updateDomain [entity ${domain.getName()}]`
  )

  const resource = new REncoder(Kind.DOMAIN, domain.getName(), domain.getRef())
    .withMetadata({
      createdOn: domain.getCreateTime(),
      modifiedOn: domain.getUpdateTime()
    })
    .withDomainUri(domain.getDomainUri())
    .withEgressPolicy(domain.getEgressRule(), domain.getEgressNumberRef())
    .withACL(domain.getAccessAllowList(), domain.getAccessDenyList())
    .build()

  logger.log(
    'debug',
    `@fonos/core updateDomain [resource: ${JSON.stringify(resource)}]`
  )

  try {
    await routr.connect()
    const ref = await routr.resourceType('domains').update(resource)
    // We do this to get updated metadata from Routr
    const jsonObj = await routr.resourceType('domains').get(ref)
    callback(null, domainDecoder(jsonObj))
  } catch (err) {
    return callback(err)
  }
}
