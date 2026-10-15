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
import { describe, expect, it, vi } from "vitest";
import type { FonosterSdk } from "~/lib/client";
import { createSdkRegionsApi } from "./sdk-api";

const endpoints = {
  sip: [{ host: "sip.acme.example", port: 5061, transport: "tls" }],
  signalingAddresses: ["203.0.113.10"],
  mediaAddresses: [],
  rtpPorts: { min: 20000, max: 20999 }
};

function fake() {
  const sdk = {
    workspaces: {
      createWorkspace: vi.fn().mockResolvedValue({ ref: "ws-new" })
    },
    regions: {
      createRegion: vi.fn().mockResolvedValue({
        ref: "rg_abc",
        id: "acme-dallas",
        token: "tok",
        expiresAt: "2026-10-16T00:00:00.000Z"
      }),
      listRegions: vi.fn().mockResolvedValue([
        {
          ref: "rg_d",
          id: "default",
          displayName: "Default",
          kind: "public",
          state: "connected"
        },
        {
          ref: "rg_abc",
          id: "acme-dallas",
          displayName: "Acme Dallas",
          kind: "private",
          state: "waiting"
        }
      ]),
      getRegion: vi.fn().mockResolvedValue({
        ref: "rg_abc",
        id: "acme-dallas",
        displayName: "Acme Dallas",
        kind: "private",
        state: "connected",
        version: "0.27.0",
        lastSeenAt: "2026-10-15T10:00:00.000Z",
        components: { mediaNodes: 2, gateways: 1 },
        activeCalls: 1,
        sipDomain: "sip.acme.com",
        workspaces: [{ ref: "ws-1", name: "Acme Support" }],
        secretsNeeded: ["deepgram", "elevenlabs"],
        secretsSet: ["deepgram"],
        endpoints
      }),
      updateRegion: vi.fn().mockResolvedValue({}),
      reissueRegionToken: vi
        .fn()
        .mockResolvedValue({ token: "tok2", expiresAt: "x" }),
      disconnectRegion: vi.fn().mockResolvedValue(undefined),
      deleteRegion: vi.fn().mockResolvedValue(undefined)
    }
  };
  return { sdk, api: createSdkRegionsApi(sdk as unknown as FonosterSdk) };
}

describe("RegionsApi over the SDK", () => {
  it("creates a region and returns the token once", async () => {
    const { sdk, api } = fake();
    const input = {
      id: "acme-dallas",
      displayName: "Acme Dallas",
      sipDomain: "sip.acme.com"
    };
    expect(await api.createRegion(input)).toMatchObject({
      ref: "rg_abc",
      token: "tok"
    });
    expect(sdk.regions.createRegion).toHaveBeenCalledWith(input);
  });

  it("creates a workspace with a region id", async () => {
    const { sdk, api } = fake();
    expect(
      await api.createWorkspace({ name: "Acme", region: "acme-dallas" })
    ).toEqual({ ref: "ws-new" });
    expect(sdk.workspaces.createWorkspace).toHaveBeenCalledWith({
      name: "Acme",
      region: "acme-dallas"
    });
  });

  it("lists regions with state as status, falling back to the default", async () => {
    const { sdk, api } = fake();
    const list = await api.listRegions();
    expect(list.map((r) => [r.id, r.status])).toEqual([
      ["default", "connected"],
      ["acme-dallas", "waiting"]
    ]);
    sdk.regions.listRegions.mockRejectedValueOnce(new Error("down"));
    expect((await api.listRegions())[0].id).toBe("default");
  });

  it("maps the region view, including keys and workspaces", async () => {
    const { api } = fake();
    expect(await api.getRegion("rg_abc")).toMatchObject({
      ref: "rg_abc",
      status: "connected",
      mediaNodes: 2,
      gateways: 1,
      activeCalls: 1,
      sipDomain: "sip.acme.com",
      workspaces: [{ ref: "ws-1", name: "Acme Support" }],
      secrets: [
        { name: "deepgram", set: true },
        { name: "elevenlabs", set: false }
      ],
      endpoints
    });
  });

  it("re-issues, disconnects, renames and deletes by ref", async () => {
    const { sdk, api } = fake();
    expect(await api.reissueRegionToken("rg_abc")).toEqual({
      token: "tok2",
      expiresAt: "x"
    });
    await api.disconnectRegion("rg_abc");
    await api.updateRegion("rg_abc", { displayName: "Dallas" });
    await api.deleteRegion("rg_abc");
    expect(sdk.regions.disconnectRegion).toHaveBeenCalledWith("rg_abc");
    expect(sdk.regions.updateRegion).toHaveBeenCalledWith("rg_abc", {
      displayName: "Dallas"
    });
    expect(sdk.regions.deleteRegion).toHaveBeenCalledWith("rg_abc");
  });
});
