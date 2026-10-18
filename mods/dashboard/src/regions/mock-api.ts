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
  DEFAULT_REGION,
  type CreatedRegion,
  type Region,
  type RegionDetail,
  type RegionsApi
} from "./types";

const inHours = (h: number) =>
  new Date(Date.now() + h * 3600_000).toISOString();

export const privateRegion = (
  over: Partial<RegionDetail> = {}
): RegionDetail => ({
  ref: "rg_7K2QF",
  id: "acme-dallas",
  displayName: "Acme Dallas",
  kind: "private",
  status: "connected",
  version: "0.28.1",
  lastSeenAt: new Date().toISOString(),
  roomrNodes: 2,
  gateways: 1,
  activeCalls: 3,
  sipDomain: "sip.acme.com",
  workspaces: [{ ref: "ws-1", name: "Acme Support" }],
  secrets: [
    { name: "deepgram", usedBy: ["Support line"], set: true },
    { name: "elevenlabs", usedBy: ["Support line", "Sales bot"], set: false }
  ],
  ...over
});

export const publicRegion = (
  over: Partial<RegionDetail> = {}
): RegionDetail => ({
  ...DEFAULT_REGION,
  workspaces: [],
  secrets: [],
  ...over
});

const summary = (r: RegionDetail): Region => ({
  ref: r.ref,
  id: r.id,
  displayName: r.displayName,
  kind: r.kind,
  status: r.status
});

/** An in-memory RegionsApi; tests change `state.regions` to move the status. */
export function createMockRegionsApi(
  initial: RegionDetail[] = [privateRegion()]
) {
  const state = {
    regions: [publicRegion(), ...initial],
    created: [] as unknown[],
    createdRegions: [] as unknown[],
    calls: [] as string[]
  };
  const find = (ref: string) => {
    const r = state.regions.find((x) => x.ref === ref);
    if (!r) throw new Error("Region not found");
    return r;
  };
  const patch = (ref: string, over: Partial<RegionDetail>) => {
    state.regions = state.regions.map((r) =>
      r.ref === ref ? { ...r, ...over } : r
    );
  };
  const api: RegionsApi & { state: typeof state } = {
    state,
    listRegions: async () => state.regions.map(summary),
    createRegion: async (input): Promise<CreatedRegion> => {
      state.createdRegions.push(input);
      const ref = "rg_NEW01";
      state.regions.push(
        privateRegion({
          ref,
          id: input.id,
          displayName: input.displayName,
          sipDomain: input.sipDomain,
          status: "waiting",
          version: undefined,
          workspaces: [],
          secrets: []
        })
      );
      return {
        ref,
        id: input.id,
        token: "eyJhbGciOiJFUzI1NiJ9.mock.token",
        expiresAt: inHours(24)
      };
    },
    getRegion: async (ref) => find(ref),
    updateRegion: async (ref, { displayName }) => patch(ref, { displayName }),
    reissueRegionToken: async (ref) => {
      state.calls.push(`reissue:${ref}`);
      return {
        token: "eyJhbGciOiJFUzI1NiJ9.reissued.token",
        expiresAt: inHours(24)
      };
    },
    disconnectRegion: async (ref) =>
      patch(ref, { status: "waiting", version: undefined }),
    deleteRegion: async (ref) => {
      state.regions = state.regions.filter((r) => r.ref !== ref);
    },
    createWorkspace: async (input) => {
      state.created.push(input);
      return { ref: "ws-new" };
    }
  };
  return api;
}
