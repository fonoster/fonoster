/*
 * Copyright (C) 2021 by Fonoster Inc (https://fonoster.com)
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
// import {userOperation} from "@fonoster/auth";
// import {User} from "./protos/usermanager_pb";
// import jsonParse from "./json_parser";

import {SecretName} from "./protos/secrets_pb";
import getUserToken from "./token";

export default async function (
  pageToken: number,
  pageSize: number,
  accessKeyId: string
) {
  if (!pageToken) return {};
  pageToken--;
  pageSize--;

  let upperRange = pageToken + pageSize;

  const vault = require("node-vault")();
  const entityId = await getUserToken(accessKeyId);
  const secretFromVault = await vault.list(`secret/data/${entityId}/`);

  const secretArray = secretFromVault.data.keys;
  const secrets: SecretName[] = [];

  for (const idx in secretArray) {
    const singleSecret = secretArray[idx];
    const secretName = new SecretName();
    secretName.setName(singleSecret);
    secrets.push(secretName);
  }

  upperRange++;

  return {
    secrets,
    pageToken: upperRange
  };
}
