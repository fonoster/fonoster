import grpc from 'grpc'
import Auth, { Jwt } from '@fonos/auth'
import roleHasAccess from '../../server/usermanager/role_has_access'
export default class AuthMiddleware {
  secretKeyToken: string
  constructor (secretKey: string) {
    this.secretKeyToken = secretKey
  }

  middleware = async (ctx: any, next: any, errorCb: any) => {
    let jwtHandler = new Auth(new Jwt())
    try {
      if (
        ctx.call.metadata._internal_repr.access_key_id === null ||
        ctx.call.metadata._internal_repr.access_key_secret === null
      ) {
        errorCb({
          code: grpc.status.UNAUTHENTICATED,
          message: 'UNAUTHENTICATED'
        })
      }

      const accessKeySecret = ctx.call.metadata._internal_repr.access_key_secret.toString()
      const pathRequest = ctx.service.path
      jwtHandler
        .validateToken({ accessToken: accessKeySecret }, this.secretKeyToken)
        .then(async result => {
          if (result.isValid) {
            let hasAccess = await roleHasAccess(result.data.role, pathRequest)
            if (hasAccess) {
              await next()
            } else {
              errorCb({
                code: grpc.status.PERMISSION_DENIED,
                // TODO: Improve error message
                message: 'PERMISSION_DENIED' 
              })
            }
          } else {
            errorCb({
              code: grpc.status.UNAUTHENTICATED,
              // TODO: Improve error message
              message: 'UNAUTHENTICATED'
            })
          }
        })
    } catch (e) {
      errorCb({
        code: grpc.status.INTERNAL,
        message: e
      })
    }
  }
}
