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
import { VoiceClientConfig } from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import { Bridge, Client } from "ari-client";
import { AriEvent } from "../types";
import { createExternalMediaConfig } from "../utils/createExternalMediaConfig";

const logger = getLogger({ service: "apiserver", filePath: __filename });

class ExternalMediaHandler {
  private ari: Client;
  private bridge: Bridge;
  private config: VoiceClientConfig;

  constructor(params: { ari: Client; config: VoiceClientConfig }) {
    this.ari = params.ari;
    this.config = params.config;
  }

  async setupExternalMedia(port: number): Promise<void> {
    const bridge = this.ari.Bridge();
    const channel = this.ari.Channel();

    await bridge.create({ type: "mixing" });

    logger.verbose("creating external media config", {
      port,
      sessionRef: this.config.sessionRef,
      bridgeId: bridge.id
    });

    channel.externalMedia(createExternalMediaConfig(port));

    channel.once(AriEvent.STASIS_START, async (_, channel) => {
      bridge.addChannel({ channel: [this.config.sessionRef, channel.id] });
      logger.verbose("added channel to bridge", {
        sessionRef: this.config.sessionRef,
        channelId: channel.id
      });
    });

    channel.once("ChannelLeftBridge", async () => {
      logger.verbose("channel left bridge", {
        sessionRef: this.config.sessionRef,
        bridgeId: bridge.id
      });

      try {
        await bridge.destroy();
      } catch (e) {
        // We can only try
      }
    });

    this.bridge = bridge;
  }

  getBridge(): Bridge {
    return this.bridge;
  }
}

export { ExternalMediaHandler };
