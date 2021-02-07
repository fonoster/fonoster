export default class JwtPayload {
  iss: string
  role: string
  userId: string
  constructor (issuer: string, role: string, userId: string) {
    this.iss = issuer
    ;(this.role = role), (this.userId = userId)
  }
}
