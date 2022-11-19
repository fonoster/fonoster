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
import AuthPB from "../service/protos/auth_pb";
import { AuthClient } from "../service/protos/auth_grpc_pb";
import { getClientCredentials } from "@fonoster/common";

const svc = new AuthClient(
  process.env.APISERVER_ENDPOINT || "localhost:50052",
  getClientCredentials()
);

export default async function (
  role: string,
  service: string
): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const req = new AuthPB.GetRoleRequest();
    req.setName(role);
    svc.getRole(req, (e: any, res: AuthPB.Role) => {
      if (e) reject(e);

      resolve(res && res.getAccessList().includes(service));
    });
  });
}
