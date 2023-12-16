/*
 * Copyright (C) 2023 by Fonoster Inc (https://fonoster.com)
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
import { getRedisConnection } from "@fonoster/core";
import { getLogger } from "@fonoster/logger";
import {
  APISERVER_ROUTR_DEFAULT_PEER_USERNAME,
  APISERVER_ROUTR_DEFAULT_PEER_SECRET
} from "./envs";

const logger = getLogger({ service: "apiserver", filePath: __filename });

type PeerInfo = {
  ref: string;
  username: string;
  secret: string;
};

async function upsertPeer(peerInfo: PeerInfo) {
  const redis = getRedisConnection();
  logger.info(`upserting peer ${peerInfo.ref}`);

  try {
    await redis.sadd("peers", peerInfo.ref);
    await redis.set(peerInfo.ref, buildPeer(peerInfo));
  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
  return peerInfo.ref;
}

function buildPeer(peerInfo: PeerInfo) {
  const { ref, username, secret } = peerInfo;
  const peerObj = {
    apiVersion: "v1beta1",
    kind: "Peer",
    metadata: {
      name: "Voice Media Server @ Default",
      ref: ref,
      createdOn: new Date().toISOString(),
      modifiedOn: new Date().toISOString()
    },
    spec: {
      device: "default",
      credentials: {
        username: username,
        secret: secret
      }
    }
  };

  return JSON.stringify(peerObj);
}

upsertPeer({
  ref: "default",
  username: APISERVER_ROUTR_DEFAULT_PEER_USERNAME,
  secret: APISERVER_ROUTR_DEFAULT_PEER_SECRET
}).catch(logger.error);
