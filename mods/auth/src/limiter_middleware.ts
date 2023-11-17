/*
 * Copyright (C) 2022 by Fonoster Inc (https://fonoster.com)
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
import { Metadata } from "@grpc/grpc-js";
import AuthPB from "./service/protos/auth_pb";
import { LimiterClient } from "./service/protos/auth_grpc_pb";
import { getClientCredentials } from "@fonoster/common";

interface Context {
  service: {
    path: string;
  };
  call: {
    metadata: Metadata;
  };
}

const svc = new LimiterClient(
  process.env.APISERVER_ENDPOINT || "localhost:50052",
  getClientCredentials()
);

export async function checkAuthorized(
  path: string,
  metadata: Metadata
): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const req = new AuthPB.CheckAuthorizedRequest();
    req.setPath(path);
    svc.checkAuthorized(
      req,
      metadata,
      (e: any, res: AuthPB.CheckAuthorizedResponse) => {
        if (e) return reject(e);
        resolve(res.getAuthorized());
      }
    );
  });
}

export default async function limiterMiddleware(
  ctx: Context,
  next: () => void,
  errorCb: (e: Error) => void
) {
  try {
    if (await checkAuthorized(ctx.service.path, ctx.call.metadata)) {
      next();
    }
  } catch (e) {
    errorCb(e);
  }
}
