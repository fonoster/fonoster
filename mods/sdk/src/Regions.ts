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
  CreateRegionRequest,
  CreateRegionResponse,
  ListRegionsResponse,
  Region,
  RegionEnrollmentToken
} from "@fonoster/types";
import { FonosterClient } from "./client/types";

type FetchLike = (
  url: string,
  init?: { method?: string; headers?: Record<string, string>; body?: string }
) => Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>;

/** An error answer from the regions API (status and its `error` code). */
class RegionsError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message?: string
  ) {
    super(message ?? `regions API: ${status} ${code}`);
  }
}

/**
 * @classdesc Regions (add-private-regions, PR-12..PR-21) through the HTTP API (`/api/regions`).
 * Regions belong to the signed-in user: create a private region (id, display name, SIP domain),
 * get its one-time enrollment token, watch its status, re-issue the token, disconnect or delete
 * it. A workspace picks a region when it is created (`workspaces.createWorkspace({name, region})`).
 *
 * @example
 * const regions = new SDK.Regions(client);
 * const { items } = await regions.listRegions();
 * const { ref, token } = await regions.createRegion({
 *   id: "acme-hq", displayName: "Acme HQ", sipDomain: "sip.acme.com"
 * });
 * const region = await regions.getRegion("acme-hq");
 */
class Regions {
  private readonly client: FonosterClient;
  private readonly baseUrl?: string;
  private readonly fetchFn: FetchLike;

  constructor(
    client: FonosterClient,
    options: { baseUrl?: string; fetch?: FetchLike } = {}
  ) {
    this.client = client;
    this.baseUrl = options.baseUrl?.replace(/\/+$/, "");
    // Called as a method below, so never store the global unbound: in browsers a detached
    // `fetch` throws "Illegal invocation".
    this.fetchFn =
      options.fetch ??
      (client.getFetch?.() as FetchLike | undefined) ??
      (((input, init) =>
        globalThis.fetch(input, init)) as unknown as FetchLike);
  }

  private headers(auth: boolean, body?: unknown): Record<string, string> {
    const h: Record<string, string> = {};
    if (body !== undefined) h["content-type"] = "application/json";
    if (!auth) return h;
    const token = this.client.getAccessToken?.();
    if (token) h.authorization = `Bearer ${token}`;
    const accessKeyId = this.client.getAccessKeyId?.();
    if (accessKeyId) h["x-accesskey-id"] = accessKeyId;
    return h;
  }

  private async json<T>(
    path: string,
    method = "GET",
    body?: unknown,
    auth = true
  ): Promise<T> {
    const base =
      this.baseUrl ?? this.client.getHttpUrl?.() ?? "https://api.fonoster.ai";
    const attempt = () =>
      this.fetchFn(`${base}/api/regions${path}`, {
        method,
        headers: this.headers(auth, body),
        ...(body !== undefined ? { body: JSON.stringify(body) } : {})
      });
    let res = await attempt();
    if (res.status === 401 && auth) {
      await this.client.refreshToken();
      res = await attempt();
    }
    const out = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok)
      throw new RegionsError(
        res.status,
        String(out.error ?? "error"),
        out.message as string | undefined
      );
    return out as T;
  }

  private static path(region: string) {
    return `/${encodeURIComponent(region)}`;
  }

  /**
   * The regions a new workspace can pick: the offered public regions and, when signed in, your
   * private regions (with status).
   */
  async listRegions(): Promise<ListRegionsResponse> {
    let signedIn = false;
    try {
      signedIn = !!this.client.getAccessToken?.();
    } catch {
      signedIn = false;
    }
    return this.json("", "GET", undefined, signedIn);
  }

  /**
   * Creates a private region (PR-15, PR-16, PR-18). The token (`token`, also `enrollmentToken`)
   * is returned once; run `fonoster-region enroll <token>` on the region machine.
   */
  async createRegion(
    request: CreateRegionRequest
  ): Promise<CreateRegionResponse> {
    return this.json("", "POST", request);
  }

  /**
   * One region by id or ref; without an argument, the current workspace's region (its status,
   * secrets and connection details).
   */
  async getRegion(region?: string): Promise<Region> {
    return this.json(region ? Regions.path(region) : "/current");
  }

  /** Changes a private region's display name (the id never changes). */
  async updateRegion(
    region: string,
    request: { displayName: string }
  ): Promise<Region> {
    return this.json(Regions.path(region), "PATCH", request);
  }

  /** A new one-time enrollment token; enrolling with it revokes the current cell. */
  async reissueRegionToken(region?: string): Promise<RegionEnrollmentToken> {
    return this.json(`${Regions.path(await this.refOf(region))}/token`, "POST");
  }

  /** Revokes the region's cell now; the region goes back to `waiting`. */
  async disconnectRegion(region?: string): Promise<void> {
    await this.json(
      `${Regions.path(await this.refOf(region))}/disconnect`,
      "POST"
    );
  }

  /** Deletes a private region; refused (`region_in_use`) while any workspace uses it. */
  async deleteRegion(region: string): Promise<{ ref: string }> {
    return this.json(Regions.path(region), "DELETE");
  }

  /** The given region, or the current workspace's region. */
  private async refOf(region?: string) {
    if (region) return region;
    return (await this.getRegion()).ref;
  }
}

export { Regions, RegionsError };
