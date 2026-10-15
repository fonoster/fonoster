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
  type EnrollmentToken,
  type Region,
  type RegionsApi
} from "./types";

const inHours = (h: number) =>
  new Date(Date.now() + h * 3600_000).toISOString();

export const privateRegion = (over: Partial<Region> = {}): Region => ({
  ref: "rg_7K2QF",
  kind: "private",
  name: "Your region",
  status: "connected",
  version: "0.28.1",
  lastHeartbeatAt: new Date().toISOString(),
  mediaNodes: 2,
  gateways: 1,
  activeCalls: 3,
  enrolledAt: "2026-10-14T15:00:00.000Z",
  secrets: [
    { name: "deepgram", usedBy: ["Support line"], set: true },
    { name: "elevenlabs", usedBy: ["Support line", "Sales bot"], set: false }
  ],
  ...over
});

export const publicRegion = (): Region => ({
  ref: DEFAULT_REGION.id,
  kind: "public",
  name: DEFAULT_REGION.name,
  status: "connected",
  secrets: []
});

/** An in-memory RegionsApi; tests change `state.region` to move the status. */
export function createMockRegionsApi(initial: Region = privateRegion()) {
  const state = { region: initial, created: [] as unknown[] };
  const api: RegionsApi & { state: typeof state } = {
    state,
    listRegions: async () => [DEFAULT_REGION],
    createWorkspace: async (input) => {
      state.created.push(input);
      const priv = input.region === "private";
      return {
        ref: "ws-new",
        enrollment: priv
          ? { token: "eyJhbGciOiJFUzI1NiJ9.mock.token", expiresAt: inHours(24) }
          : undefined
      };
    },
    getRegion: async () => state.region,
    reissueRegionToken: async (): Promise<EnrollmentToken> => ({
      token: "eyJhbGciOiJFUzI1NiJ9.reissued.token",
      expiresAt: inHours(24)
    }),
    disconnectRegion: async () => {
      state.region = { ...state.region, status: "waiting", version: undefined };
    }
  };
  return api;
}
