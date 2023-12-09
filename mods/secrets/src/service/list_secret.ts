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
import { APISERVER_VAULT_ADDR, APISERVER_VAULT_TOKEN } from "../env";
import getUserToken from "./token";
import Vault from "node-vault";

export default async function (
  pageToken: number,
  pageSize: number,
  accessKeyId: string
) {
  if (!pageToken) return {};
  pageToken--;
  pageSize--;

  const upperRange = pageToken + pageSize;
  const vault = Vault({
    endpoint: APISERVER_VAULT_ADDR,
    token: APISERVER_VAULT_TOKEN
  });
  const entityId = await getUserToken(accessKeyId);
  const secretFromVault = await vault.list(`secret/data/${entityId}/`);

  const keys = secretFromVault.data.keys;
  const secrets = [];

  for (const index in keys) {
    secrets.push(keys[index]);
  }

  return {
    secrets,
    pageToken: upperRange + 1
  };
}
