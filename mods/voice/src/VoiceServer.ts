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
import * as http from "http";
import { Duplex } from "stream";
import { SessionStart } from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import WebSocket from "ws";
import { Session } from "./Session";
import {
  AppBinding,
  hasAppSignature,
  verifyAppSignature,
  verifySignature
} from "./signature";

const logger = getLogger({ service: "voice", filePath: __filename });

export type SessionHandler = (session: Session) => Promise<void> | void;
export type Handler = SessionHandler;

export type VoiceServerOptions = {
  port?: number;
  host?: string;
  /** Path to accept sessions on (default: any). */
  path?: string;
  /** The app's signing secret (default: APP_SIGNING_SECRET). */
  signingSecret?: string;
  /** Turn verification off for local development only; every connection then logs a warning. */
  verifySignature?: boolean;
  /**
   * The app's URL as configured in Fonoster (one or more). When set, signatures are checked
   * against it only, never against a URL built from the request's Host header. Set it whenever
   * a proxy changes the host or scheme, and always for a server several apps share.
   */
  publicUrl?: string | string[];
  /**
   * Require the app-bound signature (X-Fonoster-App-Signature): a connection without it is
   * refused, and session.start must be for the app it was signed for. For a server several apps
   * share one secret with, such as the hosted Autopilot.
   */
  requireAppBinding?: boolean;
  /** How long to wait for session.start after the socket opens (default 5 s). */
  startTimeoutMs?: number;
};

/**
 * Accepts AppBridge sessions over WebSocket and runs the handler once per session
 * (voice-sdk, "VoiceServer accepts AppBridge sessions over WebSocket").
 */
export class VoiceServer {
  private wss = new WebSocket.Server({ noServer: true });
  private server?: http.Server;
  private handler?: Handler;
  private readonly secret?: string;
  private readonly verify: boolean;

  constructor(private readonly options: VoiceServerOptions = {}) {
    this.secret = options.signingSecret ?? process.env.APP_SIGNING_SECRET;
    this.verify = options.verifySignature ?? true;
    if (this.verify && !this.secret) {
      throw new Error(
        "VoiceServer needs signingSecret (or APP_SIGNING_SECRET), or verifySignature: false"
      );
    }
  }

  /** Starts a standalone server. Resolves once it is listening. */
  async listen(handler: Handler): Promise<this> {
    this.handler = handler;
    this.server = http.createServer((_req, res) =>
      res.writeHead(426).end("WebSocket required")
    );
    this.server.on("upgrade", (req, socket, head) =>
      this.handleUpgrade(req, socket, head)
    );
    await new Promise<void>((resolve) =>
      this.server!.listen(
        this.options.port ?? 3000,
        this.options.host ?? "0.0.0.0",
        resolve
      )
    );
    logger.info(`voice server listening on ${this.options.port ?? 3000}`);
    return this;
  }

  /** Mounts on an existing HTTP server (Express included): sessions arrive on `path`. */
  attach(server: http.Server, handler: Handler): this {
    this.handler = handler;
    server.on("upgrade", (req, socket, head) => {
      if (this.options.path && req.url?.split("?")[0] !== this.options.path)
        return;
      this.handleUpgrade(req, socket, head);
    });
    return this;
  }

  get port(): number | undefined {
    const address = this.server?.address();
    return typeof address === "object" && address ? address.port : undefined;
  }

  async close() {
    for (const client of this.wss.clients) client.terminate();
    await new Promise<void>((r) =>
      this.server ? this.server.close(() => r()) : r()
    );
  }

  /** Handles one upgrade request: verifies the signature, then runs a session. */
  handleUpgrade(req: http.IncomingMessage, socket: Duplex, head: Buffer) {
    if (this.options.path && req.url?.split("?")[0] !== this.options.path) {
      socket.end("HTTP/1.1 404 Not Found\r\n\r\n");
      return;
    }
    let binding: AppBinding | undefined;
    if (this.verify) {
      const urls = this.candidateUrls(req);
      // The app-bound signature when AppBridge sent one (or it is required); a bad one is
      // refused even if the URL-only signature matches.
      const bound =
        this.options.requireAppBinding || hasAppSignature(req.headers)
          ? verifyAppSignature(urls, req.headers, this.secret!)
          : undefined;
      const result = bound ?? verifySignature(urls, req.headers, this.secret!);
      if (!result.ok) {
        logger.warn(
          `rejected a session connection: ${bound ? "app " : ""}signature ${result.reason}`
        );
        socket.end("HTTP/1.1 401 Unauthorized\r\n\r\n");
        return;
      }
      binding = bound?.binding;
    } else {
      logger.warn(
        "accepted a session connection without signature verification (development only)"
      );
    }
    this.wss.handleUpgrade(
      req,
      socket as Parameters<WebSocket.Server["handleUpgrade"]>[1],
      head,
      (ws) => this.run(ws, binding)
    );
  }

  private candidateUrls(req: http.IncomingMessage): string[] {
    const configured = this.options.publicUrl;
    if (configured)
      return Array.isArray(configured) ? configured : [configured];
    const host = req.headers["x-forwarded-host"] ?? req.headers.host;
    // An app URL without a path (ws://autopilot:3000) arrives as "/": accept both spellings.
    const paths = req.url === "/" ? ["/", ""] : [req.url];
    return ["ws", "wss"].flatMap((scheme) =>
      paths.map((p) => `${scheme}://${host}${p}`)
    );
  }

  private run(ws: WebSocket, binding?: AppBinding) {
    let session: Session | undefined;
    let refused = false;
    const timer = setTimeout(() => {
      if (!session) ws.close(1008, "no session.start");
    }, this.options.startTimeoutMs ?? 5000);

    ws.on("message", (raw: WebSocket.Data, isBinary: boolean) => {
      const data = raw as Buffer;
      if (session) return session.receive(data, isBinary);
      if (isBinary || refused) return;
      let start: SessionStart;
      try {
        start = JSON.parse(data.toString());
      } catch {
        return;
      }
      if (start.type !== "session.start") return;
      clearTimeout(timer);
      // A signature made for one app never opens a session for another.
      if (binding && start.appRef !== binding.appRef) {
        logger.warn("rejected a session: session.start names another app", {
          signedFor: binding.appRef,
          appRef: start.appRef
        });
        refused = true;
        ws.close(1008, "session.start does not match the signed app");
        return;
      }
      session = new Session(
        start,
        {
          sendJson: (m) =>
            ws.readyState === WebSocket.OPEN && ws.send(JSON.stringify(m)),
          sendBinary: (b) =>
            ws.readyState === WebSocket.OPEN && ws.send(b, { binary: true }),
          close: () => ws.readyState === WebSocket.OPEN && ws.close(1000)
        },
        binding
      );
      void this.invoke(session);
    });
    ws.on("close", () => {
      clearTimeout(timer);
      session?.closed();
    });
    ws.on("error", () => undefined);
  }

  private async invoke(session: Session) {
    const handler = this.handler!;
    try {
      await handler(session);
    } catch (e) {
      if (session.ended) return;
      // An app that crashes hangs up the call rather than leaving the caller in silence.
      logger.error(`voice handler failed: ${(e as Error).message}`);
      await session.hangup().catch(() => undefined);
    }
  }
}
