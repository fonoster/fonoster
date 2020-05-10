if (process.env.NODE_ENV === 'dev') {
  var path_1 = require('path')
  var env = path_1.join(__dirname, '..', '..', '..', '.env')
  require('dotenv').config({ path: env })
}
var CA_CRT = process.env.CERTS_PATH + '/ca.crt'
var SERVER_CRT = process.env.CERTS_PATH + '/server.crt'
var SERVER_KEY = process.env.CERTS_PATH + '/server.key'
var CLIENT_CRT = process.env.CERTS_PATH + '/client.crt'
var CLIENT_KEY = process.env.CERTS_PATH + '/client.key'
var BOOL = ['on', 'true', 'yes', '1']
var insecure = process.env.APISERVER_ENABLE_INSECURE
module.exports.getServerCredentials = function () {
  var logger = require('./logger')
  var grpc = require('grpc')
  var fs = require('fs')
  try {
    return grpc.ServerCredentials.createSsl(
      fs.readFileSync(CA_CRT),
      [
        {
          cert_chain: fs.readFileSync(SERVER_CRT),
          private_key: fs.readFileSync(SERVER_KEY)
        }
      ],
      true
    )
  } catch (e) {
    logger.log(
      'warn',
      'Unable to load security certificates. Starting server in Insecure mode'
    )
    return grpc.ServerCredentials.createInsecure()
  }
}
module.exports.getClientCredentials = function () {
  var logger = require('./logger')
  var grpc = require('grpc')
  var fs = require('fs')
  try {
    return grpc.credentials.createSsl(
      fs.readFileSync(CA_CRT),
      fs.readFileSync(CLIENT_KEY),
      fs.readFileSync(CLIENT_CRT)
    )
  } catch (e) {
    logger.log(
      'warn',
      'Unable to load security certificates. Starting client in Insecure mode'
    )
    return grpc.credentials.createInsecure()
  }
}
module.exports.auth = function (call, callback) {
  var jwt = require('jsonwebtoken')
  var getSalt = require('@yaps/certs').getSalt
  var salt = getSalt()
  if (
    call.metadata._internal_repr.access_key_id === null ||
    call.metadata._internal_repr.access_key_secret === null
  ) {
    return false
  }
  var accessKeyId = call.metadata._internal_repr.access_key_id.toString()
  var accessKeySecret = call.metadata._internal_repr.access_key_secret.toString()
  if (typeof accessKeySecret !== 'undefined') {
    try {
      var decoded = jwt.verify(accessKeySecret, salt)
      if (!decoded || accessKeyId !== decoded.sub) {
        return false
      }
    } catch (e) {
      return false
    }
    return true
  }
  return false
}
//# sourceMappingURL=trust_util.js.map
