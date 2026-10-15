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
 * @classdesc Regions (add-private-regions) through the HTTP API (`/api/regions`): the public
 * regions a new workspace can pick, and the current workspace's region: its status, a re-issued
 * enrollment token (owner or admin) and disconnecting its cell (owner or admin).
 *
 * @example
 * const regions = new SDK.Regions(client);
 * const { items } = await regions.listRegions();
 * const region = await regions.getRegion();
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
    this.fetchFn =
      options.fetch ?? (globalThis.fetch as unknown as FetchLike | undefined)!;
  }

  private async json<T>(path: string, method = "GET", auth = true): Promise<T> {
    const base =
      this.baseUrl ?? this.client.getHttpUrl?.() ?? "https://api.fonoster.com";
    const attempt = () =>
      this.fetchFn(`${base}/api/regions${path}`, {
        method,
        headers: auth
          ? {
              authorization: `Bearer ${this.client.getAccessToken()}`,
              "x-accesskey-id": this.client.getAccessKeyId()
            }
          : {}
      });
    let res = await attempt();
    if (res.status === 401 && auth) {
      await this.client.refreshToken();
      res = await attempt();
    }
    const body = (await res.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    if (!res.ok)
      throw new RegionsError(
        res.status,
        String(body.error ?? "error"),
        body.message as string | undefined
      );
    return body as T;
  }

  /** The public regions a new workspace can pick (plus "private", always offered). */
  async listRegions(): Promise<ListRegionsResponse> {
    return this.json("", "GET", false);
  }

  /** The current workspace's region; for a private one, its cell's status and secrets. */
  async getRegion(): Promise<Region> {
    return this.json("/current");
  }

  /** A new one-time enrollment token; enrolling with it revokes the current cell (owner, admin). */
  async reissueRegionToken(): Promise<RegionEnrollmentToken> {
    return this.json("/current/token", "POST");
  }

  /** Revokes the cell's credentials now; the region goes back to `waiting` (owner, admin). */
  async disconnectRegion(): Promise<void> {
    await this.json("/current/disconnect", "POST");
  }
}

export { Regions, RegionsError };
