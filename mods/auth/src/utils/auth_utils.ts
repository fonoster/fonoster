import JwtPayload from "./jwt_payload";
import ITokenManager from "./itoken_manager";
import logger from "@fonos/logger";

export declare interface UserToken {
  accessToken: string;
}

export declare interface TokenResponse {
  isValid: boolean;
  data: JwtPayload;
}

export default class AuthUtils {
  private handler: ITokenManager;

  constructor(handler: ITokenManager) {
    this.handler = handler;
  }

  public validateTokenData = (payload: JwtPayload): boolean => {
    if (
      !payload ||
      !payload.iss ||
      !payload.accessKeyId ||
      !payload.iss ||
      !payload.role
    )
      throw new Error("Invalid Access Token");
    return true;
  };

  public createToken = async (
    accessKeyId: string,
    issuer: string,
    role: string,
    privateKey: string,
    expiration?: string
  ): Promise<UserToken> => {
    const accessToken = await this.handler.encode(
      new JwtPayload(issuer, role, accessKeyId),
      privateKey,
      expiration
    );

    if (!accessToken) throw new Error("Error creating token");

    return {
      accessToken: accessToken
    } as UserToken;
  };

  public validateToken = async (
    token: UserToken,
    privateKey: string
  ): Promise<TokenResponse> => {
    let result = false;
    try {
      const accessTokenData = await this.handler.decode(
        token.accessToken,
        privateKey
      );      
      if (accessTokenData) {
        result = true;
      }

      return {
        data: accessTokenData,
        isValid: result
      } as TokenResponse;
    } catch (e) {
      logger.log("error", "@fonos/auth [Error decoding token]");
    }
    return {
      isValid: result
    } as TokenResponse;
  };
}
