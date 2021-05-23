import grpc from "grpc";
import Auth from "./utils/auth_utils";
import JWT from "./utils/jwt";
import roleHasAccess from "./role_has_access";
import logger from "@fonos/logger";
const WHITELIST = process.env.AUTH_ACCESS_WHITELIST
  ? process.env.AUTH_ACCESS_WHITELIST.split(",")
  : [];

export default class AuthMiddleware {
  privateKey: string;
  whitelist: string[];
  constructor(privateKey: string, whitelist = []) {
    this.privateKey = privateKey;
    this.whitelist = whitelist || WHITELIST;
  }

  middleware = async (ctx: any, next: any, errorCb: any) => {
    const pathRequest = ctx.service.path;

    logger.verbose(`@fonos/logger middleware [request.path = ${pathRequest}]`);

    if (this.whitelist.includes(pathRequest)) {
      next();
      return;
    }

    const jwtHandler = new Auth(new JWT());
    try {
      if (
        !ctx.call.metadata._internal_repr.access_key_id ||
        !ctx.call.metadata._internal_repr.access_key_secret
      ) {
        errorCb({
          code: grpc.status.UNAUTHENTICATED,
          message: "UNAUTHENTICATED"
        });
        return;
      }

      const accessKeyId =
        ctx.call.metadata._internal_repr.access_key_id.toString();
      const accessKeySecret =
        ctx.call.metadata._internal_repr.access_key_secret.toString();

      jwtHandler
        .validateToken({accessToken: accessKeySecret}, this.privateKey)
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
