import JwtPayload from "./jwt_payload";

export default interface ITokenManager {
  encode(
    payload: JwtPayload,
    privateKey: string,
    expiration?: string
  ): Promise<string>;
  decode(token: string, privateKey: string): Promise<JwtPayload>;
}
