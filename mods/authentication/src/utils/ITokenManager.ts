import JwtPayload from './jwtPayload'
export default interface ITokenManager {
  readPublicKey(): Promise<string>
  readPrivateKey(): Promise<string>
  encode(payload: JwtPayload): Promise<string>
  decode(token: string): Promise<JwtPayload>
}
