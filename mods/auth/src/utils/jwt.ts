import path from 'path'
import { readFile } from 'fs'
import { promisify } from 'util'
import { sign, verify } from 'jsonwebtoken'
import logger from '@fonos/logger'
import JwtPayload from './jwt_payload'
import ITokenManager from './itoken_manager'
/*
 * issuer 		— Organization who issue the toke.
 * role       — User role
 * accessKey  — User access key
 * expiresIn	— Expiration time after which the token will be invalid.
 * algorithm 	— Encryption algorithm to be used to protect the token.
 */

export default class JWT implements ITokenManager {
  async encode (
    payload: JwtPayload,
    privateKey: string,
    expiration: Number = 500
  ): Promise<string> {
    if (!privateKey) throw new Error('Token generation failure')
    // @ts-ignore
    return promisify(sign)({ ...payload }, privateKey, {
      expiresIn: expiration
    })
  }

  /**
   * Returns the decoded payload if the signature is valid even if it is expired
   */
  async decode (
    token: string,
    privateKey: string,
    ignorateExpiration: boolean = false
  ): Promise<JwtPayload> {
    try {
      // @ts-ignore
      return (await promisify(verify)(token, privateKey, {
        ignoreExpiration: ignorateExpiration
      })) as JwtPayload
    } catch (e) {
      logger.log('error', '@fonos/authentication [Bad token]')
    }
  }
}
