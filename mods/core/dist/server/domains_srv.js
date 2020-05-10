'use strict'
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt (value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value)
          })
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled (value) {
        try {
          step(generator.next(value))
        } catch (e) {
          reject(e)
        }
      }
      function rejected (value) {
        try {
          step(generator['throw'](value))
        } catch (e) {
          reject(e)
        }
      }
      function step (result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected)
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next())
    })
  }
Object.defineProperty(exports, '__esModule', { value: true })
const { YAPSAuthError } = require('@yaps/errors')
const routr = require('./routr')
const grpc = require('grpc')
const logger = require('../common/logger')
const domainDecoder = require('../common/decoders/domain_decoder')
const { Empty } = require('./protos/common_pb')
const { ListDomainsResponse } = require('./protos/domains_pb')
const { REncoder, Kind } = require('../common/resource_encoder')
const { auth } = require('../common/trust_util')
const listDomains = (call, callback) =>
  __awaiter(void 0, void 0, void 0, function * () {
    if (!auth(call)) return callback(new YAPSAuthError())
    if (!call.request.getPageToken()) {
      // Nothing to send
      callback(null, new ListDomainsResponse())
      return
    }
    const page = parseInt(call.request.getPageToken()) + 1
    const itemsPerPage = call.request.getPageSize()
    yield routr.connect()
    const result = yield routr
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
  })
const createDomain = (call, callback) =>
  __awaiter(void 0, void 0, void 0, function * () {
    if (!auth(call)) return callback(new YAPSAuthError())
    const domain = call.request.getDomain()
    logger.info(
      'verbose',
      `@yaps/core createDomain [entity ${domain.getName()}]`
    )
    const resource = new REncoder(Kind.DOMAIN, domain.getName())
      .withDomainUri(domain.getDomainUri())
      .withEgressPolicy(domain.getEgressRule(), domain.getEgressNumberRef())
      .withACL(domain.getAccessAllowList(), domain.getAccessDenyList())
      .build()
    logger.log(
      'debug',
      `@yaps/core createDomain [resource: ${JSON.stringify(resource)}]`
    )
    try {
      yield routr.connect()
      const ref = yield routr.resourceType('domains').create(resource)
      // We do this to get updated metadata from Routr
      const jsonObj = yield routr.resourceType('domains').get(ref)
      callback(null, domainDecoder(jsonObj))
    } catch (err) {
      return callback(err)
    }
  })
const getDomain = (call, callback) =>
  __awaiter(void 0, void 0, void 0, function * () {
    if (!auth(call)) return callback(new YAPSAuthError())
    const domainRef = call.request.getRef()
    logger.info('verbose', `@yaps/core getDomain [ref ${domainRef}]`)
    try {
      yield routr.connect()
      const jsonObj = yield routr.resourceType('domains').get(domainRef)
      callback(null, domainDecoder(jsonObj))
    } catch (err) {
      return callback(err)
    }
  })
const updateDomain = (call, callback) =>
  __awaiter(void 0, void 0, void 0, function * () {
    if (!auth(call)) return callback(new YAPSAuthError())
    const domain = call.request.getDomain()
    logger.info(
      'verbose',
      `@yaps/core updateDomain [entity ${domain.getName()}]`
    )
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
      `@yaps/core updateDomain [resource: ${JSON.stringify(resource)}]`
    )
    try {
      yield routr.connect()
      const ref = yield routr.resourceType('domains').update(resource)
      // We do this to get updated metadata from Routr
      const jsonObj = yield routr.resourceType('domains').get(ref)
      callback(null, domainDecoder(jsonObj))
    } catch (err) {
      return callback(err)
    }
  })
const deleteDomain = (call, callback) =>
  __awaiter(void 0, void 0, void 0, function * () {
    if (!auth(call)) return callback(new YAPSAuthError())
    const domainRef = call.request.getRef()
    logger.info('verbose', `@yaps/core deleteDomain [ref ${domainRef}]`)
    try {
      yield routr.connect()
      yield routr.resourceType('domains').delete(domainRef)
      callback(null, new Empty())
    } catch (err) {
      return callback(err)
    }
  })
module.exports.listDomains = listDomains
module.exports.createDomain = createDomain
module.exports.getDomain = getDomain
module.exports.deleteDomain = deleteDomain
module.exports.updateDomain = updateDomain
//# sourceMappingURL=domains_srv.js.map
