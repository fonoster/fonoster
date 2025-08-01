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
import {
  GrpcError,
  StreamEvent,
  VoiceClientConfig,
  VoiceIn,
  VoiceSessionStreamClient
} from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import * as grpc from "@grpc/grpc-js";
import { GRPCClient } from "../types";
import { VoiceServiceClientConstructor } from "../utils/VoiceServiceClientConstructor";

const logger = getLogger({ service: "apiserver", filePath: __filename });

class GrpcClientHandler {
  private config: VoiceClientConfig;
  private verbsStream: Stream;
  private grpcClient: GRPCClient;
  private voice: VoiceSessionStreamClient;

  constructor(params: { config: VoiceClientConfig; verbsStream: Stream }) {
    this.config = params.config;
    this.verbsStream = params.verbsStream;
  }

  async setupGrpcClient(): Promise<void> {
    this.grpcClient = new VoiceServiceClientConstructor(
      this.config.endpoint,
      grpc.credentials.createInsecure()
    ) as unknown as GRPCClient;

    const metadata = new grpc.Metadata();
    metadata.add("accessKeyId", this.config.accessKeyId);
    metadata.add("token", this.config.sessionToken);

    this.voice = this.grpcClient.createSession(metadata);

    this.setupEventHandlers();

    // Initialize the session
    this.voice.write({ request: this.config });
  }

  private setupEventHandlers(): void {
    this.voice.on(StreamEvent.DATA, (data: VoiceIn) => {
      this.verbsStream.emit(data.content, data);
    });

    this.voice.on(StreamEvent.ERROR, (error: GrpcError) => {
      if (error.code === grpc.status.UNAVAILABLE) {
        logger.error(`voice server not available at "${this.config.endpoint}"`);
        return;
      }
      logger.error(`grpc stream error: ${error.message}`);
    });
  }

  getVoiceStream(): VoiceSessionStreamClient {
    return this.voice;
  }

  sendResponse(response: VoiceIn): void {
    try {
      this.voice.write(response);
    } catch (error) {
      logger.error(`error sending response: ${error.message}`);
    }
  }

  close(): void {
    try {
      this.voice.end();
      this.grpcClient.close();
    } catch (e) {
      // Ignore errors on close
    }
  }
}

export { GrpcClientHandler };
