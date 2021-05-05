import grpc from "grpc";
import Auth from "./utils/auth_utils";
import JWT from "./utils/jwt";
import roleHasAccess from "./role_has_access";

export default class AuthMiddleware {
  secretKeyToken: string;
  constructor(secretKey: string) {
    this.secretKeyToken = secretKey;
  }

  middleware = async (ctx: any, next: any, errorCb: any) => {
    const jwtHandler = new Auth(new JWT());
    try {
      if (
        ctx.call.metadata._internal_repr.access_key_id === null ||
        ctx.call.metadata._internal_repr.access_key_secret === null
      ) {
        errorCb({
          code: grpc.status.UNAUTHENTICATED,
          message: "UNAUTHENTICATED"
        });
      }

      const accessKeyId = ctx.call.metadata._internal_repr.access_key_id.toString();
      const accessKeySecret = ctx.call.metadata._internal_repr.access_key_secret.toString();
      const pathRequest = ctx.service.path;
      jwtHandler
        .validateToken({accessToken: accessKeySecret}, this.secretKeyToken)
        .then(async (result) => {
          if (result.isValid) {
            if (result.data.accessKeyId != accessKeyId)
              errorCb({
                code: grpc.status.UNAUTHENTICATED,
                // TODO: Improve error message
                message: "UNAUTHENTICATED"
              });

            const hasAccess = await roleHasAccess(
              result.data.role,
              pathRequest
            );
            if (hasAccess) {
              await next();
            } else {
              errorCb({
                code: grpc.status.PERMISSION_DENIED,
                // TODO: Improve error message
                message: "PERMISSION_DENIED"
              });
            }
          } else {
            errorCb({
              code: grpc.status.UNAUTHENTICATED,
              // TODO: Improve error message
              message: "UNAUTHENTICATED"
            });
          }
        });
    } catch (e) {
      errorCb({
        code: grpc.status.INTERNAL,
        message: e
      });
    }
  };
}
