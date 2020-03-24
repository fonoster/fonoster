const DomainsPB = require('./protos/domains_pb')
const routr = require('./routr')
const grpc = require('grpc')
const logger = require('../common/logger')
const { ResourceBuilder, Kind } = require('../common/resource_builder')
const { auth } = require('../common/trust_util')

// TODO: This is way routr and redis instances must be a singleton

const createDomain = async (call, callback) => {
  if (!auth(call)) return callback(new Error('UNAUTHENTICATED'), null)

  await routr.connect()

  const domain = call.request.getDomain()

  logger.info(
    'verbose',
    `@yaps/domains createDomain [entity ${domain.getName()}]`
  )

  const resource = new ResourceBuilder(Kind.DOMAIN, domain.getName())
    .withDomainUri(domain.getDomainUri())
    .withEgressPolicy(domain.getEgressRule(), domain.getEgressNumberRef())
    .withACL(domain.getAccessAllowList(), domain.getAccessDenyList())
    .build()

  logger.log('debug', `@yaps/domains createDomain [resource: ${resource}]`)

  const ref = await routr.resourceType('domains').create(resource)

  routr
    .resourceType('domains')
    .get(ref)
    .then(d => {
      const domain = new DomainsPB.Domain()
      domain.setRef(d.metadata.ref)
      callback(null, domain)
    })
    .catch(err => callback(new Error(err.message), null))
}

module.exports.createDomain = createDomain
