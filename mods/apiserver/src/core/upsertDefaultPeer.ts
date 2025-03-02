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
import {
  ROUTR_DEFAULT_PEER_AOR,
  ROUTR_DEFAULT_PEER_NAME,
  ROUTR_DEFAULT_PEER_PASSWORD,
  ROUTR_DEFAULT_PEER_USERNAME
} from "../envs";
import { routrConfig } from "./routrConfig";

const logger = getLogger({ service: "apiserver", filePath: __filename });

function createCredentialsForDefaultPeer() {
  const credentials = new SDK.Credentials(routrConfig);

  const request = {
    name: ROUTR_DEFAULT_PEER_NAME,
    username: ROUTR_DEFAULT_PEER_USERNAME,
    password: ROUTR_DEFAULT_PEER_PASSWORD
  };

  return credentials.createCredentials(request);
}

async function upsertDefaultPeer() {
  const peers = new SDK.Peers(routrConfig);

  logger.info("creating default peer");

  try {
    const request = {
      name: ROUTR_DEFAULT_PEER_NAME,
      username: ROUTR_DEFAULT_PEER_USERNAME,
      aor: ROUTR_DEFAULT_PEER_AOR,
      balancingAlgorithm: CT.LoadBalancingAlgorithm.ROUND_ROBIN,
      withSessionAffinity: false,
      maxContacts: -1,
      enabled: true
    } as CreatePeerRequest;

    const peer = await peers.createPeer(request);

    logger.info("default Peer created", { peerRef: peer.ref });

    const creds = await createCredentialsForDefaultPeer();

    logger.info("credentials for default Peer created", {
      credentialsRef: creds.ref
    });

    peer.credentialsRef = creds.ref;

    await peers.updatePeer(peer);

    logger.info("credentials associated with default Peer", {
      peerRef: peer.ref,
      credentialsRef: creds.ref
    });
  } catch (err: unknown) {
    const error = err as { message: string; code: number };

    if (error.message.includes("already exist")) {
      logger.info("default peer already exist");
      return;
    }

    logger.error(`error creating default peer: ${error.message}`, {
      code: error.code
    });
  }
}

export { upsertDefaultPeer };
