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
import type { FonosterSdk } from "~/lib/client";
import {
  DEFAULT_REGION,
  PRIVATE_REGION,
  type EnrollmentToken,
  type Region,
  type RegionsApi
} from "./types";

// The RegionsApi over the SDK. The control-plane side is built in parallel, so the method names
// and shapes below are ASSUMED from the spec (RU-B1) and reached through a loose view of the SDK.
type Loose = Record<
  string,
  ((...args: unknown[]) => Promise<unknown>) | undefined
>;
const part = (sdk: FonosterSdk, name: string): Loose =>
  ((sdk as unknown as Record<string, Loose | undefined>)[name] ?? {}) as Loose;

function token(res: unknown): EnrollmentToken {
  const r = (res ?? {}) as Record<string, unknown>;
  return {
    token: String(r.enrollmentToken ?? r.token ?? ""),
    expiresAt: String(r.expiresAt ?? r.enrollmentExpiresAt ?? "")
  };
}

export function createSdkRegionsApi(sdk: FonosterSdk): RegionsApi {
  return {
    async listRegions() {
      try {
        const res = (await part(sdk, "regions").listRegions?.()) as
          | { items?: { id: string; name: string }[] }
          | undefined;
        return res?.items?.length ? res.items : [DEFAULT_REGION];
      } catch {
        return [DEFAULT_REGION];
      }
    },
    async createWorkspace({ name, region }) {
      const res = (await sdk.workspaces.createWorkspace({
        name,
        region: region === PRIVATE_REGION ? "private" : region
      } as never)) as unknown as Record<string, unknown>;
      const enrollment = res.enrollmentToken ? token(res) : undefined;
      return { ref: String(res.ref), enrollment };
    },
    async getRegion() {
      return (await part(sdk, "workspaces").getRegion?.()) as Region;
    },
    async reissueRegionToken() {
      return token(await part(sdk, "workspaces").reissueRegionToken?.());
    },
    async disconnectRegion() {
      await part(sdk, "workspaces").disconnectRegion?.();
    }
  };
}
