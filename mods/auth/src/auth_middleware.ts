/*
 * Copyright (C) 2023 by Fonoster Inc (https://fonoster.com)
 * http://github.com/fonoster/fonoster
 *
 * This file is part of Fonoster
 *
 * Licensed under the MIT License (the "License");
 * you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 *
 *    https://opensource.org/licenses/MIT
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { status } from "@grpc/grpc-js";
import { getLogger } from "@fonoster/logger";
import { Context } from "./types";
import Auth from "./utils/auth_utils";
import JWT from "./utils/jwt";
import roleHasAccess from "./utils/role_has_access";

const logger = getLogger({ service: "auth", filePath: __filename });

export default class AuthMiddleware {
  privateKey: string;
  whitelist: string[];

  constructor(privateKey: string, whitelist = []) {
    this.privateKey = privateKey;
    this.whitelist = whitelist;
  }

  middleware = async (
    ctx: Context,
    next: () => Promise<void>,
    errorCb: (err: any) => void
  ) => {
    const pathRequest = ctx.service.path;

    logger.verbose(`receiving request [request.path = ${pathRequest}]`);

    if (this.whitelist.includes(pathRequest)) {
      next();
      return;
    }

    const jwtHandler = new Auth(new JWT());
    const metadata = ctx.call.metadata;
    const accessKeyId = metadata.get("access_key_id")[0];
    const accessKeySecret = metadata.get("access_key_secret")[0]?.toString();

    try {
      if (!accessKeyId || !accessKeySecret) {
        errorCb({
          code: status.UNAUTHENTICATED,
          message: "UNAUTHENTICATED"
        });
        return;
      }

      const result = await jwtHandler.validateToken(
        { accessToken: accessKeySecret },
        this.privateKey
      );

      if (result.isValid) {
        if (result.data.accessKeyId != accessKeyId)
          errorCb({
            code: status.UNAUTHENTICATED,
            // TODO: Improve error message
            message: "invalid authentication"
          });

        const hasAccess = await roleHasAccess(result.data.role, pathRequest);

        if (hasAccess) {
          await next();
        } else {
          errorCb({
            code: status.PERMISSION_DENIED,
            // TODO: Improve error message
            message: "permission denied"
          });
        }
      } else {
        errorCb({
          code: status.UNAUTHENTICATED,
          // TODO: Improve error message
          message: "invalid authentication"
        });
      }
    } catch (e) {
      errorCb({
        code: status.INTERNAL,
        message: e
      });
    }
  };
}
