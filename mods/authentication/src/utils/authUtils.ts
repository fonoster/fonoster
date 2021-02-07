import JWT from './jwt'
import JwtPayload from './jwtPayload'
import ITokenManager from './ITokenManager'

export declare interface UserToken {
  accessToken: string
}

export declare interface TokenResponse {
  isValid: Boolean
  data: JwtPayload
}

export default class AuthUtils {
  private handler: ITokenManager
  constructor (handler: ITokenManager) {
    this.handler = handler
  }
  public validateTokenData = (payload: JwtPayload): boolean => {
    if (
      !payload ||
      !payload.iss ||
      !payload.userId ||
      !payload.iss ||
      !payload.role
    )
      throw new Error('Invalid Access Token')
    return true
  }

  public createTokens = async (
    userIdPayload: string,
    issuePayload: string,
    rolePayload: string
  ): Promise<UserToken> => {
    const accessToken = await this.handler.encode(
      new JwtPayload(issuePayload, rolePayload, userIdPayload)
    )

    if (!accessToken) throw new Error('Error creating token')

    return {
      accessToken: accessToken
    } as UserToken
  }

  public validateToken = async (token: UserToken): Promise<TokenResponse> => {
    let result = false
    let accessTokenData: JwtPayload
    try {
      accessTokenData = await this.handler.decode(token.accessToken)
      result = true
    } catch (e) {
      console.log('Invalid token')
    }
    return {
      data: accessTokenData,
      isValid: result
    } as TokenResponse
  }
}
