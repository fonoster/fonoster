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
import { Validators as V } from "@fonoster/common";
import {
  BaseApiObject,
  CreateTrunkRequestExtended,
  ListTrunksRequest,
  TrunkApi,
  TrunkExtended,
  UpdateTrunkRequest
} from "@fonoster/types";
import { CheckRefs, refsChecker, trunkRefs } from "../resources/checkRefs";
import { createResource } from "../resources/createResource";
import { deleteResource } from "../resources/deleteResource";
import { getResource } from "../resources/getResource";
import { listResources } from "../resources/listResources";
import { updateResource } from "../resources/updateResource";
import { toFonosterNumberFormats, toRoutrNumberFormats } from "./numberFormats";

const RESOURCE = "Trunk";

/**
 * Routr's Trunk API with the number formats in Fonoster's names both ways: requests go out with
 * Routr's, Trunks come back with Fonoster's.
 */
function withNumberFormats(trunks: TrunkApi): TrunkApi {
  return {
    ...trunks,
    createTrunk: (request) => trunks.createTrunk(toRoutrNumberFormats(request)),
    updateTrunk: (request) => trunks.updateTrunk(toRoutrNumberFormats(request)),
    getTrunk: async (ref) =>
      toFonosterNumberFormats(await trunks.getTrunk(ref)),
    listTrunks: async (request) => {
      const response = await trunks.listTrunks(request);
      return {
        ...response,
        items: response.items.map(toFonosterNumberFormats)
      };
    },
    deleteTrunk: (ref) => trunks.deleteTrunk(ref)
  };
}

function createTrunk(trunks: TrunkApi, checkRefs?: CheckRefs) {
  return createResource<TrunkExtended, CreateTrunkRequestExtended, TrunkApi>(
    withNumberFormats(trunks),
    RESOURCE,
    V.createTrunkRequestSchema,
    refsChecker(checkRefs, trunkRefs)
  );
}

const blank = (v: unknown) =>
  v === undefined || v === null || v === "" || (Array.isArray(v) && !v.length);

/**
 * A partial update: fields the request leaves blank keep their current value (proto3 sends ""
 * and [] for fields not set, and Routr rejects a trunk without a name or inbound URI). Clearing
 * the URIs or a reference through an update is therefore not possible; recreate the trunk.
 * The number formats and prefixes are not in this list: they are `optional` in the proto, so an
 * absent one stays absent (Routr keeps it) and `""` or NUMBER_FORMAT_UNSPECIFIED reaches Routr.
 */
export function mergeTrunkUpdate(
  request: UpdateTrunkRequest,
  current: Partial<TrunkExtended>
): UpdateTrunkRequest {
  const merged: Record<string, unknown> = { ...request };
  for (const key of [
    "name",
    "inboundUri",
    "accessControlListRef",
    "inboundCredentialsRef",
    "outboundCredentialsRef",
    "uris"
  ] as const) {
    const value = (current as Record<string, unknown>)[key];
    if (blank(merged[key]) && !blank(value)) merged[key] = value;
  }
  return merged as UpdateTrunkRequest;
}

function updateTrunk(routrTrunks: TrunkApi, checkRefs?: CheckRefs) {
  const trunks = withNumberFormats(routrTrunks);
  const partial = {
    ...trunks,
    getTrunk: (ref: string) => trunks.getTrunk(ref),
    updateTrunk: async (request: UpdateTrunkRequest) =>
      trunks.updateTrunk(
        mergeTrunkUpdate(request, await trunks.getTrunk(request.ref))
      )
  } as TrunkApi;
  return updateResource<TrunkExtended, UpdateTrunkRequest, TrunkApi>(
    partial,
    RESOURCE,
    V.updateTrunkRequestSchema,
    refsChecker(checkRefs, trunkRefs)
  );
}

function getTrunk(trunks: TrunkApi) {
  return getResource<TrunkExtended, BaseApiObject, TrunkApi>(
    withNumberFormats(trunks),
    RESOURCE
  );
}

function listTrunks(trunks: TrunkApi) {
  return listResources<TrunkExtended, ListTrunksRequest, TrunkApi>(
    withNumberFormats(trunks),
    RESOURCE
  );
}

function deleteTrunk(trunks: TrunkApi) {
  return deleteResource<TrunkExtended, BaseApiObject, TrunkApi>(
    trunks,
    RESOURCE
  );
}

export { createTrunk, deleteTrunk, getTrunk, listTrunks, updateTrunk };
