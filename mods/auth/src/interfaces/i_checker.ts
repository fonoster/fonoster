import JwtPayload from "../utils/jwt_payload";

export default interface IChecker {
  decode(access_key_secret: string): JwtPayload;
}
