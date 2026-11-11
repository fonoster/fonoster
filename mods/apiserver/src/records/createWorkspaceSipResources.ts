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
import { status } from "@grpc/grpc-js";
import { listAll } from "../regions/sources";
import { WorkspaceSipResources } from "./types";

type ListHandler = Parameters<typeof listAll>[0];

const refs = (items: unknown[]) =>
  items.map((item) => (item as { ref: string }).ref);

/** Routr no longer has it (an earlier run, or one of Routr's own cascades): that is deleted. */
const unlessGone = (e: unknown) => {
  if ((e as { code?: number })?.code !== status.NOT_FOUND) throw e;
};

/**
 * A deleted workspace's numbers and trunks, for `runWorkspaceErasure` (#1321). They are listed
 * through the sipnet list handlers, which keep only the items whose `extended.accessKeyId` is the
 * workspace's, so another workspace's resource is never deleted. They are deleted with the Routr
 * SDK, because the gRPC delete handlers need a caller in the workspace and a deleted one has none.
 */
export function createWorkspaceSipResources(deps: {
  /** The loaded services' handlers, by method name. */
  handlers: { listNumbers?: ListHandler; listTrunks?: ListHandler };
  numbers: { deleteNumber(ref: string): Promise<unknown> };
  trunks: { deleteTrunk(ref: string): Promise<unknown> };
}): WorkspaceSipResources {
  const { handlers, numbers, trunks } = deps;
  return {
    numbers: async (accessKeyId) =>
      refs(await listAll(handlers.listNumbers, accessKeyId)),
    trunks: async (accessKeyId) =>
      refs(await listAll(handlers.listTrunks, accessKeyId)),
    deleteNumber: (ref) =>
      numbers.deleteNumber(ref).then(() => undefined, unlessGone),
    deleteTrunk: (ref) =>
      trunks.deleteTrunk(ref).then(() => undefined, unlessGone)
  };
}
