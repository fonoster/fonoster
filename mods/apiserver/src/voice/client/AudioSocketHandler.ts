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
import { Stream } from "stream";
import { VoiceClientConfig } from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import { AudioSocket, AudioStream } from "@fonoster/streams";
import { transcribeOnConnection } from "../transcribeOnConnection";

const logger = getLogger({ service: "apiserver", filePath: __filename });

class AudioSocketHandler {
  private audioSocket: AudioSocket;
  private audioStream: AudioStream;
  private transcriptionsStream: Stream;
  private config: VoiceClientConfig;

  constructor(params: {
    transcriptionsStream: Stream;
    config: VoiceClientConfig;
  }) {
    this.transcriptionsStream = params.transcriptionsStream;
    this.config = params.config;
  }

  async setupAudioSocket(port: number): Promise<void> {
    return new Promise((resolve) => {
      logger.verbose("creating audio socket", { port });
      this.audioSocket = new AudioSocket();

      this.audioSocket.onConnection(async (req, res) => {
        logger.verbose("audio socket connection received", {
          ref: req.ref,
          sessionRef: this.config.sessionRef
        });

        transcribeOnConnection(this.transcriptionsStream)(req, res);

        res.onClose(() => {
          logger.verbose("session audio stream closed", {
            sessionRef: this.config.sessionRef
          });
        });

        res.onError((err) => {
          logger.error("session audio stream error", {
            error: err,
            sessionRef: this.config.sessionRef
          });
        });

        this.audioStream = res;

        resolve();
      });

      this.audioSocket.listen(port, () => {
        logger.verbose("audio socket listening", {
          port,
          appRef: this.config.appRef
        });
      });
    });
  }

  getAudioStream(): AudioStream {
    return this.audioStream;
  }

  close(): void {
    try {
      this.audioSocket.close();
    } catch (e) {
      // Ignore errors on close
    }
  }
}

export { AudioSocketHandler };
