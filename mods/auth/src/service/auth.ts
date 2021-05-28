import grpc from "grpc";
import {GetRoleRequest, Role} from "./protos/auth_pb";
import {IAuthServer, IAuthService, AuthService} from "./protos/auth_grpc_pb";
import {ErrorCodes, FonosError} from "@fonos/errors";
const rbac = require(process.env.AUTH_RBAC || "/home/fonos/rbac.json");

class AuthServer implements IAuthServer {
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
