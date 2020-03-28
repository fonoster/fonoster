const path = require('path')

if (process.env.NODE_ENV === 'dev') {
  const env = path.join(__dirname, '..', '..', '..', '.env')
  require('dotenv').config({ path: env })
}

const grpc = require('grpc')
const fs = require('fs')
const jwt = require('jsonwebtoken')
const logger = require('./logger')

const CA_CRT = process.env.CERTS_PATH + '/ca.crt'
const SERVER_CRT = process.env.CERTS_PATH + '/server.crt'
const SERVER_KEY = process.env.CERTS_PATH + '/server.key'
const CLIENT_CRT = process.env.CERTS_PATH + '/client.crt'
const CLIENT_KEY = process.env.CERTS_PATH + '/client.key'
const BOOL = ['on', 'true', 'yes', '1']
const insecure = process.env.APISERVER_ENABLE_INSECURE

module.exports.getServerCredentials = () => {

  if (insecure && BOOL.includes(insecure.toLowerCase())) {
    logger.log(
      'warn',
      `Insecure mode is ON. This is not recommended in production`
    )
    return grpc.ServerCredentials.createInsecure()
  }

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
    logger.log('error', 'Unable to load certificates')
    process.exit(1)
  }
}

module.exports.getClientCredentials = () => {

  if (insecure && BOOL.includes(insecure.toLowerCase())) {
    logger.log(
      'warn',
      `Insecure mode is ON. This is not recommended in production`
    )
    return grpc.credentials.createInsecure()
  }

  try {
    return grpc.credentials.createSsl(
      fs.readFileSync(CA_CRT),
      fs.readFileSync(CLIENT_KEY),
      fs.readFileSync(CLIENT_CRT)
    )
  } catch (e) {
    logger.log('error', 'Unable to load certificates')
    process.exit(1)
  }
}

module.exports.auth = function (call, callback) {
  let salt

  try {
    const pathToCerts = path.join(process.env.CERTS_PATH, 'jwt.salt')
    // TODO: Move elsewhere to avoid reading this file everytime
    salt =
      process.env.JWT_SALT ||
      fs
        .readFileSync(pathToCerts)
        .toString()
        .trim()
  } catch (e) {
    logger.log(
      'error',
      `Unable to find JWT_SALT environment variable or the certificates`
    )
    throw new Error(
      'Unable to find JWT_SALT environment variable or the certificates'
    )
  }

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
