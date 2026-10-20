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
import { GetUsageRequest, GetUsageResponse, UsageRow } from "@fonoster/types";
import { makeRpcRequest } from "./client/makeRpcRequest";
import { FonosterClient } from "./client/types";
import {
  GetUsageRequest as GetUsageRequestPB,
  GetUsageResponse as GetUsageResponsePB,
  UsageRow as UsageRowPB
} from "./generated/node/usage_pb";

/**
 * @classdesc What the workspace consumed: call minutes, speech, language-model tokens, noise
 * cancelling, answering-machine detections, recordings and storage. Quantities only, never money.
 * Each total says whose key a vendor was called with (`keySource`: `workspace` or `platform`).
 *
 * @example
 * const usage = new SDK.Usage(client);
 * const { rows } = await usage.getUsage({
 *   fromDay: "2026-10-01",
 *   toDay: "2026-10-31",
 *   groupBy: ["key_source"]
 * });
 */
class Usage {
  private readonly client: FonosterClient;

  constructor(client: FonosterClient) {
    this.client = client;
  }

  /**
   * Usage totals for a range of days (UTC, inclusive), split by meter and by the dimensions in
   * `groupBy` (day, workspace, provider, model, key_source, origin). With `allOwned`, a workspace
   * owner gets every workspace they own.
   */
  async getUsage(request: GetUsageRequest): Promise<GetUsageResponse> {
    const client = this.client.getUsageClient();
    const raw = await makeRpcRequest<
      GetUsageRequestPB,
      GetUsageResponsePB,
      GetUsageRequest,
      { rows?: UsageRow[] }
    >({
      method: client.getUsage.bind(client),
      requestPBObjectConstructor: GetUsageRequestPB,
      metadata: this.client.getMetadata(),
      request: { groupBy: [], ...request },
      repeatableObjectMapping: [["rowsList", UsageRowPB]]
    });
    return { rows: raw.rows ?? [] };
  }
}

export { Usage };
