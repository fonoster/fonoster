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
      createWorkspace: vi.fn().mockResolvedValue({
        ref: "ws-new",
        region: "rg_abc",
        enrollmentToken: "tok",
        expiresAt: "2026-10-16T00:00:00.000Z"
      })
    },
    regions: {
      listRegions: vi.fn().mockResolvedValue({
        items: [{ id: "us-east-1", name: "US East", default: true }]
      }),
      getRegion: vi.fn().mockResolvedValue({
        ref: "rg_abc",
        kind: "private",
        name: "Private region",
        status: "connected",
        state: "connected",
        version: "0.27.0",
        components: { mediaNodes: 2, gateways: 1, autopilot: true },
        activeCalls: 1,
        secrets: [{ name: "deepgram", usedBy: ["Reception"], set: true }],
        endpoints
      }),
      reissueRegionToken: vi
        .fn()
        .mockResolvedValue({ enrollmentToken: "tok2", expiresAt: "x" }),
      disconnectRegion: vi.fn().mockResolvedValue(undefined)
    }
  };
  return { sdk, api: createSdkRegionsApi(sdk as unknown as FonosterSdk) };
}

describe("RegionsApi over the SDK", () => {
  it("creates a workspace with its region and returns the token once", async () => {
    const { sdk, api } = fake();
    expect(
      await api.createWorkspace({ name: "Acme", region: "private" })
    ).toEqual({
      ref: "ws-new",
      enrollment: { token: "tok", expiresAt: "2026-10-16T00:00:00.000Z" }
    });
    expect(sdk.workspaces.createWorkspace).toHaveBeenCalledWith({
      name: "Acme",
      region: "private"
    });
  });

  it("lists public regions, falling back to us-east-1", async () => {
    const { sdk, api } = fake();
    expect(await api.listRegions()).toEqual([
      { id: "us-east-1", name: "US East" }
    ]);
    sdk.regions.listRegions.mockRejectedValueOnce(new Error("down"));
    expect((await api.listRegions())[0].id).toBe("us-east-1");
  });

  it("maps the region view, including endpoints", async () => {
    const { api } = fake();
    const r = await api.getRegion();
    expect(r).toMatchObject({
      ref: "rg_abc",
      kind: "private",
      status: "connected",
      mediaNodes: 2,
      gateways: 1,
      activeCalls: 1,
      endpoints
    });
  });

  it("re-issues a token and disconnects", async () => {
    const { sdk, api } = fake();
    expect(await api.reissueRegionToken()).toEqual({
      token: "tok2",
      expiresAt: "x"
    });
    await api.disconnectRegion();
    expect(sdk.regions.disconnectRegion).toHaveBeenCalled();
  });
});
