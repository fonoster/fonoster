const routr = require('./routr')
const grpc = require('grpc')
const logger = require('../common/logger')
const { Empty } = require('./protos/common_pb')
const { ResourceBuilder, Kind } = require('../common/resource_builder')
const { domainDecoder } = require('../common/resources_decoders')
const { auth } = require('../common/trust_util')

const createDomain = async (call, callback) => {
  if (!auth(call)) return callback(new Error('UNAUTHENTICATED'), null)

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

  logger.log(
    'debug',
    `@yaps/domains createDomain [resource: ${JSON.stringify(resource)}]`
  )

  try {
    await routr.connect()
    const ref = await routr.resourceType('domains').create(resource)
    const jsonObj = await routr.resourceType('domains').get(ref)
    callback(null, domainDecoder(jsonObj))
  } catch (err) {
    return callback(new Error(err.message), null)
  }
}

const getDomain = async (call, callback) => {
  if (!auth(call)) return callback(new Error('UNAUTHENTICATED'), null)

  const domainRef = call.request.getRef()

  logger.info('verbose', `@yaps/domains getDomain [ref ${domainRef}]`)

  try {
    await routr.connect()
    const jsonObj = await routr.resourceType('domains').get(domainRef)
    callback(null, domainDecoder(jsonObj))
  } catch (err) {
    return callback(new Error(err.message), null)
  }
}

const deleteDomain = async (call, callback) => {
  if (!auth(call)) return callback(new Error('UNAUTHENTICATED'), null)

  const domainRef = call.request.getRef()

  logger.info('verbose', `@yaps/domains deleteDomain [ref ${domainRef}]`)

  try {
    await routr.connect()
    await routr.resourceType('domains').delete(domainRef)
    callback(null, new Empty())
  } catch (err) {
    return callback(new Error(err.message), null)
  }
}

module.exports.createDomain = createDomain
module.exports.getDomain = getDomain
module.exports.deleteDomain = deleteDomain
