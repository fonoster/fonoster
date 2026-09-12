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
import { AudioSocket, AudioStream, StreamRequest } from "@fonoster/streams";
import { resolvePendingClassification } from "../agi/sessionRegistry";
import {
  AUDIOSOCKET_BIND_ADDR,
  AUDIOSOCKET_PORT,
  MODEL_PATH,
  PROBE_MS,
  TIMEOUT_MS
} from "../envs";
import { runProbe } from "../probe/runProbe";

const logger = getLogger({ service: "amd", filePath: __filename });

/**
 * Starts the AudioSocket listener that receives the audio leg of each AGI
 * session. Asterisk's `EXEC AudioSocket <uuid>,<host>:<port>` connects here;
 * `req.ref` carries the same UUID the AGI handler minted, correlating this
 * connection with the pending classification it's waiting on.
 */
function startAudioSocketServer(): AudioSocket {
  const audioSocket = new AudioSocket();

  audioSocket.onConnection(async (req: StreamRequest, stream: AudioStream) => {
    const sessionId = req.ref;
    logger.verbose("audiosocket connection", { sessionId });

    const result = await runProbe({
      stream,
      probeMs: PROBE_MS,
      timeoutMs: TIMEOUT_MS,
      modelDir: MODEL_PATH || undefined
    });

    logger.verbose("audiosocket result", { sessionId, ...result });
    resolvePendingClassification(sessionId, result);
    stream.hangup();
  });

  audioSocket.listen(AUDIOSOCKET_PORT, AUDIOSOCKET_BIND_ADDR, () => {
    logger.info("audiosocket server listening", {
      port: AUDIOSOCKET_PORT,
      bind: AUDIOSOCKET_BIND_ADDR
    });
  });

  return audioSocket;
}

export { startAudioSocketServer };
