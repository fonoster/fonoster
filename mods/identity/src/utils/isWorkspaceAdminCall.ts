/**
 * Copyright (C) 2025 by Fonoster Inc (https://fonoster.com)
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
import {
  decodeToken,
  getAccessKeyIdFromCall,
  getTokenFromCall,
  TokenUseEnum
} from "@fonoster/common";
import { Role } from "@fonoster/types";
import { ServerInterceptingCall } from "@grpc/grpc-js";

const ADMIN_ROLES: string[] = [Role.WORKSPACE_OWNER, Role.WORKSPACE_ADMIN];

/**
 * Whether the caller is an owner or admin of the workspace the call names
 * (its `accesskeyid` metadata). Only the role held in that workspace counts.
 * The interceptor has already verified the token; this re-checks the role in
 * the handler and answers false on anything unexpected.
 */
function isWorkspaceAdminCall(call: unknown): boolean {
  try {
    const typedCall = call as ServerInterceptingCall;
    const accessKeyId = getAccessKeyIdFromCall(typedCall);
    const token = decodeToken<TokenUseEnum.ACCESS>(getTokenFromCall(typedCall));

    if (!accessKeyId || token?.tokenUse !== TokenUseEnum.ACCESS) {
      return false;
    }

    const entry = Array.isArray(token.access)
      ? token.access.find((a) => a?.accessKeyId === accessKeyId)
      : undefined;

    return entry ? ADMIN_ROLES.includes(entry.role) : false;
  } catch {
    return false;
  }
}

export { isWorkspaceAdminCall };
