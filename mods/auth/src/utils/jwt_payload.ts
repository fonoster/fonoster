export default class JwtPayload {
  iss: string;
  role: string;
  accessKeyId: string;
  constructor(issuer: string, role: string, accessKeyId: string) {
    this.iss = issuer;
    this.role = role;
    this.accessKeyId = accessKeyId;
  }
}
