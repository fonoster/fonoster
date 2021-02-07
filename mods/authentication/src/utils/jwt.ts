import path from 'path'
import { readFile } from 'fs'
import { promisify } from 'util'
import { sign, verify } from 'jsonwebtoken'
import logger from '@fonos/logger'
import JwtPayload from '../utils/jwtPayload'
import ITokenManager from './ITokenManager'
/*
 * issuer 		— Module who issues the token.
 * role       — User role
 * accessKey  — User access key
 * expiresIn	— Expiration time after which the token will be invalid.
 * algorithm 	— Encryption algorithm to be used to protect the token.
 */

export default class JWT implements ITokenManager {
  readPublicKey (): Promise<string> {
    require('../../../certs/src/')
    return promisify(readFile)(
      path.join(__dirname, '../../../certs/public.pem'),
      'utf8'
    )
  }

  readPrivateKey (): Promise<string> {
    return promisify(readFile)(
      path.join(__dirname, '../../../certs/private.pem'),
      'utf8'
    )
  }

  async encode (payload: JwtPayload): Promise<string> {
    const cert = await this.readPrivateKey()
    if (!cert) throw new Error('Token generation failure')
    // @ts-ignore
    return promisify(sign)({ ...payload }, cert, {
      algorithm: 'RS256',
      expiresIn: 10
    })
  }

  /**
   * This method checks the token and returns the decoded data when token is valid in all respect
   */
  async validate (token: string): Promise<JwtPayload> {
    const cert = await this.readPublicKey()
    try {
      // @ts-ignore
      return (await promisify(verify)(token, cert)) as JwtPayload
    } catch (e) {
      logger.log('error', `@fonos/authentication [${e}}]`)
      if (e && e.name === 'TokenExpiredError') throw new Error('Token expired')
      // throws error if the token has not been encrypted by the private key
    }
  }

  /**
   * Returns the decoded payload if the signature is valid even if it is expired
   */
  async decode (token: string): Promise<JwtPayload> {
    const cert = await this.readPublicKey()
    try {
      // @ts-ignore
      return (await promisify(verify)(token, cert, {
        ignoreExpiration: false
      })) as JwtPayload
    } catch (e) {
      logger.log('error', '@fonos/authentication [Bad token]')
    }
  }
}
