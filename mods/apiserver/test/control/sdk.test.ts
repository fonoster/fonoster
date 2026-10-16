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
import {
  createTestDb,
  TestDb,
  testDatabaseUrl
} from "../../../common/test/persistence/testDb";
// This worktree's protos, whatever copy of @fonoster/common other suites loaded first.
import { createServiceDefinition } from "../../../common/src/utils/createService";
import * as SDK from "../../../sdk/src/node";
import { buildApplicationsService } from "../../src/applications";
import { buildProvidersService } from "../../src/providers";
import { buildWebhooksService } from "../../src/webhooks";
import { TEST_TOKEN } from "../utils";

// The SDK against a real gRPC server running the control-plane services over a throwaway
// Postgres (PERSISTENCE_TEST_DATABASE_URL): proto, handlers and SDK mapping end to end.

const WS = "GRahn02s8tgdfghz72vb0fz538qpb5z35p";

describe("@control: SDK end to end (gRPC + database)", function () {
  this.timeout(120_000);
  let db: TestDb;
  let server: grpc.Server;
  let client: SDK.Client;

  before(async function () {
    if (!testDatabaseUrl()) return this.skip();
    // In the full suite another copy of the SDK (the shared node_modules') can register its older
    // generated messages in google-protobuf's global namespace first; run this file alone then.
    // Generated messages serialize through google-protobuf's global `proto` namespace, which
    // the last loaded copy of the SDK owns.
    const g = globalThis as unknown as {
      proto?: {
        fonoster?: {
          applications?: {
            v1beta2?: {
              CreateApplicationRequest?: { prototype: { setUrl?: unknown } };
            };
          };
        };
      };
    };
    require("../../../sdk/src/generated/node/applications_pb");
    if (
      typeof g.proto?.fonoster?.applications?.v1beta2?.CreateApplicationRequest
        ?.prototype.setUrl !== "function"
    )
      return this.skip();
    db = (await createTestDb())!;
    server = new grpc.Server();
    for (const service of [
      buildApplicationsService(db.prisma, {} as never, {
        autopilotUrl: "ws://autopilot:50061"
      }),
      buildWebhooksService(db.prisma),
      buildProvidersService(db.prisma)
    ])
      server.addService(
        createServiceDefinition(service.definition),
        service.handlers as grpc.UntypedServiceImplementation
      );
    const port = await new Promise<number>((resolve, reject) =>
      server.bindAsync(
        "127.0.0.1:0",
        grpc.ServerCredentials.createInsecure(),
        (err, p) => (err ? reject(err) : resolve(p))
      )
    );
    client = new SDK.Client({
      endpoint: `127.0.0.1:${port}`,
      accessKeyId: WS,
      allowInsecure: true,
      withoutInterceptors: true
    });
    client.setAccessToken(TEST_TOKEN);
  });

  after(async function () {
    server?.forceShutdown();
    await db?.drop();
  });

  it("creates, reads, lists, updates and rotates a session app", async function () {
    const apps = new SDK.Applications(client);
    const created = await apps.createApplication({
      name: "Bot",
      type: "STREAM" as never,
      url: "wss://bot.example.com",
      protocol: "fonoster",
      speech: {
        voice: "elevenlabs/rachel",
        language: "en-US",
        patience: "low"
      },
      audio: { codec: "pcm16", rate: 16000 },
      listeners: [{ url: "wss://l.example.com", tracks: "both" }],
      recording: "on",
      amd: { enabled: true, windowMs: 2000 }
    });
    expect(created.signingSecret).to.have.length.greaterThan(30);

    const app = await apps.getApplication(created.ref);
    expect(app).to.deep.include({
      ref: created.ref,
      name: "Bot",
      type: "STREAM",
      url: "wss://bot.example.com",
      protocol: "fonoster",
      recording: "on",
      amd: { enabled: true, windowMs: 2000 },
      signingSecretHint: created.signingSecretHint,
      audio: { codec: "pcm16", rate: 16000 },
      listeners: [{ url: "wss://l.example.com", tracks: "both" }]
    });
    expect(app.speech).to.include({
      voice: "elevenlabs/rachel",
      language: "en-US",
      patience: "low"
    });
    expect(app).to.not.have.property("signingSecret");

    await apps.updateApplication({
      ref: created.ref,
      name: "Bot 2",
      url: "wss://bot.example.com/2",
      protocol: "twilio"
    });
    const listed = await apps.listApplications({ pageSize: 10 });
    expect(listed.items).to.have.length(1);
    expect(listed.items[0]).to.deep.include({
      name: "Bot 2",
      protocol: "twilio",
      listeners: []
    });

    const rotated = await apps.rotateSigningSecret(created.ref);
    expect(rotated.signingSecret).to.not.equal(created.signingSecret);
    await apps.deleteApplication(created.ref);
  });

  it("manages webhooks", async function () {
    const webhooks = new SDK.Webhooks(client);
    const { ref, secret } = await webhooks.createWebhook({
      url: "https://hooks.example.com",
      events: ["call.ended", "call.started"]
    });
    expect(secret).to.match(/^whsec_/);
    const list = await webhooks.listWebhooks();
    expect(list.items[0]).to.deep.include({
      ref,
      events: ["call.ended", "call.started"]
    });
    const rotated = await webhooks.rotateWebhookSecret(ref);
    expect(rotated.previousSecretUntil).to.be.instanceOf(Date);
    expect(
      (await webhooks.getWebhook(ref)).previousSecretUntil
    ).to.be.instanceOf(Date);
    expect((await webhooks.listWebhookDeliveries()).items).to.deep.equal([]);
    await webhooks.deleteWebhook(ref);
    expect((await webhooks.listWebhooks()).items).to.deep.equal([]);
  });

  it("lists the catalog and manages provider keys", async function () {
    await db.prisma.registryProvider.create({
      data: {
        id: "deepgram",
        adapter: "deepgram",
        capabilities: ["stt"],
        credentialRef: "deepgram-default"
      }
    });
    await db.prisma.registryModel.create({
      data: {
        id: "deepgram/nova-3",
        providerId: "deepgram",
        type: "stt",
        languages: ["en-US"]
      }
    });
    const providers = new SDK.Providers(client);
    const { items } = await providers.listCatalog();
    expect(items).to.deep.include({
      id: "deepgram/nova-3",
      kind: "model",
      state: "active",
      providerId: "deepgram",
      type: "stt",
      languages: ["en-US"],
      capabilities: [],
      features: [],
      models: []
    });
    const key = await providers.setProviderKey({
      providerId: "deepgram",
      key: "secret-key"
    });
    expect(key.providerId).to.equal("deepgram");
    expect((await providers.listProviderKeys()).items).to.have.length(1);
    await providers.deleteProviderKey("deepgram");
    expect((await providers.listProviderKeys()).items).to.deep.equal([]);
  });
});
