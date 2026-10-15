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
import { IncomingMessage } from "http";
import { AddressInfo } from "net";
import WebSocket from "ws";
import { WebSocketPeer } from "../runner/Peer";
import { verify } from "./signature";

export type FakeAppOptions = {
  host?: string;
  port?: number;
  path?: string;
  /** When set, connections whose signature does not verify are refused with HTTP 401. */
  signingSecret?: string;
  verifySignature?: boolean;
};

export type AppConnection = {
  peer: WebSocketPeer;
  url: string;
  headers: IncomingMessage["headers"];
  at: number;
};

export type ConnectionAttempt = {
  at: number;
  url: string;
  accepted: boolean;
  reason?: string;
};

/**
 * Plays the app side of the session protocol. The gateway dials apps (voice-session VS6), so the
 * fake app is a WebSocket server: each accepted connection becomes a peer the runner drives.
 */
export class FakeApp {
  readonly attempts: ConnectionAttempt[] = [];
  /** Every accepted connection, in order (pending or already handed out). */
  readonly connections: AppConnection[] = [];
  private server?: WebSocket.Server;
  private pending: AppConnection[] = [];
  private waiting: ((c: AppConnection) => void)[] = [];
  private host: string;
  private path: string;

  constructor(private readonly options: FakeAppOptions = {}) {
    this.host = options.host ?? "127.0.0.1";
    this.path = options.path ?? "/session";
  }

  /** The URL to configure as the app's WebSocket URL. */
  get url(): string {
    const address = this.server?.address() as AddressInfo | undefined;
    if (!address) throw new Error("FakeApp is not listening");
    return `ws://${this.host}:${address.port}${this.path}`;
  }

  async start(): Promise<this> {
    this.server = new WebSocket.Server({
      host: this.host,
      port: this.options.port ?? 0,
      path: this.path,
      verifyClient: (info, done) => this.verifyClient(info.req, done)
    });
    await new Promise<void>((resolve, reject) => {
      this.server!.once("listening", resolve);
      this.server!.once("error", reject);
    });
    this.server.on("connection", (socket, req) => {
      const connection: AppConnection = {
        peer: new WebSocketPeer(socket),
        url: this.requestUrl(req),
        headers: req.headers,
        at: Date.now()
      };
      this.connections.push(connection);
      const waiter = this.waiting.shift();
      if (waiter) waiter(connection);
      else this.pending.push(connection);
    });
    return this;
  }

  /** Changes signature checking at run time (e.g. to simulate a rotated secret). */
  configure(
    options: Pick<FakeAppOptions, "signingSecret" | "verifySignature">
  ) {
    Object.assign(this.options, options);
  }

  /** Resolves with the next accepted connection. */
  nextConnection(timeoutMs = 5000): Promise<AppConnection> {
    const ready = this.pending.shift();
    if (ready) return Promise.resolve(ready);
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.waiting = this.waiting.filter((w) => w !== waiter);
        reject(
          new Error(`no connection reached the fake app within ${timeoutMs} ms`)
        );
      }, timeoutMs);
      const waiter = (c: AppConnection) => {
        clearTimeout(timer);
        resolve(c);
      };
      this.waiting.push(waiter);
    });
  }

  async stop() {
    for (const client of this.server?.clients ?? []) client.terminate();
    await new Promise<void>((resolve) =>
      this.server ? this.server.close(() => resolve()) : resolve()
    );
    this.server = undefined;
  }

  private requestUrl(req: IncomingMessage): string {
    return `ws://${req.headers.host}${req.url}`;
  }

  private verifyClient(
    req: IncomingMessage,
    done: (ok: boolean, code?: number, message?: string) => void
  ) {
    const url = this.requestUrl(req);
    const { signingSecret, verifySignature } = this.options;
    if (verifySignature && signingSecret) {
      const result = verify(url, req.headers, signingSecret);
      if (!result.ok) {
        this.attempts.push({
          at: Date.now(),
          url,
          accepted: false,
          reason: result.reason
        });
        return done(false, 401, "Unauthorized");
      }
    }
    this.attempts.push({ at: Date.now(), url, accepted: true });
    done(true);
  }
}
