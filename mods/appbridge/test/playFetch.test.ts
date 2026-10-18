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
import http from "http";
import { AddressInfo } from "net";
import { expect } from "chai";
import {
  defaultFetch,
  OutputQueue,
  PLAY_FETCH_LIMITS
} from "../src/session/OutputQueue";

// M13: media an app asks to play is fetched like any tenant-chosen URL:
// public destinations only, a size cap, a timeout and few redirects.

const signal = () => new AbortController().signal;

async function refused(url: string) {
  try {
    await defaultFetch(url, signal());
  } catch (e) {
    return (e as Error).message;
  }
  throw new Error(`fetched ${url}`);
}

describe("@gateway[play fetch]", function () {
  let server: http.Server;
  let base: string;
  let saved: string | undefined;

  before(async function () {
    server = http.createServer((req, res) => {
      if (req.url === "/big") {
        res.writeHead(200, { "content-type": "audio/wav" });
        res.end(Buffer.alloc(PLAY_FETCH_LIMITS.maxBytes + 1024));
      } else if (req.url === "/to-metadata") {
        res.writeHead(302, { location: "http://169.254.169.254/latest" });
        res.end();
      } else {
        res.writeHead(200, { "content-type": "audio/wav" });
        res.end(Buffer.alloc(64));
      }
    });
    await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    saved = process.env.FONOSTER_ALLOWED_DESTINATIONS;
  });

  afterEach(function () {
    if (saved === undefined) delete process.env.FONOSTER_ALLOWED_DESTINATIONS;
    else process.env.FONOSTER_ALLOWED_DESTINATIONS = saved;
  });

  after(() => new Promise<void>((r) => server.close(() => r())));

  it("refuses private, loopback and metadata addresses", async function () {
    delete process.env.FONOSTER_ALLOWED_DESTINATIONS;
    for (const url of [
      `${base}/ok`,
      "http://169.254.169.254/latest/meta-data/",
      "http://10.0.0.1/x.wav",
      "http://[::1]/x.wav",
      "http://localhost/x.wav",
      "file:///etc/passwd"
    ])
      expect(await refused(url)).to.match(/non-public|internal|scheme/);
  });

  it("fetches an allow-listed destination", async function () {
    process.env.FONOSTER_ALLOWED_DESTINATIONS = "127.0.0.1";
    expect((await defaultFetch(`${base}/ok`, signal())).length).to.equal(64);
  });

  it("caps the size", async function () {
    process.env.FONOSTER_ALLOWED_DESTINATIONS = "127.0.0.1";
    expect(await refused(`${base}/big`)).to.match(/too large/);
  });

  it("re-checks redirects", async function () {
    process.env.FONOSTER_ALLOWED_DESTINATIONS = "127.0.0.1";
    expect(await refused(`${base}/to-metadata`)).to.match(/non-public/);
  });

  it("reports a refused play to the app", async function () {
    delete process.env.FONOSTER_ALLOWED_DESTINATIONS;
    const events: Record<string, unknown>[] = [];
    const queue = new OutputQueue({
      sink: () => undefined,
      emit: (e) => events.push(e as unknown as Record<string, unknown>),
      maxQueuedMs: 1000
    });
    queue.play({
      id: "p1",
      url: "http://169.254.169.254/latest/meta-data/",
      loop: false,
      interruptible: true,
      preempt: false
    });
    await new Promise((r) => setTimeout(r, 50));
    expect(events[0]).to.include({
      code: "play_fetch_failed",
      relatesTo: "p1"
    });
  });
});
