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
import type {
  CreateSecretRequest,
  Secret,
  UpdateSecretRequest
} from "@fonoster/types";
import { useSdk } from "~/lib/auth";
import { useResourceList, useResourceMutation } from "~/lib/resource";

const RESOURCE = "secrets";

export function useSecrets() {
  const sdk = useSdk();
  return useResourceList<Secret>(RESOURCE, (request) =>
    sdk.secrets.listSecrets(request)
  );
}

export function useCreateSecret() {
  const sdk = useSdk();
  return useResourceMutation(
    RESOURCE,
    (request: CreateSecretRequest) => sdk.secrets.createSecret(request),
    {
      success: "Secret created"
    }
  );
}

export function useUpdateSecret() {
  const sdk = useSdk();
  return useResourceMutation(
    RESOURCE,
    (request: UpdateSecretRequest) => sdk.secrets.updateSecret(request),
    {
      success: "Secret saved"
    }
  );
}

export function useDeleteSecret() {
  const sdk = useSdk();
  return useResourceMutation(
    RESOURCE,
    (ref: string) => sdk.secrets.deleteSecret(ref),
    {
      success: "Secret deleted"
    }
  );
}
