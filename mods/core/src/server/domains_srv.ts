export {}

const { FonosAuthError }= require('@fonos/errors')
const routr = require('./routr')
const grpc = require('grpc')
const logger = require('../common/logger')
const domainDecoder = require('../common/decoders/domain_decoder')
const { Empty } = require('./protos/common_pb')
const { ListDomainsResponse } = require('./protos/domains_pb')
const { REncoder, Kind } = require('../common/resource_encoder')
const { auth } = require('../common/trust_util')

const listDomains = async (call, callback) => {
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

const createDomain = async (call, callback) => {
  if (!auth(call)) return callback(new FonosAuthError())

  const domain = call.request.getDomain()

  logger.info('verbose', `@fonos/core createDomain [entity ${domain.getName()}]`)

  const resource = new REncoder(Kind.DOMAIN, domain.getName())
    .withDomainUri(domain.getDomainUri())
    .withEgressPolicy(domain.getEgressRule(), domain.getEgressNumberRef())
    .withACL(domain.getAccessAllowList(), domain.getAccessDenyList())
    .build()

  logger.log(
    'debug',
    `@fonos/core createDomain [resource: ${JSON.stringify(resource)}]`
  )

  try {
    await routr.connect()
    const ref = await routr.resourceType('domains').create(resource)
    // We do this to get updated metadata from Routr
    const jsonObj = await routr.resourceType('domains').get(ref)
    callback(null, domainDecoder(jsonObj))
  } catch (err) {
    return callback(err)
  }
}

const getDomain = async (call, callback) => {
  if (!auth(call)) return callback(new FonosAuthError())

  const domainRef = call.request.getRef()

  logger.info('verbose', `@fonos/core getDomain [ref ${domainRef}]`)

  try {
    await routr.connect()
    const jsonObj = await routr.resourceType('domains').get(domainRef)
    callback(null, domainDecoder(jsonObj))
  } catch (err) {
    return callback(err)
  }
}

const updateDomain = async (call, callback) => {
  if (!auth(call)) return callback(new FonosAuthError())

  const domain = call.request.getDomain()

  logger.info('verbose', `@fonos/core updateDomain [entity ${domain.getName()}]`)

  const resource = new REncoder(
    Kind.DOMAIN,
    domain.getName(),
    domain.getRef()
  )
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

const deleteDomain = async (call, callback) => {
  if (!auth(call)) return callback(new FonosAuthError())

  const domainRef = call.request.getRef()

  logger.info('verbose', `@fonos/core deleteDomain [ref ${domainRef}]`)

  try {
    await routr.connect()
    await routr.resourceType('domains').delete(domainRef)
    callback(null, new Empty())
  } catch (err) {
    return callback(err)
  }
}

module.exports.listDomains = listDomains
module.exports.createDomain = createDomain
module.exports.getDomain = getDomain
module.exports.deleteDomain = deleteDomain
module.exports.updateDomain = updateDomain
