/*
 * Copyright (C) 2024 by Fonoster Inc (https://fonoster.com)
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
  VoiceClientConfig,
  VoiceOut,
  VoiceSessionStream,
  createServiceDefiniton
} from "@fonoster/common";
import * as grpc from "@grpc/grpc-js";
import { RequestType, VoiceClient, VoiceRequest } from "./types";

const VoiceServiceClient = grpc.makeGenericClientConstructor(
  createServiceDefiniton({
    serviceName: "Voice",
    pckg: "voice",
    proto: "voice.proto",
    version: "v1beta2"
  }),
  "",
  {}
);

class VoiceClientImpl implements VoiceClient {
  config: VoiceClientConfig;
  stream: Stream;
  voiceSession: VoiceSessionStream;

  constructor(config: VoiceClientConfig) {
    this.config = config;
    this.stream = new Stream();
  }

  connect() {
    const grpcClient = new VoiceServiceClient(
      this.config.endpoint,
      grpc.credentials.createInsecure()
    );

    const metadata = new grpc.Metadata();
    metadata.add("accessKeyId", this.config.accessKeyId);
    metadata.add("token", this.config.sessionToken);

    this.voiceSession = grpcClient.createSession(metadata);

    // Listen for events
    this.voiceSession.on("data", (data: unknown) => {
      this.stream.emit(data.content, data);
    });

    this.voiceSession.write({ request: this.config });
  }

  on(type: RequestType, callback: (data: VoiceRequest) => void) {
    this.stream.on(type.toString(), (data: VoiceRequest) => {
      callback(data[type]);
    });
  }

  sendResponse(response: VoiceOut): void {
    this.voiceSession.write(response);
  }

  // Fixme: Implement
  close() {}
}

export { VoiceClientImpl };
