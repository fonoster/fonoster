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
import { AppConfig } from "../config";
import { signatureHeaders } from "../signing";

export type ConnectFailure = { at: number; url: string; reason: string };

function attempt(app: AppConfig, timeoutMs: number): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(app.url, {
      headers: signatureHeaders(app.url, app.signingSecret),
      handshakeTimeout: timeoutMs
    });
    // The app may send frames right after the handshake; buffer them until the session listens.
    socket.once("open", () => resolve(socket));
    socket.once("unexpected-response", (_req, res) => {
      socket.terminate();
      reject(new Error(`HTTP ${res.statusCode}`));
    });
    socket.once("error", (e) => reject(e));
  });
}

/**
 * Dials the app, retrying for the window (about 2–3 s, G6) while the caller keeps hearing ringing.
 * Resolves with the open socket, or rejects after the window with every failure recorded.
 */
export async function connectApp(
  app: AppConfig,
  options: {
    windowMs: number;
    intervalMs: number;
    onFailure: (f: ConnectFailure) => void;
  }
): Promise<WebSocket> {
  const deadline = Date.now() + options.windowMs;
  let last = "";
  for (;;) {
    const remaining = deadline - Date.now();
    try {
      return await attempt(app, Math.max(250, remaining));
    } catch (e) {
      last = (e as Error).message;
      options.onFailure({ at: Date.now(), url: app.url, reason: last });
    }
    if (Date.now() + options.intervalMs > deadline) break;
    await new Promise((r) => setTimeout(r, options.intervalMs));
  }
  throw new Error(`app ${app.ref} unreachable at ${app.url}: ${last}`);
}
