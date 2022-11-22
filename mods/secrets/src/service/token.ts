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
export default async function (accessKeyId: string) {
  const vault = require("node-vault")();
  // TODO: The policy assignment shouldn't be done automatically.
  // Instead, it should be done during the user creation.
  await vault.addApproleRole({
    role_name: accessKeyId,
    policies: process.env.SECRETS_POLICY
  });

  const roleId = (await vault.getApproleRoleId({ role_name: accessKeyId })).data
    .role_id;
  const secretId = (
    await vault.getApproleRoleSecret({ role_name: accessKeyId })
  ).data.secret_id;
  const token = (
    await vault.approleLogin({ role_id: roleId, secret_id: secretId })
  ).auth.client_token;
  const entityId = (await vault.tokenLookupSelf({ token: token })).data
    .entity_id;
  return entityId;
}
