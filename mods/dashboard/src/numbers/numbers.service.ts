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
  CreateNumberRequest,
  INumber,
  LinkTwilioRequest,
  UpdateNumberRequest
} from "@fonoster/types";
import { useQueryClient } from "@tanstack/react-query";
import { useSdk } from "~/lib/auth";
import {
  useResourceKey,
  useResourceList,
  useResourceMutation
} from "~/lib/resource";
import { useAllOf } from "./lookups";

const RESOURCE = "numbers";

export function useNumbers() {
  const sdk = useSdk();
  return useResourceList<INumber>(RESOURCE, (request) =>
    sdk.numbers.listNumbers(request)
  );
}

/** Every number in the workspace (counts per trunk / per app). */
export function useAllNumbers() {
  const sdk = useSdk();
  return useAllOf<INumber>(RESOURCE, (request) =>
    sdk.numbers.listNumbers(request)
  );
}

export function useCreateNumber() {
  const sdk = useSdk();
  return useResourceMutation(
    RESOURCE,
    (request: CreateNumberRequest) => sdk.numbers.createNumber(request),
    { success: "Number created" }
  );
}

export function useUpdateNumber() {
  const sdk = useSdk();
  return useResourceMutation(
    RESOURCE,
    (request: UpdateNumberRequest) => sdk.numbers.updateNumber(request),
    { success: "Number saved" }
  );
}

export function useDeleteNumber() {
  const sdk = useSdk();
  return useResourceMutation(
    RESOURCE,
    (ref: string) => sdk.numbers.deleteNumber(ref),
    { success: "Number deleted" }
  );
}

/**
 * Links a number from a Twilio account. Errors stay with the caller's form, and
 * the trunks refresh too: linking creates the workspace's Twilio Trunk.
 */
export function useLinkTwilio() {
  const sdk = useSdk();
  const queryClient = useQueryClient();
  const trunks = useResourceKey("trunks");
  return useResourceMutation(RESOURCE, async (request: LinkTwilioRequest) => {
    const response = await sdk.numbers.linkTwilio(request);
    await queryClient.invalidateQueries({ queryKey: trunks });
    return response;
  });
}
