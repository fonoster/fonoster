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
import { LimiterClient } from "./service/protos/auth_grpc_pb";
import { getClientCredentials } from "@fonoster/common";
import { Metadata } from "@grpc/grpc-js";
import { APISERVER_ENDPOINT } from "./envs";
import { getLogger } from "@fonoster/logger";
import { Context } from "./types";
import AuthPB from "./service/protos/auth_pb";

const logger = getLogger({ service: "limiter", filePath: __filename });

export async function checkAuthorized(
  path: string,
  metadata: Metadata
): Promise<boolean> {
  const svc = new LimiterClient(APISERVER_ENDPOINT, getClientCredentials());

  return new Promise((resolve, reject) => {
    const req = new AuthPB.CheckAuthorizedRequest();
    req.setPath(path);
    svc.checkAuthorized(
      req,
      metadata,
      (e: Error, res: AuthPB.CheckAuthorizedResponse) => {
        if (e) return reject(e);
        resolve(res.getAuthorized());
      }
    );
  });
}

export default function createLimiterMiddleware(ignorePaths: string[] = []) {
  return async function (ctx: Context, next, errorCb) {
    const { path } = ctx.service;
    const { metadata } = ctx.call;

    if (ignorePaths.includes(path)) {
      logger.verbose(`Ignoring path ${path}`, { path });
      return next();
    }

    try {
      if (await checkAuthorized(path, metadata)) {
        next();
      }
    } catch (e) {
      errorCb(e);
    }
  };
}
