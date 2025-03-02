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
import * as Fonoster from "@fonoster/sdk";
import { Trunk } from "@fonoster/types";

async function getFonosterTrunkByInboundUri(
  client: Fonoster.Client,
  inboundUri: string
): Promise<Trunk> {
  try {
    const trunks = new Fonoster.Trunks(client);
    const trunksList = await trunks.listTrunks({ pageSize: 1000 });
    return trunksList.items.filter(
      (trunk) => trunk.inboundUri === inboundUri
    )[0];
  } catch (error: unknown) {
    throw new Error(
      `Error checking SIP trunk existence: ${(error as Error).message}`
    );
  }
}

export { getFonosterTrunkByInboundUri };
