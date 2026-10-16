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
import { getLogger } from "@fonoster/logger";
import { CommonTypes as CT } from "@routr/common";
import SDK from "@routr/sdk";
import { CreatePeerRequest } from "@routr/sdk/dist/peers/types";
import { ROUTR_MEDIA_NODE_PEER } from "../envs";
import { routrConfig } from "./routrConfig";

const logger = getLogger({ service: "apiserver", filePath: __filename });

const RETRY_DELAY_MS = 5_000;
const MAX_ATTEMPTS = 60;

/**
 * The peer Go media nodes register under: least-sessions over `X-Session-Count`, any number of
 * nodes (add-media-node 4.1). Created only when `routr.mediaNodePeer.password` is set.
 */
async function upsertMediaNodePeer(
  attempt = 1,
  delayMs = RETRY_DELAY_MS
): Promise<void> {
  const { aor, name, username, password } = ROUTR_MEDIA_NODE_PEER;
  if (!password) return;
  const peers = new SDK.Peers(routrConfig);
  const credentials = new SDK.Credentials(routrConfig);

  try {
    // Peer first: if it already exists, nothing else is created (no duplicate credentials).
    const peer = await peers.createPeer({
      name,
      username,
      aor,
      balancingAlgorithm: CT.LoadBalancingAlgorithm.LEAST_SESSIONS,
      withSessionAffinity: false,
      maxContacts: -1,
      enabled: true
    } as CreatePeerRequest);
    const creds = await credentials.createCredentials({
      name: `${name} credentials`,
      username,
      password
    });
    peer.credentialsRef = creds.ref;
    await peers.updatePeer(peer);
    logger.info("media-node peer created", { peerRef: peer.ref, aor });
  } catch (err: unknown) {
    const error = err as { message: string; code: number };
    if (error.message.includes("already exist")) {
      logger.info("media-node peer already exists");
      return;
    }
    if (error.message.includes("Cannot connect") && attempt < MAX_ATTEMPTS) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      return upsertMediaNodePeer(attempt + 1, delayMs);
    }
    logger.error(`error creating the media-node peer: ${error.message}`, {
      code: error.code
    });
  }
}

export { upsertMediaNodePeer };
