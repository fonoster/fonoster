if (process.env.NODE_ENV === 'dev') {
  const path = require('path')
  const env = path.join(__dirname, '..', '..', '..', '.env')
  require('dotenv').config({ path: env })
}

const CA_CRT = process.env.CERTS_PATH + '/ca.crt'
const SERVER_CRT = process.env.CERTS_PATH + '/server.crt'
const SERVER_KEY = process.env.CERTS_PATH + '/server.key'
const CLIENT_CRT = process.env.CERTS_PATH + '/client.crt'
const CLIENT_KEY = process.env.CERTS_PATH + '/client.key'
const BOOL = ['on', 'true', 'yes', '1']
const insecure = process.env.APISERVER_ENABLE_INSECURE

module.exports.getServerCredentials = () => {
  const logger = require('./logger')
  const grpc = require('grpc')
  const fs = require('fs')
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

module.exports.getClientCredentials = () => {
  const logger = require('./logger')
  const grpc = require('grpc')
  const fs = require('fs')
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

module.exports.auth = function (call): boolean {
  const jwt = require('jsonwebtoken')
  const { getSalt } = require('@fonos/certs')
  const salt = getSalt()

  if (
    call.metadata._internal_repr.access_key_id === null ||
    call.metadata._internal_repr.access_key_secret === null
  ) {
    return false
  }

  const accessKeyId = call.metadata._internal_repr.access_key_id.toString()
  const accessKeySecret = call.metadata._internal_repr.access_key_secret.toString()

  if (typeof accessKeySecret !== 'undefined') {
    try {
      const decoded = jwt.verify(accessKeySecret, salt)
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
