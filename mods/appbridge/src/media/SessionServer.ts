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
import { Roomr } from "@fonoster/common";
import * as grpc from "@grpc/grpc-js";
import { HealthImplementation } from "grpc-health-check";

// AppBridge's session endpoint (redesign-roomr 5.3, 5.6, 13.3, 15.2): Session.Connect, one
// stream per call opened by a Roomr node, and grpc.health.v1.Health on the same port. Behind a
// Kubernetes Service; readiness is the health check (NOT_SERVING while draining).

/** Ping interval on each node connection; two missed pings end it (task 5.6). */
export const SESSION_KEEPALIVE_MS = 10_000;

export type SessionServerOptions = {
  /** host:port (default 0.0.0.0:50071). */
  listen?: string;
  /** Keepalive ping interval (default 10 s); the connection dies after 2 unanswered pings. */
  keepaliveMs?: number;
};

export class SessionServer {
  private server?: grpc.Server;
  private readonly health = new HealthImplementation({
    "": "SERVING",
    [Roomr.SESSION_SERVICE_NAME]: "SERVING"
  });
  private boundPort?: number;

  constructor(
    private readonly onStream: (stream: Roomr.SessionServerStream) => void,
    private readonly options: SessionServerOptions = {}
  ) {}

  /** The bound port (after start). */
  get port(): number | undefined {
    return this.boundPort;
  }

  async start(): Promise<number> {
    const keepalive = this.options.keepaliveMs ?? SESSION_KEEPALIVE_MS;
    // Pings every keepalive; no answer within two intervals closes the connection, which
    // cancels its stream and ends the session (2 missed pings). The node pings every 10 s too:
    // grpc-js servers do not police client pings, so no GOAWAY. No max connection age: a stream
    // lives as long as its call (13.3).
    const server = new grpc.Server({
      "grpc.keepalive_time_ms": keepalive,
      "grpc.keepalive_timeout_ms": keepalive * 2,
      "grpc.keepalive_permit_without_calls": 1
    });
    server.addService(Roomr.sessionService(), {
      Connect: (call: Roomr.SessionServerStream) => this.onStream(call)
    });
    this.health.addToServer(server);
    const listen = this.options.listen ?? `0.0.0.0:${Roomr.SESSION_PORT}`;
    this.boundPort = await new Promise<number>((resolve, reject) =>
      server.bindAsync(
        listen,
        grpc.ServerCredentials.createInsecure(),
        (err, port) => (err ? reject(err) : resolve(port))
      )
    );
    this.server = server;
    return this.boundPort;
  }

  /** Readiness fails: the Service stops sending new streams here (SIGTERM). */
  drain() {
    this.health.setStatus("", "NOT_SERVING");
    this.health.setStatus(Roomr.SESSION_SERVICE_NAME, "NOT_SERVING");
  }

  /** Stops serving; open streams are cancelled after `graceMs`. */
  async stop(graceMs = 1000) {
    const server = this.server;
    this.server = undefined;
    if (!server) return;
    await new Promise<void>((resolve) => {
      const timer = setTimeout(() => {
        server.forceShutdown();
        resolve();
      }, graceMs);
      server.tryShutdown(() => {
        clearTimeout(timer);
        resolve();
      });
    });
  }
}
