import logger from '@fonos/logger'
import { getSalt } from '@fonos/certs'
import path from 'path'
import grpc from 'grpc'
import fs from 'fs'
import jwt from 'jsonwebtoken'

if (process.env.NODE_ENV === 'dev') {
  const env = path.join(__dirname, '..', '..', '..', '.env')
  require('dotenv').config({ path: env })
}

const CA_CRT = process.env.CERTS_PATH + '/ca.crt'
const SERVER_CRT = process.env.CERTS_PATH + '/server.crt'
const SERVER_KEY = process.env.CERTS_PATH + '/server.key'
const CLIENT_CRT = process.env.CERTS_PATH + '/client.crt'
const CLIENT_KEY = process.env.CERTS_PATH + '/client.key'

const getServerCredentials = () => {
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

const getClientCredentials = () => {
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

const auth = function (call: any): boolean {
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
      const decoded: any = jwt.verify(accessKeySecret, getSalt())
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

module.exports.getServerCredentials = getServerCredentials
module.exports.getClientCredentials = getClientCredentials
module.exports.auth = auth

export { getClientCredentials, getServerCredentials, auth }
