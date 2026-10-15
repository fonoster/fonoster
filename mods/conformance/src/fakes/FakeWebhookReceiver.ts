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

export type ReceivedWebhook = {
  at: number;
  headers: http.IncomingHttpHeaders;
  body: string;
  json: Record<string, unknown>;
};

/**
 * A webhook receiver for workspace-webhook suites (add-workspace-webhooks task 1.1): records every
 * request and answers with scripted status codes and delays.
 */
export class FakeWebhookReceiver {
  readonly received: ReceivedWebhook[] = [];
  private server?: http.Server;
  private script: { status: number; delayMs?: number }[] = [];

  /** Next responses, in order; after the script runs out, every request gets 200. */
  respond(...steps: { status: number; delayMs?: number }[]) {
    this.script.push(...steps);
  }

  get url(): string {
    const a = this.server?.address() as AddressInfo | undefined;
    if (!a) throw new Error("receiver is not listening");
    return `http://127.0.0.1:${a.port}/hooks`;
  }

  async start(): Promise<this> {
    this.server = http.createServer(async (req, res) => {
      const chunks: Buffer[] = [];
      for await (const c of req) chunks.push(c as Buffer);
      const body = Buffer.concat(chunks).toString();
      let json: Record<string, unknown> = {};
      try {
        json = JSON.parse(body);
      } catch {
        // recorded as is
      }
      this.received.push({ at: Date.now(), headers: req.headers, body, json });
      const step = this.script.shift() ?? { status: 200 };
      if (step.delayMs) await new Promise((r) => setTimeout(r, step.delayMs));
      res.writeHead(step.status).end();
    });
    await new Promise<void>((r) => this.server!.listen(0, "127.0.0.1", r));
    return this;
  }

  async stop() {
    this.server?.closeAllConnections?.();
    await new Promise<void>((r) =>
      this.server ? this.server.close(() => r()) : r()
    );
  }
}
