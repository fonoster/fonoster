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
import { AuthzClient } from "@fonoster/authz";
import { VoiceClientConfig } from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import { Client } from "ari-client";
import {
  AUTHZ_SERVICE_ENABLED,
  AUTHZ_SERVICE_HOST,
  AUTHZ_SERVICE_PORT
} from "../../envs";

const logger = getLogger({ service: "apiserver", filePath: __filename });

class AuthorizationHandler {
  private config: VoiceClientConfig;
  private ari: Client;

  constructor(params: { config: VoiceClientConfig; ari: Client }) {
    this.config = params.config;
    this.ari = params.ari;
  }

  async checkAuthorization(): Promise<boolean> {
    if (!AUTHZ_SERVICE_ENABLED) {
      return true;
    }

    const { sessionRef: channelId, accessKeyId } = this.config;

    try {
      const authz = new AuthzClient(
        `${AUTHZ_SERVICE_HOST}:${AUTHZ_SERVICE_PORT}`
      );

      const authorized = await authz.checkSessionAuthorized({ accessKeyId });

      if (!authorized) {
        logger.verbose("rejected unauthorized session", { channelId });
        await this.handleUnauthorizedSession();
        return false;
      }

      return true;
    } catch (e) {
      logger.error("authz service error", e);
      await this.handleUnauthorizedSession();
      return false;
    }
  }

  private async handleUnauthorizedSession(): Promise<void> {
    const { sessionRef: channelId } = this.config;

    try {
      await this.ari.channels.answer({ channelId });
      await this.ari.channels.play({ channelId, media: "sound:unavailable" });
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await this.ari.channels.hangup({ channelId });
    } catch (e) {
      logger.error("error handling unauthorized session", e);
    }
  }
}

export { AuthorizationHandler };
