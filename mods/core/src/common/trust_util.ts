import logger from '@fonos/logger'
import { getSalt } from '@fonos/certs'
import path from 'path'
import grpc from 'grpc'
import jwt from 'jsonwebtoken'
import * as os from 'os'
import * as fs from 'fs'
const atob = require('atob')

const prepCert = (cert: string) => Buffer.from(atob(cert), 'utf-8')

let config: {
  caCertificate?: string
  serverCertificate?: string
  serverKey?: string
  clientCertificate?: string
  clientKey?: string
} = {}

try {
  config = JSON.parse(
    fs
      .readFileSync(path.join(os.homedir(), '.fonos', 'config'))
      .toString('utf-8')
  )
} catch (e) {}

const getServerCredentials = () => {
  try {
    return grpc.ServerCredentials.createSsl(
      prepCert(config.caCertificate),
      [
        {
          cert_chain: prepCert(config.serverCertificate),
          private_key: prepCert(config.serverKey)
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
      prepCert(config.caCertificate),
      prepCert(config.clientKey),
      prepCert(config.clientCertificate)
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
