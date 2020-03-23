const DomainsPB = require('./protos/domains_pb')
const grpc = require('grpc')
const objectid = require('objectid')
const logger = require('../common/logger')
const { auth } = require('../common/trust_util')

const createDomain = (call, callback) => {
  try {
    auth(call)
  } catch (e) {
    logger.log('error', e)
    callback(new Error('UNAUTHENTICATED'), null)
    return
  }

  callback(null, new DomainsPB.Domain())
}

module.exports.createDomain = createDomain
