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
import { AddressInfo } from "net";
import { ProviderBehavior, ProviderFailure } from "../../scenario/types";
import { ProviderLedger } from "./ProviderLedger";

export const FAILURE_STATUS: Record<ProviderFailure, number> = {
  provider_unavailable: 503,
  bad_request: 400,
  provider_timeout: 0
};

/** Shared plumbing for the HTTP-based fakes: lifecycle, behaviour, request counting. */
export abstract class FakeProvider {
  requests = 0;
  protected behavior: ProviderBehavior = {};
  protected server?: http.Server;
  private held = new Set<http.ServerResponse>();

  constructor(
    readonly name: string,
    readonly ledger: ProviderLedger = new ProviderLedger()
  ) {}

  /** Replaces delay and script; failNext applies to the next request only. */
  configure(behavior: ProviderBehavior) {
    this.behavior = { ...this.behavior, ...behavior };
  }

  get url(): string {
    const address = this.server?.address() as AddressInfo | undefined;
    if (!address) throw new Error(`${this.name} is not listening`);
    return `http://127.0.0.1:${address.port}`;
  }

  async start(port = 0): Promise<this> {
    this.server = http.createServer((req, res) => this.onRequest(req, res));
    this.onServer(this.server);
    await new Promise<void>((resolve) =>
      this.server!.listen(port, "127.0.0.1", resolve)
    );
    return this;
  }

  async stop() {
    for (const res of this.held) res.destroy();
    this.held.clear();
    // Do not wait for keep-alive or aborted connections (Node >= 18.2).
    (
      this.server as http.Server & { closeAllConnections?: () => void }
    )?.closeAllConnections?.();
    await new Promise<void>((resolve) =>
      this.server ? this.server.close(() => resolve()) : resolve()
    );
    this.server = undefined;
  }

  /** Hook for subclasses that also serve WebSockets on the same port. */
  protected onServer(_server: http.Server) {}

  protected abstract serve(
    req: http.IncomingMessage,
    body: unknown,
    res: http.ServerResponse
  ): Promise<void>;

  /** Takes the pending one-shot failure, if any. */
  protected takeFailure(): ProviderFailure | undefined {
    const failure = this.behavior.failNext;
    if (failure) this.behavior = { ...this.behavior, failNext: undefined };
    return failure;
  }

  /** Waits the configured delay and records it in the ledger. */
  protected async delay() {
    const ms = this.behavior.delayMs ?? 0;
    if (ms <= 0) return;
    const interval = this.ledger.open(this.name);
    await new Promise((r) => setTimeout(r, ms));
    this.ledger.close(interval);
  }

  protected json(res: http.ServerResponse, status: number, body: unknown) {
    res.writeHead(status, { "content-type": "application/json" });
    res.end(JSON.stringify(body));
  }

  private async onRequest(req: http.IncomingMessage, res: http.ServerResponse) {
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(chunk as Buffer);
    let body: unknown = undefined;
    if (chunks.length) {
      try {
        body = JSON.parse(Buffer.concat(chunks).toString());
      } catch {
        return this.json(res, 400, {
          error: { code: "bad_request", message: "body is not JSON" }
        });
      }
    }

    this.requests++;
    const failure = this.takeFailure();
    if (failure === "provider_timeout") {
      // Hold the request open: the caller's own timeout must fire. The hold counts as provider time.
      const interval = this.ledger.open(this.name);
      this.held.add(res);
      res.on("close", () => {
        this.held.delete(res);
        this.ledger.close(interval);
      });
      return;
    }
    if (failure) {
      return this.json(res, FAILURE_STATUS[failure], {
        error: { code: failure, message: `injected ${failure}` }
      });
    }

    try {
      await this.serve(req, body, res);
    } catch (e) {
      if (!res.headersSent)
        this.json(res, 500, {
          error: { code: "internal", message: (e as Error).message }
        });
      else res.destroy();
    }
  }
}
