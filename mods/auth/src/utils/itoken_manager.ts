import JwtPayload from "./jwt_payload";

export default interface ITokenManager {
  encode(payload: JwtPayload, privateKey: string): Promise<string>;
  decode(token: string, privateKey: string): Promise<JwtPayload>;
}
