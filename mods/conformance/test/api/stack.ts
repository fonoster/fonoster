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
import { execFileSync } from "child_process";
import { generateKeyPairSync, randomBytes } from "crypto";
import { readFileSync } from "fs";
import { AddressInfo, createServer } from "net";
import { join, resolve } from "path";
import { URL } from "url";
import { createAuthInterceptor, parseConfigFile } from "@fonoster/common";
import * as grpc from "@grpc/grpc-js";
import { HealthImplementation } from "grpc-health-check";
import { createTestDb, TestDb } from "../../../common/test/persistence/testDb";
import { PrismaClient } from "../../../identity/src/generated/@prisma/client";

// The API area's unit under test, in this process: the apiserver's own services (Identity among
// them) behind its auth interceptor, on two fresh databases on PERSISTENCE_TEST_DATABASE_URL, with
// the SIP resources stored in the Routr at ROUTR_API_ENDPOINT and the bus on CONFORMANCE_NATS_URL
// (CreateCall publishes there; a case stands in for call placement). A fake SMTP server keeps
// every email Identity sends. The variables are required: without them the run fails, it never
// skips.

const ROOT = resolve(__dirname, "../../../..");
const PRISMA = join(ROOT, "node_modules/.bin/prisma");

type Email = { to: string; data: string };

type Stack = {
  /** host:port of the gRPC server. */
  endpoint: string;
  /** Every email Identity sent, oldest first. */
  emails: Email[];
  /** The apiserver's database, for assertions and for setting up states the API cannot reach. */
  apiDb: TestDb;
  /** Raw SQL on Identity's database (users, workspaces, tokens, codes). */
  identitySql(query: string, ...values: unknown[]): Promise<unknown[]>;
  publicKey: string;
  /** Identity's own Prisma client (field encryption on), for states only an old release wrote. */
  identityPrisma: { user: { update(args: unknown): Promise<unknown> } };
  /** The NATS URL the apiserver uses. */
  natsUrl: string;
  /** Base URL of the HTTP routes the cookie session lives on (/api/session). */
  httpUrl: string;
  /**
   * Another Identity on the same database with part of its configuration changed (sign-in
   * methods, token lifetimes, MFA): a second replica, as far as Identity can tell.
   */
  identityVariant(
    patch: Record<string, unknown>
  ): Promise<{ endpoint: string; stop(): Promise<void> }>;
  stop(): Promise<void>;
};

function required(name: string) {
  const value = process.env[name];
  if (!value)
    throw new Error(
      `${name} is required for the API area (see mods/conformance/catalog/areas/api.md)`
    );
  return value;
}

const freePort = () =>
  new Promise<number>((done, fail) => {
    const server = createServer();
    server.once("error", fail);
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address() as AddressInfo;
      server.close(() => done(port));
    });
  });

/** Just enough SMTP for nodemailer: no auth, no TLS; keeps every message. */
async function startFakeSmtp(emails: Email[]) {
  const server = createServer((socket) => {
    let to = "";
    let data: string[] | undefined;
    let buffer = "";
    socket.write("220 fake-smtp\r\n");
    socket.on("data", (chunk) => {
      buffer += chunk.toString();
      let end: number;
      while ((end = buffer.indexOf("\r\n")) >= 0) {
        const line = buffer.slice(0, end);
        buffer = buffer.slice(end + 2);
        if (data) {
          if (line === ".") {
            emails.push({ to, data: data.join("\n") });
            data = undefined;
            socket.write("250 queued\r\n");
          } else data.push(line);
          continue;
        }
        const command = line.slice(0, 4).toUpperCase();
        if (command === "RCPT") {
          to = line.replace(/^RCPT TO:\s*<?([^>]*)>?.*$/i, "$1");
          socket.write("250 ok\r\n");
        } else if (command === "DATA") {
          data = [];
          socket.write("354 go ahead\r\n");
        } else if (command === "QUIT") socket.end("221 bye\r\n");
        else socket.write("250 ok\r\n");
      }
    });
  });
  const port = await freePort();
  await new Promise<void>((done) => server.listen(port, "127.0.0.1", done));
  return {
    port,
    close: () => new Promise<void>((done) => server.close(() => done()))
  };
}

/** A fresh database migrated with Identity's migrations. */
async function createIdentityDb(base: string) {
  const name = `api_identity_${randomBytes(6).toString("hex")}`;
  const admin = new PrismaClient({ datasources: { db: { url: base } } });
  await admin.$executeRawUnsafe(`CREATE DATABASE ${name}`);
  const url = new URL(base);
  url.pathname = `/${name}`;
  execFileSync(
    PRISMA,
    [
      "migrate",
      "deploy",
      "--schema",
      join(ROOT, "mods/identity/schema.prisma")
    ],
    {
      stdio: "pipe",
      env: {
        ...process.env,
        APISERVER_IDENTITY_DATABASE_URL: url.toString(),
        PRISMA_HIDE_UPDATE_MESSAGE: "1"
      }
    }
  );
  const client = new PrismaClient({
    datasources: { db: { url: url.toString() } }
  });
  return {
    url: url.toString(),
    sql: (query: string, ...values: unknown[]) =>
      client.$queryRawUnsafe(query, ...values) as Promise<unknown[]>,
    forceDrop: (db: string) =>
      admin.$executeRawUnsafe(`DROP DATABASE IF EXISTS ${db} WITH (FORCE)`),
    async drop() {
      await client.$disconnect();
      await admin.$executeRawUnsafe(
        `DROP DATABASE IF EXISTS ${name} WITH (FORCE)`
      );
      await admin.$disconnect();
    }
  };
}

/**
 * Starts the stack. The apiserver reads its configuration once, when its modules load, so there
 * is one stack per process: the API area runs in its own mocha process.
 */
async function startStack(): Promise<Stack> {
  const base = required("PERSISTENCE_TEST_DATABASE_URL");
  const routr = required("ROUTR_API_ENDPOINT");
  const nats = required("CONFORMANCE_NATS_URL");

  const apiDb = (await createTestDb())!;
  const identityDb = await createIdentityDb(base);
  const emails: Email[] = [];
  const smtp = await startFakeSmtp(emails);
  const { publicKey, privateKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" }
  });

  const fixture = join(ROOT, "mods/apiserver/test/fixtures/fonoster.test.yaml");
  const config = parseConfigFile(fixture, readFileSync(fixture, "utf8")) as {
    identity: Record<string, unknown>;
    features?: Record<string, unknown>;
  };
  const { setConfigForTests } = await import("../../../apiserver/src/config");
  setConfigForTests({
    ...config,
    appUrl: "https://api.test",
    database: { url: apiDb.url },
    routr: { apiEndpoint: routr },
    nats: { url: nats },
    smtp: {
      host: "127.0.0.1",
      port: smtp.port,
      sender: "Fonoster <noreply@api.test>"
    },
    identity: {
      ...config.identity,
      database: { url: identityDb.url },
      keys: { privateKey, publicKey }
    },
    features: {
      ...(config.features ?? {}),
      auth: { methods: ["password", "email_code"], signup: "open" }
    }
  });

  // Loaded only now: they read the configuration set above.
  const { default: services } =
    await import("../../../apiserver/src/core/services");
  const { default: loadServices } =
    await import("../../../apiserver/src/core/loadServices");
  const { allowList } = await import("../../../apiserver/src/core/allowList");
  const { IDENTITY_ISSUER, IDENTITY_AUDIENCE } =
    await import("../../../apiserver/src/envs");

  const server = new grpc.Server({
    interceptors: [
      createAuthInterceptor(publicKey, allowList, {
        issuer: IDENTITY_ISSUER,
        audience: IDENTITY_AUDIENCE
      })
    ]
  });
  new HealthImplementation({ "": "SERVING" }).addToServer(server);
  await loadServices(server, (await services) as never);
  const port = await new Promise<number>((done, fail) =>
    server.bindAsync(
      "127.0.0.1:0",
      grpc.ServerCredentials.createInsecure(),
      (error, p) => (error ? fail(error) : done(p))
    )
  );

  const loaded = await services;
  const { createSessionRouter, identityFromHandlers, SESSION_PATH } =
    await import("../../../apiserver/src/session");
  const { getIdentityConfig } = await import("../../../apiserver/src/config");
  const { buildIdentityService, createPrismaClient, identityAllowList } =
    await import("@fonoster/identity");
  const identityConfig = getIdentityConfig();
  const identityPrisma = createPrismaClient(
    identityConfig.dbUrl,
    identityConfig.encryptionKey
  );
  const { default: express } = await import("express");
  const app = express();
  app.use(
    SESSION_PATH,
    createSessionRouter({
      identity: identityFromHandlers(
        Object.assign({}, ...loaded.map((s) => s.handlers)) as Record<
          string,
          never
        >
      ),
      secureCookie: false
    })
  );
  const http = await new Promise<import("http").Server>((done) => {
    const h = app.listen(0, "127.0.0.1", () => done(h));
  });

  async function identityVariant(patch: Record<string, unknown>) {
    const variant = new grpc.Server({
      interceptors: [
        createAuthInterceptor(publicKey, identityAllowList, {
          issuer: IDENTITY_ISSUER,
          audience: IDENTITY_AUDIENCE
        })
      ]
    });
    const service = await buildIdentityService({
      ...getIdentityConfig(),
      ...patch
    } as never);
    await loadServices(variant, [service as never]);
    const p = await new Promise<number>((done, fail) =>
      variant.bindAsync(
        "127.0.0.1:0",
        grpc.ServerCredentials.createInsecure(),
        (e, n) => (e ? fail(e) : done(n))
      )
    );
    return {
      endpoint: `127.0.0.1:${p}`,
      stop: () => new Promise<void>((done) => variant.tryShutdown(() => done()))
    };
  }

  return {
    endpoint: `127.0.0.1:${port}`,
    identityPrisma: identityPrisma as never,
    natsUrl: nats,
    httpUrl: `http://127.0.0.1:${(http.address() as AddressInfo).port}`,
    identityVariant,
    emails,
    apiDb,
    identitySql: identityDb.sql,
    publicKey,
    async stop() {
      await new Promise<void>((done) => server.tryShutdown(() => done()));
      await new Promise<void>((done) => http.close(() => done()));
      await (
        identityPrisma as unknown as { $disconnect(): Promise<void> }
      ).$disconnect();
      await smtp.close();
      // The apiserver keeps its own connection open: drop its database by force first.
      await identityDb.forceDrop(new URL(apiDb.url).pathname.slice(1));
      await apiDb.drop();
      await identityDb.drop();
    }
  };
}

export { startStack, Stack, Email, freePort };
