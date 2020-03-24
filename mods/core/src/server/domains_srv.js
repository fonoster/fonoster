const DomainsPB = require('./protos/domains_pb')
const routr = require('./routr')
const grpc = require('grpc')
const logger = require('../common/logger')
const { ResourceBuilder, Kind } = require('../common/resource_builder')
const { auth } = require('../common/trust_util')

// TODO: This is way routr and redis instances must be a singleton
routr.connect()

const createDomain = async (call, callback) => {
  try {
    auth(call)
  } catch (e) {
    callback(new Error('UNAUTHENTICATED'), null)
    return
  }

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

  console.log('resource => ', JSON.stringify(resource, null, ' '))

  routr
    .resourceType('domains')
    .create(resource)
    .then(res => {
      callback(null, domain)
    })
    .catch(err => {
      callback(new Error(err), null)
    })
}

module.exports.createDomain = createDomain
