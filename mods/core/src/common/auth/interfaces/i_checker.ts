import { JwtPayload } from '@fonos/auth'

export default interface IChecker {
  decode(access_key_secret: string): JwtPayload
}
