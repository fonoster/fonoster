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
import { RecordEntry } from "@fonoster/callrecord";
import { Webhooks } from "@fonoster/common";
import { FakesHarness } from "@fonoster/conformance";
import { getLogger } from "@fonoster/logger";
import { expect } from "chai";
import { NatsConnection, StringCodec } from "nats";
import {
  Admission,
  AppBridge,
  AppConfig,
  MemoryCallRecordSink,
  WORKSPACE_CHECK_TIMEOUT_MS,
  WorkspaceDeletionCheck
} from "../src";

// voice-session "Calls to a deleted workspace are refused" (#1318): before admission AppBridge
// asks `workspaces.deleted` and rejects the call with 404 when the apiserver says the app's
// workspace was deleted. No answer admits the call. The apiserver is a fake behind the NATS
// connection's request; the Roomr node, the app and the providers are the conformance fakes.

const sc = StringCodec();
const NATS_URL = process.env.CONFORMANCE_NATS_URL;

type Answer =
  { reply: unknown } | { raw: string } | { fail: "timeout" | "no responders" };

/** A NATS connection whose only working call is the `workspaces.deleted` request. */
function fakeNats(answer: () => Answer) {
  const requests: { subject: string; body: unknown; timeout?: number }[] = [];
  const nc = {
    subscribe: () => ({ unsubscribe() {} }),
    publish() {},
    flush: async () => {},
    request: async (
      subject: string,
      data: Uint8Array,
      opts?: { timeout?: number }
    ) => {
      requests.push({
        subject,
        body: JSON.parse(sc.decode(data)),
        timeout: opts?.timeout
      });
      const a = answer();
      if ("fail" in a) {
        if (a.fail === "timeout") {
          // nats.js rejects with code TIMEOUT once the request's timeout passes.
          await new Promise((r) => setTimeout(r, opts?.timeout));
          throw Object.assign(new Error("TIMEOUT"), { code: "TIMEOUT" });
        }
        throw Object.assign(new Error("503"), { code: "503" });
      }
      return {
        data: sc.encode("raw" in a ? a.raw : JSON.stringify(a.reply))
      };
    }
  } as unknown as NatsConnection;
  return { nc, requests };
}

describe("@appbridge calls to a deleted workspace (#1318)", function () {
  this.timeout(20000);
  let harness: FakesHarness;
  let appbridge: AppBridge | undefined;
  let webhooks: Webhooks.WebhookEvent[];
  let record: MemoryCallRecordSink;
  let admitted: string[];
  let warned: string[];
  const logger = getLogger({ service: "appbridge", filePath: __filename });
  const warn = logger.warn;

  before(function () {
    // The fake Roomr node (roomr-fake) reports over NATS, as in the other AppBridge suites.
    if (!NATS_URL) this.skip();
  });

  beforeEach(() => {
    warned = [];
    logger.warn = (message: unknown, ...rest: unknown[]) => {
      warned.push(String(message));
      return warn.call(logger, message, ...rest);
    };
  });

  afterEach(async () => {
    logger.warn = warn;
    await appbridge?.stop();
    appbridge = undefined;
    await harness?.stop();
  });

  async function start(answer: () => Answer, workspaceRef?: string) {
    harness = await new FakesHarness().start();
    webhooks = [];
    admitted = [];
    record = new MemoryCallRecordSink();
    const app: AppConfig = {
      ref: "agent-a",
      url: harness.app.url,
      protocol: "fonoster",
      signingSecret: "s",
      workspaceRef,
      speech: { voice: "fake/default", language: "en-US" }
    };
    const admission: Admission = async (req) => {
      admitted.push(req.callRef);
      return { authorized: true };
    };
    const urls = harness.providerUrls;
    const { nc, requests } = fakeNats(answer);
    appbridge = await new AppBridge({
      config: {
        nats: { url: "nats://unused:4222" },
        session: { listen: "127.0.0.1:0" },
        apps: [app],
        providers: {
          fake: {
            adapter: "fake",
            capabilities: ["tts", "stt"],
            tts: { url: urls.tts },
            stt: { url: urls.stt }
          }
        }
      },
      nats: nc,
      sessions: false,
      record,
      admission,
      webhooks: (e) => webhooks.push(e)
    }).start();
    harness.roomrNode.configure({ endpoint: appbridge.sessionEndpoint });
    return requests;
  }

  const until = async (cond: () => boolean, ms = 4000) => {
    const end = Date.now() + ms;
    while (!cond()) {
      if (Date.now() > end) throw new Error("timed out");
      await new Promise((r) => setTimeout(r, 20));
    }
  };

  const offer = async () =>
    (await harness.roomrNode.offerCall({ appRef: "agent-a" })).callRef;

  /** The call reached admission and the app, and was answered. */
  async function runs(callRef: string) {
    await harness.app.nextConnection();
    await until(() => harness.roomrNode.sipStatuses(callRef).includes(200));
    expect(admitted).to.include(callRef);
    harness.roomrNode.callerHangup(callRef);
  }

  const messages = (callRef: string) =>
    (record.records.get(callRef) ?? []).map(
      (e: RecordEntry) => e.message as Record<string, unknown>
    );

  it("[APB-048] rejects a call to a deleted workspace with 404 before admission and the app, and sends call.failed", async function () {
    const requests = await start(() => ({ reply: { deleted: true } }), "WO-A");
    const callRef = await offer();
    await until(() => harness.roomrNode.sipStatuses(callRef).includes(404));
    expect(harness.roomrNode.sipStatuses(callRef)).to.not.include(200);
    expect(harness.app.attempts).to.have.length(0);
    expect(admitted).to.deep.equal([]);
    expect(requests).to.deep.equal([
      {
        subject: "workspaces.deleted",
        body: { accessKeyId: "WO-A" },
        timeout: WORKSPACE_CHECK_TIMEOUT_MS
      }
    ]);
    expect(WORKSPACE_CHECK_TIMEOUT_MS).to.equal(300);
    await until(() => messages(callRef).some((m) => m.type === "call.failed"));
    // A minimal record, as for any refused call: call.started, then call.failed with the reason.
    const [started, failedEntry] = messages(callRef);
    expect(started).to.include({ type: "call.started", workspaceRef: "WO-A" });
    expect(failedEntry).to.include({
      type: "call.failed",
      reason: "workspace_deleted"
    });
    const failed = webhooks.find((e) => e.type === "call.failed");
    expect(failed?.workspaceRef).to.equal("WO-A");
    expect((failed?.data as { reason: string }).reason).to.equal(
      "workspace_deleted"
    );
  });

  it("[APB-048] refuses a second call within 60 s without asking again", async function () {
    const requests = await start(() => ({ reply: { deleted: true } }), "WO-A");
    const first = await offer();
    await until(() => harness.roomrNode.sipStatuses(first).includes(404));
    const second = await offer();
    await until(() => harness.roomrNode.sipStatuses(second).includes(404));
    expect(requests).to.have.length(1);
  });

  it("[APB-048] admits a call to a live workspace and asks again on the next call", async function () {
    const requests = await start(() => ({ reply: { deleted: false } }), "WO-A");
    await runs(await offer());
    await runs(await offer());
    expect(requests).to.have.length(2);
    expect(warned.filter((m) => m.includes("workspace check"))).to.deep.equal(
      []
    );
  });

  it("[APB-048] admits the call when the apiserver doesn't answer within 300 ms, and logs it", async function () {
    await start(() => ({ fail: "timeout" }), "WO-A");
    const callRef = await offer();
    await runs(callRef);
    expect(
      warned.find((m) =>
        m.startsWith(`call ${callRef}: admitted without a workspace check`)
      )
    ).to.match(/no answer in 300 ms/);
  });

  it("[APB-048] admits the call on an error, no responders or a malformed reply, and logs it", async function () {
    const answers: Answer[] = [
      { reply: { error: "directory unavailable" } },
      { fail: "no responders" },
      { raw: "not json" },
      { reply: { deleted: "yes" } }
    ];
    await start(() => answers.shift()!, "WO-A");
    for (const reason of [
      /directory unavailable/,
      /no responders/,
      /malformed reply/,
      /malformed reply/
    ]) {
      const callRef = await offer();
      await runs(callRef);
      expect(
        warned.find((m) =>
          m.startsWith(`call ${callRef}: admitted without a workspace check`)
        )
      ).to.match(reason);
    }
  });

  it("[APB-048] makes no request for an app without a workspace", async function () {
    const requests = await start(() => ({ reply: { deleted: true } }));
    await runs(await offer());
    expect(requests).to.deep.equal([]);
  });
});

describe("@appbridge WorkspaceDeletionCheck (#1318)", function () {
  it("[APB-048] keeps a deleted answer for 60 s and never keeps a live one", async function () {
    let now = 0;
    let deleted = true;
    let asked = 0;
    const nc = {
      request: async () => {
        asked++;
        return { data: sc.encode(JSON.stringify({ deleted })) };
      }
    } as unknown as NatsConnection;
    const check = new WorkspaceDeletionCheck(nc, () => now);
    expect(await check.check("WO-A")).to.deep.equal({ deleted: true });
    now = 59_999;
    expect(await check.check("WO-A")).to.deep.equal({ deleted: true });
    expect(asked).to.equal(1);
    now = 60_000;
    deleted = false;
    expect(await check.check("WO-A")).to.deep.equal({ deleted: false });
    expect(await check.check("WO-A")).to.deep.equal({ deleted: false });
    expect(asked).to.equal(3);
  });
});
