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
import { Prisma } from "../db";
import { RegionWorkspace } from "../exchanges/types";

const pick = (w: {
  ref: string;
  accessKeyId: string;
  name: string;
  ownerRef: string;
  region: string;
}): RegionWorkspace => ({
  ref: w.ref,
  accessKeyId: w.accessKeyId,
  name: w.name,
  ownerRef: w.ownerRef,
  region: w.region
});

/**
 * Read access to workspaces for the control plane's regions code (add-private-regions PR-14):
 * which workspaces a region serves, who owns a workspace and which workspaces were deleted.
 * Identity has its own database.
 */
function createWorkspaceDirectory(prisma: Prisma) {
  return {
    async workspace(accessKeyId: string) {
      const w = await prisma.workspace.findUnique({ where: { accessKeyId } });
      return w ? pick(w) : undefined;
    },
    async inRegion(region: string) {
      const rows = await prisma.workspace.findMany({
        where: { region },
        orderBy: { createdAt: "asc" }
      });
      return rows.map(pick);
    },
    /** Every deleted workspace (the `workspace_deleted` trigger's records); rejects when the DB fails. */
    async deleted() {
      return prisma.workspaceDeletion.findMany({
        select: { accessKeyId: true, deletedAt: true }
      });
    },
    /** Whether this workspace was deleted: one primary-key lookup; rejects when the DB fails. */
    async isDeleted(accessKeyId: string) {
      const row = await prisma.workspaceDeletion.findUnique({
        where: { accessKeyId },
        select: { accessKeyId: true }
      });
      return row !== null;
    }
  };
}

export { createWorkspaceDirectory };
