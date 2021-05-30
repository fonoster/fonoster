import grpc from "grpc";
import {
  GetRoleRequest,
  Role, 
  ValidateTokenRequest, 
  ValidateTokenResponse,
  CreateTokenRequest,
  CreateTokenResponse
} from "./protos/auth_pb";
import {IAuthServer, IAuthService, AuthService} from "./protos/auth_grpc_pb";
import {ErrorCodes, FonosError} from "@fonos/errors";
import {getSalt, AUTH_ISS} from "@fonos/certs";
import Auth from "../utils/auth_utils";
import JWT from "../utils/jwt";
const authenticator = new Auth(new JWT());
const rbac = require(process.env.AUTH_RBAC || "/home/fonos/rbac.json");

class AuthServer implements IAuthServer {

  async validateToken(
    call: grpc.ServerUnaryCall<ValidateTokenRequest>,
    callback: grpc.sendUnaryData<ValidateTokenResponse>
  ) {
    const result =  await authenticator.validateToken({accessToken: call.request.getToken()}, getSalt())
    const validateTokenResponse = new ValidateTokenResponse()
    validateTokenResponse.setValid(result.isValid);
    callback(null, validateTokenResponse);
  }

  async createToken(
    call: grpc.ServerUnaryCall<CreateTokenRequest>,
    callback: grpc.sendUnaryData<CreateTokenResponse>
  ) {
    // TODO: We must add expiration time (perhaps 60mins?)
    const result = await authenticator.createToken(
      call.request.getAccessKeyId(),
      AUTH_ISS,
      call.request.getRoleName(),
      getSalt())
    const response = new CreateTokenResponse();
    response.setToken(result.accessToken);
    callback(null, response);
  }

  async getRole(
    call: grpc.ServerUnaryCall<GetRoleRequest>,
    callback: grpc.sendUnaryData<Role>
  ) {
    try {
      const rawRole = rbac.filter((r) => r.name === call.request.getName())[0];
      if (rawRole) {
        const role = new Role();
        role.setAccessList(rawRole.access);
        role.setName(rawRole.name);
        role.setDescription(rawRole.description);
        callback(null, role);
        return;
      }

      callback(new FonosError("Role not found", ErrorCodes.NOT_FOUND), null);
    } catch (e) {
      callback(new FonosError(e, ErrorCodes.UNKNOWN), null);
    }
  }
}

export {AuthServer as default, IAuthService, AuthService};
