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
import * as grpc from "@grpc/grpc-js";
import { expect } from "chai";
import { connect, NatsConnection } from "nats";
import { createServiceDefinition, Webhooks } from "@fonoster/common";
import { FakesHarness } from "@fonoster/conformance";
import { getLogger } from "@fonoster/logger";
import {
  Admission,
  AdmissionDecision,
  AppBridge,
  AppConfig,
  grpcAdmission
} from "../src";

// Calls are admitted before they start (add-billing-service D7, voice-session "Calls are admitted
// before they start"), against a fake Authz service and the fake Roomr node. Needs NATS. The rule
// itself (a late or failed answer admits) is unit-tested in admit.test.ts.
const NATS_URL = process.env.CONFORMANCE_NATS_URL;

const request = {
  callRef: "call-1",
  appRef: "agent-a",
  workspaceRef: "WO-A",
  direction: "inbound" as const,
  origin: "call" as const,
  from: "+15551230000",
  to: "+15559870000"
};

const answerAfter =
  (ms: number, decision: AdmissionDecision): Admission =>
  () =>
    new Promise((r) => setTimeout(() => r(decision), ms));

describe("@appbridge admission (add-billing-service)", function () {
  describe("grpcAdmission", function () {
    let server: grpc.Server;
    let seen: Record<string, unknown> | undefined;

    before(async () => {
      server = new grpc.Server();
      server.addService(
        createServiceDefinition({
          serviceName: "Authz",
          pckg: "authz",
          proto: "authz.proto",
          version: "v1beta2"
        }),
        {
          checkSessionAuthorized: (
            call: grpc.ServerUnaryCall<Record<string, unknown>, unknown>,
            cb: grpc.sendUnaryData<unknown>
          ) => {
            seen = call.request;
            cb(null, { authorized: false, reason: "concurrency_limit" });
          }
        }
      );
      const port = await new Promise<number>((resolve, reject) =>
        server.bindAsync(
          "127.0.0.1:0",
          grpc.ServerCredentials.createInsecure(),
          (e, p) => (e ? reject(e) : resolve(p))
        )
      );
      process.env.ADMISSION_TEST_PORT = String(port);
    });
    after(() => server.forceShutdown());

    it("[APB-036] asks CheckSessionAuthorized and returns the reason", async function () {
      const admission = grpcAdmission(
        `127.0.0.1:${process.env.ADMISSION_TEST_PORT}`
      );
      expect(
        await admission({ ...request, origin: "browser_test" })
      ).to.deep.equal({
        authorized: false,
        reason: "concurrency_limit"
      });
      expect(seen).to.include({
        accessKeyId: "WO-A",
        appRef: "agent-a",
        callRef: "call-1",
        callDirection: "INTRA_NETWORK"
      });
      admission.close?.();
    });
  });

  describe("AppBridge end to end", function () {
    let nc: NatsConnection;
    let harness: FakesHarness;
    let appbridge: AppBridge | undefined;
    let webhooks: Webhooks.WebhookEvent[];

    before(async function () {
      if (!NATS_URL) return this.skip();
      nc = await connect({ servers: NATS_URL });
    });
    after(async () => nc?.close());

    async function start(admission: Admission) {
      harness = await new FakesHarness().start();
      webhooks = [];
      const app: AppConfig = {
        ref: "agent-a",
        url: harness.app.url,
        protocol: "fonoster",
        signingSecret: "s",
        workspaceRef: "WO-A",
        speech: { voice: "fake/default", language: "en-US" }
      };
      const urls = harness.providerUrls;
      appbridge = await new AppBridge({
        config: {
          nats: { url: NATS_URL! },
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
        admission,
        webhooks: (e) => webhooks.push(e)
      }).start();
      harness.roomrNode.configure({ endpoint: appbridge.sessionEndpoint });
    }

    afterEach(async () => {
      await appbridge?.stop();
      appbridge = undefined;
      await harness?.stop();
    });

    const until = async (cond: () => boolean, ms = 4000) => {
      const end = Date.now() + ms;
      while (!cond()) {
        if (Date.now() > end) throw new Error("timed out");
        await new Promise((r) => setTimeout(r, 20));
      }
    };

    it("[APB-036] rejects a call out of credits with 402 before it is answered, and sends call.failed", async function () {
      await start(
        answerAfter(0, { authorized: false, reason: "insufficient_balance" })
      );
      const { callRef } = await harness.roomrNode.offerCall({
        appRef: "agent-a"
      });
      await until(() => harness.roomrNode.sipStatuses(callRef).includes(402));
      // Rejected before it is answered: a 180 Ringing may come first, a 200 never.
      expect([[402], [180, 402]]).to.deep.include(
        harness.roomrNode.sipStatuses(callRef)
      );
      expect(harness.app.attempts).to.have.length(0);
      const failed = webhooks.find((e) => e.type === "call.failed");
      expect(failed?.workspaceRef).to.equal("WO-A");
      expect((failed?.data as { reason: string }).reason).to.equal(
        "insufficient_balance"
      );
    });

    it("[APB-036] rejects a call over the concurrency limit with 503", async function () {
      await start(
        answerAfter(0, { authorized: false, reason: "concurrency_limit" })
      );
      const { callRef } = await harness.roomrNode.offerCall({
        appRef: "agent-a"
      });
      await until(() => harness.roomrNode.sipStatuses(callRef).includes(503));
    });

    it("[APB-036] admits and answers a call when authorization is slower than 500 ms, and logs the timeout", async function () {
      const logger = getLogger({ service: "appbridge", filePath: __filename });
      const warned: string[] = [];
      const warn = logger.warn;
      logger.warn = (message: unknown, ...rest: unknown[]) => {
        warned.push(String(message));
        return warn.call(logger, message, ...rest);
      };
      try {
        await start(
          answerAfter(2000, {
            authorized: false,
            reason: "insufficient_balance"
          })
        );
        const startedAt = Date.now();
        const { callRef } = await harness.roomrNode.offerCall({
          appRef: "agent-a"
        });
        await harness.app.nextConnection();
        await until(() => harness.roomrNode.sipStatuses(callRef).includes(200));
        // Admitted at the timeout, not when the late refusal arrives.
        expect(Date.now() - startedAt).to.be.below(1800);
        expect(
          warned.find((m) => m.includes(`call ${callRef}: admitted without`))
        ).to.match(/no answer in 500 ms/);
        harness.roomrNode.callerHangup(callRef);
      } finally {
        logger.warn = warn;
      }
    });
  });
});
