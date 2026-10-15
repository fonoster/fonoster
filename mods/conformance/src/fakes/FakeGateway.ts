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
import WebSocket from "ws";
import { WebSocketPeer } from "../runner/Peer";
import { signatureHeaders } from "./signature";

export type FakeGatewayOptions = {
  /** Secret used to sign the connection request; omit to send no signature. */
  signingSecret?: string;
  /** Sign with this Unix time in seconds instead of now (to test stale signatures). */
  timestamp?: number;
  /** Fails the dial if the socket is not open within this time (default 5 s). */
  timeoutMs?: number;
  /** The subprotocol to request, if any. */
  protocol?: string;
};

/**
 * Plays the gateway side of the session protocol for SDK suites: dials the app under test with a
 * signed request, exactly as the VoiceSessionGateway does, and hands the runner the open socket.
 * What the gateway then sends is scripted by the scenario.
 */
export class FakeGateway {
  constructor(private readonly options: FakeGatewayOptions = {}) {}

  dial(url: string): Promise<WebSocketPeer> {
    const {
      signingSecret,
      timestamp,
      timeoutMs = 5000,
      protocol
    } = this.options;
    const headers = signingSecret
      ? signatureHeaders(url, signingSecret, timestamp)
      : {};

    return new Promise((resolve, reject) => {
      const socket = new WebSocket(url, protocol ? [protocol] : [], {
        headers,
        handshakeTimeout: timeoutMs
      });
      // Build the peer before "open" so no early frame is lost.
      const peer = new WebSocketPeer(socket);
      socket.once("open", () => resolve(peer));
      socket.once("unexpected-response", (_req, res) =>
        reject(new Error(`app refused the connection: HTTP ${res.statusCode}`))
      );
      socket.once("error", reject);
    });
  }
}
