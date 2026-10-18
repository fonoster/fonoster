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
  getAccessKeyIdFromCall,
  Validators as V,
  withErrorHandlingAndValidation
} from "@fonoster/common";
import { withAccess } from "@fonoster/identity";
import { getLogger } from "@fonoster/logger";
import { AclsApi, BaseApiObject, UpdateAclRequest } from "@fonoster/types";
import { ServerInterceptingCall } from "@grpc/grpc-js";

const logger = getLogger({ service: "sipnet", filePath: __filename });

type OwnedLookup = Parameters<typeof withAccess>[1];

function updateAcl(api: AclsApi) {
  const fn = async (call: {
    request: UpdateAclRequest;
  }): Promise<BaseApiObject> => {
    const { request } = call;

    const accessKeyId = getAccessKeyIdFromCall(
      call as unknown as ServerInterceptingCall
    );

    logger.verbose("call to updateAcl", { ...request, accessKeyId });

    return await api.updateAcl({ ...request, deny: ["0.0.0.0/0"] });
  };

  // Only the caller's own ACLs can be updated, like every other resource.
  return withErrorHandlingAndValidation(
    withAccess(fn, ((ref: string) => api.getAcl(ref)) as OwnedLookup),
    V.updateAclRequestSchema
  );
}

export { updateAcl };
