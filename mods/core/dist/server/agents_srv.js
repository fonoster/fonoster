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
const { FonosAuthError } = require('@fonos/errors')
const routr = require('./routr')
const logger = require('../common/logger')
const agentDecoder = require('../common/decoders/agent_decoder')
const { ListAgentsResponse } = require('./protos/agents_pb')
const { Empty } = require('./protos/common_pb')
const { REncoder, Kind } = require('../common/resource_encoder')
const { auth } = require('../common/trust_util')
const listAgents = (call, callback) =>
  __awaiter(void 0, void 0, void 0, function * () {
    if (!auth(call)) return callback(new FonosAuthError())
    if (!call.request.getPageToken()) {
      // Nothing to send
      callback(null, new ListAgentsResponse())
      return
    }
    const page = parseInt(call.request.getPageToken()) + 1
    const itemsPerPage = call.request.getPageSize()
    yield routr.connect()
    const result = yield routr
      .resourceType('agents')
      .list({ page, itemsPerPage })
    const agents = result.data
    const response = new ListAgentsResponse()
    for (const jsonObj in agents) {
      const agent = agentDecoder(jsonObj)
      response.addAgents(agent)
    }
    if (agents.length > 0) response.setNextPageToken('' + (page + 1))
    callback(null, response)
  })
const createAgent = (call, callback) =>
  __awaiter(void 0, void 0, void 0, function * () {
    if (!auth(call)) return callback(new FonosAuthError())
    const agent = call.request.getAgent()
    logger.info(
      'verbose',
      `@fonos/core createAgent [entity ${agent.getName()}]`
    )
    let encoder = new REncoder(Kind.AGENT, agent.getName())
      .withCredentials(agent.getUsername(), agent.getSecret())
      .withDomains(agent.getDomainsList())
    //.withPrivacy(provider.getPrivacy()) // TODO
    const resource = encoder.build()
    logger.log(
      'debug',
      `@fonos/core createAgent [resource: ${JSON.stringify(resource)}]`
    )
    try {
      yield routr.connect()
      const ref = yield routr.resourceType('agents').create(resource)
      // We do this to get updated metadata from Routr
      const jsonObj = yield routr.resourceType('agents').get(ref)
      callback(null, agentDecoder(jsonObj))
    } catch (err) {
      return callback(err)
    }
  })
const getAgent = (call, callback) =>
  __awaiter(void 0, void 0, void 0, function * () {
    if (!auth(call)) return callback(new FonosAuthError())
    const agentRef = call.request.getRef()
    logger.info('verbose', `@fonos/core getAgent [ref ${agentRef}]`)
    try {
      yield routr.connect()
      const jsonObj = yield routr.resourceType('agents').get(agentRef)
      callback(null, agentDecoder(jsonObj))
    } catch (err) {
      return callback(err)
    }
  })
const updateAgent = (call, callback) =>
  __awaiter(void 0, void 0, void 0, function * () {
    if (!auth(call)) return callback(new FonosAuthError())
    const agent = call.request.getAgent()
    logger.info(
      'verbose',
      `@fonos/core updateAgent [entity ${agent.getName()}]`
    )
    let encoder = new REncoder(Kind.AGENT, agent.getName(), agent.getRef())
      .withCredentials(agent.getUsername(), agent.getSecret())
      .withDomains(agent.getDomainsList())
      .withMetadata({
        createdOn: agent.getCreateTime(),
        modifiedOn: agent.getUpdateTime()
      })
    //.withPrivacy(provider.getPrivacy()) // TODO
    const resource = encoder.build()
    logger.log(
      'debug',
      `@fonos/core updateAgent [resource: ${JSON.stringify(resource)}]`
    )
    try {
      yield routr.connect()
      const ref = yield routr.resourceType('agents').update(resource)
      // We do this to get updated metadata from Routr
      const jsonObj = yield routr.resourceType('agents').get(ref)
      callback(null, agentDecoder(jsonObj))
    } catch (err) {
      return callback(err)
    }
  })
const deleteAgent = (call, callback) =>
  __awaiter(void 0, void 0, void 0, function * () {
    if (!auth(call)) return callback(new FonosAuthError())
    const agentRef = call.request.getRef()
    logger.info('verbose', `@fonos/core deleteAgent [ref ${agentRef}]`)
    try {
      yield routr.connect()
      yield routr.resourceType('agents').delete(agentRef)
      callback(null, new Empty())
    } catch (err) {
      return callback(err)
    }
  })
module.exports.listAgents = listAgents
module.exports.createAgent = createAgent
module.exports.getAgent = getAgent
module.exports.deleteAgent = deleteAgent
module.exports.updateAgent = updateAgent
//# sourceMappingURL=agents_srv.js.map
