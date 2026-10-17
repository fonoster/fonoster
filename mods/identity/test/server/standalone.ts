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
import { ChildProcess, execFileSync, spawn } from "child_process";
import { generateKeyPairSync, randomBytes } from "crypto";
import { mkdtempSync, readdirSync, rmSync, writeFileSync } from "fs";
import { AddressInfo, createServer } from "net";
import { tmpdir } from "os";
import { join, resolve } from "path";
import { URL } from "url";
import * as grpc from "@grpc/grpc-js";
import { service as healthService } from "grpc-health-check";
import { PrismaClient } from "../../src/generated/@prisma/client";

// The standalone Identity service as it ships: a fresh database on the server named by
// PERSISTENCE_TEST_DATABASE_URL, provisioned by scripts/db-provision.mjs, then the built
// `fonoster-identity` bin (dist/server/index.js) started from a config file. A fake SMTP server
// catches outgoing email. Needs `npm run build`; undefined when no test database is configured.

const IDENTITY_DIR = resolve(__dirname, "../..");
const MIGRATIONS = readdirSync(join(IDENTITY_DIR, "migrations"), {
  withFileTypes: true
}).filter((e) => e.isDirectory()).length;

type Email = { to: string; data: string };

type StandaloneIdentity = {
  endpoint: string;
  publicKey: string;
  databaseUrl: string;
  /** Migration folders shipped with the service, to compare with what was applied. */
  migrations: number;
  emails: Email[];
  /** A Prisma client on the service's database, for assertions only. */
  prisma: PrismaClient;
  /** The health check's status for the whole server (""). */
  health(): Promise<string>;
  stop(): Promise<void>;
};

/**
 * A field-encryption key both the config schema (base64) and cloak (base64url) accept: one whose
 * base64 has no `+` or `/`.
 */
function encryptionKey() {
  for (;;) {
    const key = randomBytes(32).toString("base64");
    if (!/[+/]/.test(key)) return `k1.aesgcm256.${key}`;
  }
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
          } else {
            data.push(line);
          }
          continue;
        }
        const command = line.slice(0, 4).toUpperCase();
        if (command === "EHLO" || command === "HELO") {
          socket.write("250 fake-smtp\r\n");
        } else if (command === "RCPT") {
          to = line.replace(/^RCPT TO:\s*<?([^>]*)>?.*$/i, "$1");
          socket.write("250 ok\r\n");
        } else if (command === "DATA") {
          data = [];
          socket.write("354 go ahead\r\n");
        } else if (command === "QUIT") {
          socket.end("221 bye\r\n");
        } else {
          socket.write("250 ok\r\n");
        }
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

function healthCheck(endpoint: string) {
  const Health = grpc.makeGenericClientConstructor(healthService, "Health");
  const client = new Health(
    endpoint,
    grpc.credentials.createInsecure()
  ) as grpc.Client & {
    check(
      request: { service: string },
      callback: (
        error: grpc.ServiceError | null,
        response: { status: string | number }
      ) => void
    ): void;
  };
  const names = ["UNKNOWN", "SERVING", "NOT_SERVING", "SERVICE_UNKNOWN"];
  return new Promise<string>((done, fail) => {
    client.check({ service: "" }, (error, response) => {
      client.close();
      if (error) fail(error);
      else {
        const { status } = response;
        done(typeof status === "number" ? names[status] : status);
      }
    });
  });
}

async function waitForServing(
  endpoint: string,
  child: ChildProcess,
  output: () => string
) {
  const deadline = Date.now() + 20000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(
        `fonoster-identity exited (${child.exitCode}):\n${output()}`
      );
    }
    try {
      if ((await healthCheck(endpoint)) === "SERVING") return;
    } catch {
      // not listening yet
    }
    await new Promise((done) => setTimeout(done, 200));
  }
  throw new Error(`fonoster-identity never reported SERVING:\n${output()}`);
}

async function startStandaloneIdentity(): Promise<
  StandaloneIdentity | undefined
> {
  const base = process.env.PERSISTENCE_TEST_DATABASE_URL;
  if (!base) return undefined;

  const name = `identity_test_${randomBytes(6).toString("hex")}`;
  const admin = new PrismaClient({ datasources: { db: { url: base } } });
  await admin.$executeRawUnsafe(`CREATE DATABASE ${name}`);
  const url = new URL(base);
  url.pathname = `/${name}`;
  const databaseUrl = url.toString();

  const emails: Email[] = [];
  const smtp = await startFakeSmtp(emails);
  const { publicKey, privateKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" }
  });
  const grpcPort = await freePort();
  const endpoint = `127.0.0.1:${grpcPort}`;

  const dir = mkdtempSync(join(tmpdir(), "fonoster-identity-"));
  const configPath = join(dir, "identity.json");
  writeFileSync(
    configPath,
    JSON.stringify({
      server: { bindAddr: endpoint, httpBridgePort: await freePort() },
      logs: { level: "error" },
      database: { url: databaseUrl },
      encryptionKey: encryptionKey(),
      issuer: "https://identity.test",
      keys: { privateKey, publicKey },
      auth: { methods: ["password"], signup: "open" },
      smtp: {
        host: "127.0.0.1",
        port: smtp.port,
        sender: "Identity <identity@identity.test>"
      }
    })
  );

  // The provisioning entrypoint, the way the image runs it before the server.
  execFileSync(
    process.execPath,
    ["scripts/db-provision.mjs", "--config", configPath],
    {
      cwd: IDENTITY_DIR,
      stdio: "pipe"
    }
  );

  let output = "";
  const child = spawn(
    process.execPath,
    ["dist/server/index.js", "--config", configPath],
    {
      cwd: IDENTITY_DIR,
      stdio: ["ignore", "pipe", "pipe"]
    }
  );
  child.stdout?.on("data", (chunk) => (output += chunk));
  child.stderr?.on("data", (chunk) => (output += chunk));

  const prisma = new PrismaClient({
    datasources: { db: { url: databaseUrl } }
  });

  const stop = async () => {
    if (child.exitCode === null) {
      const exited = new Promise((done) => child.once("exit", done));
      child.kill("SIGTERM");
      await exited;
    }
    await prisma.$disconnect();
    await smtp.close();
    await admin.$executeRawUnsafe(
      `DROP DATABASE IF EXISTS ${name} WITH (FORCE)`
    );
    await admin.$disconnect();
    rmSync(dir, { recursive: true, force: true });
  };

  try {
    await waitForServing(endpoint, child, () => output);
  } catch (error) {
    await stop();
    throw error;
  }

  return {
    endpoint,
    publicKey,
    databaseUrl,
    migrations: MIGRATIONS,
    emails,
    prisma,
    health: () => healthCheck(endpoint),
    stop
  };
}

export { startStandaloneIdentity, StandaloneIdentity };
