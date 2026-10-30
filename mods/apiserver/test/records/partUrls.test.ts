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
import { generateKeyPairSync } from "crypto";
import * as fs from "fs";
import * as http from "http";
import { AddressInfo } from "net";
import * as os from "os";
import * as path from "path";
import {
  CallRecordWriter,
  RecordIndexEntry,
  SignedVcon,
  decodeVcon,
  fsStores
} from "@fonoster/callrecord";
import { expect } from "chai";
import express from "express";
import jwt from "jsonwebtoken";
import { createIndexRecord, createRecordsRouter } from "../../src/records";
import { RelayError, RelayRequest } from "../../src/regions/relay";
import {
  FixtureCall,
  loadFixtureCall,
  playFixtureCall
} from "../../../callrecord/test/fixtures";
import { memoryRecordsDb } from "./memoryRecordsDb";

// Absolute part URLs in the records API's vCon and the route that serves them (#1236).

const ec = generateKeyPairSync("ec", { namedCurve: "P-256" });
const rsa = generateKeyPairSync("rsa", { modulusLength: 2048 });
const IDENTITY_PUBLIC = rsa.publicKey
  .export({ type: "spki", format: "pem" })
  .toString();

function token(role: string, accessKeyId: string) {
  return jwt.sign(
    {
      sub: `user-${role}`,
      accessKeyId: "user-key",
      tokenUse: "access",
      access: [{ accessKeyId, role }]
    },
    rsa.privateKey.export({ type: "pkcs8", format: "pem" }).toString(),
    { algorithm: "RS256", expiresIn: 300 }
  );
}

/** A fixture call moved to another callRef and workspace. */
function moved(name: string, callRef: string, workspaceRef?: string) {
  const fixture = loadFixtureCall(name);
  return {
    ...fixture,
    callRef,
    entries: fixture.entries.map((e) => ({
      ...e,
      message: {
        ...e.message,
        ...(e.message.callRef ? { callRef } : {}),
        ...(workspaceRef && e.message.workspaceRef ? { workspaceRef } : {})
      }
    }))
  } as FixtureCall;
}

type Relayed = { request: RelayRequest; reply: Buffer | RelayError };

describe("@apiserver records part urls", function () {
  this.timeout(20000);
  let dir: string;
  let writer: CallRecordWriter;
  let server: ReturnType<ReturnType<typeof express>["listen"]>;
  let port: number;
  const pending: Promise<unknown>[] = [];
  const relayed: Relayed[] = [];
  let nextReply: (r: RelayRequest) => Buffer | RelayError;
  let stored: (callRef: string, version?: number) => Promise<SignedVcon>;
  let recordedV1: number;

  before(async () => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "apiserver-part-urls-"));
    const stores = fsStores(dir);
    const mem = memoryRecordsDb();
    const index = createIndexRecord(mem.db);
    writer = new CallRecordWriter({
      ...stores,
      key: {
        kid: "k1",
        privateKeyPem: ec.privateKey
          .export({ type: "pkcs8", format: "pem" })
          .toString()
      },
      region: "us-east",
      onSealed: (e: RecordIndexEntry) => pending.push(index(e))
    });
    const play = async (fixture: FixtureCall) => {
      await playFixtureCall(writer as never, fixture);
      await Promise.all(pending);
    };
    // Beeped: the redacted copy references recording.redacted.wav.
    await play(loadFixtureCall("card-number"));
    // Nothing redacted: both copies reference recording.wav.
    await play(loadFixtureCall("recorded-call"));
    await play(moved("recorded-call", "fx-deleted"));
    recordedV1 = 1;
    await writer.deleteParts("fx-deleted", ["recording"], {
      reason: "request",
      actor: "u1"
    });
    await play(moved("handoff", "fx-erased"));
    await writer.erase("fx-erased", { reason: "erasure request", actor: "u1" });
    await play(moved("recorded-call", "fx-private", "ws-private"));
    await Promise.all(pending);
    stored = async (callRef, version) =>
      (await stores.store.getVersion(callRef, version))!.redacted;

    nextReply = () => new RelayError("not_found");
    const app = express();
    app.use(
      "/api/records",
      createRecordsRouter({
        db: mem.db,
        identityPublicKey: IDENTITY_PUBLIC,
        stores: (location) =>
          location === stores.store.location ? stores.store : undefined,
        maintenance: async () => ({ type: "ack" }) as never,
        relay: {
          regionOf: async (ws) => (ws === "ws-private" ? "us-east" : undefined),
          client: {
            open: async (_region: string, request: RelayRequest) => {
              const reply = nextReply(request);
              relayed.push({ request, reply });
              if (reply instanceof RelayError) throw reply;
              const contentType =
                request.op === "record.get"
                  ? "application/json"
                  : "application/x-ndjson";
              return {
                contentType,
                chunks: (async function* () {
                  for (let i = 0; i < reply.length; i += 512 * 1024)
                    yield reply.subarray(i, i + 512 * 1024);
                })(),
                close: () => undefined
              };
            }
          } as never
        }
      })
    );
    server = app.listen(0);
    await new Promise((r) => server.once("listening", r));
    port = (server.address() as AddressInfo).port;
  });

  after(() => {
    server?.close();
    fs.rmSync(dir, { recursive: true, force: true });
  });

  const get = (
    url: string,
    o: {
      role?: string;
      workspace?: string;
      headers?: Record<string, string>;
    } = {}
  ) => {
    const workspace = o.workspace ?? "ws-fixtures";
    return fetch(`http://127.0.0.1:${port}/api/records${url}`, {
      headers: {
        authorization: `Bearer ${token(o.role ?? "WORKSPACE_MEMBER", workspace)}`,
        "x-accesskey-id": workspace,
        ...o.headers
      }
    });
  };
  // fetch() won't set Host; node:http does.
  const getWithHost = (
    url: string,
    headers: Record<string, string>
  ): Promise<{ status: number; body: Record<string, unknown> }> =>
    new Promise((resolve, reject) => {
      http
        .get(
          {
            port,
            path: `/api/records${url}`,
            headers: {
              authorization: `Bearer ${token("WORKSPACE_MEMBER", "ws-fixtures")}`,
              "x-accesskey-id": "ws-fixtures",
              ...headers
            }
          },
          (res) => {
            const chunks: Buffer[] = [];
            res.on("data", (c) => chunks.push(c));
            res.on("end", () =>
              resolve({
                status: res.statusCode!,
                body: JSON.parse(Buffer.concat(chunks).toString())
              })
            );
          }
        )
        .on("error", reject);
    });
  const urlsOf = (vcon: {
    dialog: { url?: string }[];
    attachments: { url?: string }[];
  }) =>
    [...vcon.dialog, ...vcon.attachments]
      .map((x) => x.url)
      .filter((u): u is string => Boolean(u));
  const record = async (url: string, role?: string) => {
    const res = await get(url, { role });
    expect(res.status, url).to.equal(200);
    return (await res.json()) as {
      version: number;
      vcon: {
        dialog: Record<string, string>[];
        attachments: Record<string, string>[];
      };
      jws: SignedVcon;
    };
  };

  it("returns absolute part urls from the Host header and X-Forwarded-Proto", async function () {
    const plain = await getWithHost("/fx-card-number", {
      host: "api.example.com",
      "x-forwarded-host": "evil.test"
    });
    expect(plain.status).to.equal(200);
    const vcon = plain.body.vcon as Record<string, { url?: string }[]>;
    const v = plain.body.version;
    expect(vcon.dialog[0].url).to.equal(
      `http://api.example.com/api/records/fx-card-number/parts/recording.redacted.wav?version=${v}`
    );
    const https = await getWithHost("/fx-recorded", {
      host: "api.example.com",
      "x-forwarded-proto": "https, http"
    });
    expect((https.body.vcon as typeof vcon).dialog[0].url).to.equal(
      `https://api.example.com/api/records/fx-recorded/parts/recording.wav?version=${https.body.version}`
    );
    const junk = await getWithHost("/fx-recorded", {
      host: "api.example.com",
      "x-forwarded-proto": "javascript"
    });
    expect((junk.body.vcon as typeof vcon).dialog[0].url).to.match(
      /^http:\/\/api\.example\.com\//
    );
  });

  it("carries the version and original=true, and keeps jws as stored", async function () {
    const v1 = await record("/fx-card-number?version=1");
    expect(urlsOf(v1.vcon)).to.not.be.empty;
    for (const u of urlsOf(v1.vcon)) expect(u).to.match(/\?version=1$/);
    expect(v1.jws).to.deep.equal(await stored("fx-card-number", 1));
    expect(
      decodeVcon(v1.jws).dialog.find((d) => d.type === "recording")!.url
    ).to.equal("parts/recording.redacted.wav");

    const original = await record(
      "/fx-card-number?original=true",
      "WORKSPACE_OWNER"
    );
    const urls = urlsOf(original.vcon);
    for (const u of urls) expect(u).to.match(/&original=true$/);
    const messages = original.vcon.attachments.find(
      (a) => a.purpose === "session_messages"
    )!;
    expect(messages.url).to.match(
      /\/api\/records\/fx-card-number\/parts\/messages\.ndjson\?version=\d+&original=true$/
    );
  });

  it("serves every url it returns with the file, its type, name and hash", async function () {
    for (const [url, role] of [
      ["/fx-card-number", "WORKSPACE_MEMBER"],
      ["/fx-card-number?original=true", "WORKSPACE_OWNER"],
      ["/fx-recorded", "WORKSPACE_MEMBER"]
    ]) {
      const { vcon } = await record(url, role);
      for (const entry of [...vcon.dialog, ...vcon.attachments]) {
        if (!entry.url) continue;
        const u = new URL(entry.url);
        const res = await get(
          u.pathname.replace("/api/records", "") + u.search,
          {
            role
          }
        );
        expect(res.status, entry.url).to.equal(200);
        const name = decodeURIComponent(u.pathname.split("/").pop()!);
        expect(res.headers.get("content-type")).to.contain(entry.mimetype);
        expect(res.headers.get("content-disposition")).to.equal(
          `attachment; filename="${name}"`
        );
        expect(res.headers.get("x-content-hash")).to.equal(entry.content_hash);
        expect((await res.arrayBuffer()).byteLength).to.be.above(0);
      }
    }
  });

  it("resolves a role to the copy's file", async function () {
    const res = await get("/fx-card-number/parts/recording");
    expect(res.status).to.equal(200);
    expect(res.headers.get("content-disposition")).to.equal(
      'attachment; filename="recording.redacted.wav"'
    );
    const messages = await get("/fx-card-number/parts/messages?original=true", {
      role: "WORKSPACE_ADMIN"
    });
    expect(messages.status).to.equal(200);
    expect(messages.headers.get("content-disposition")).to.equal(
      'attachment; filename="messages.ndjson"'
    );
  });

  it("refuses a member the original's files", async function () {
    const withheld = await get("/fx-card-number/parts/recording.wav");
    expect(withheld.status).to.equal(403);
    expect(await withheld.json()).to.deep.equal({
      error: "permission_denied",
      message:
        "the file is withheld from the redacted copy; it needs unredacted access"
    });
    const original = await get(
      "/fx-card-number/parts/recording.wav?original=true"
    );
    expect(original.status).to.equal(403);
    expect(await original.json()).to.deep.equal({
      error: "permission_denied",
      message: "the unredacted original needs the owner or admin role"
    });
  });

  it("answers 404 for names the copy doesn't reference and other workspaces' calls", async function () {
    for (const url of [
      "/fx-card-number/parts/..%2Fother",
      "/fx-card-number/parts/unknown.wav",
      "/fx-card-number/parts/recording.redacted.wav?original=true"
    ]) {
      const res = await get(url, { role: "WORKSPACE_OWNER" });
      expect(res.status, url).to.equal(404);
      expect(await res.json()).to.deep.equal({ error: "not_found" });
    }
    const other = await get("/fx-card-number/parts/recording", {
      workspace: "ws-2"
    });
    expect(other.status).to.equal(404);
  });

  it("answers 410 for an erased record and for a file deleted after the version asked for", async function () {
    const erased = await get("/fx-erased/parts/recording");
    expect(erased.status).to.equal(410);
    expect(await erased.json()).to.deep.equal({ error: "erased" });
    const before = await get(
      `/fx-deleted/parts/recording.wav?version=${recordedV1}`
    );
    expect(before.status).to.equal(410);
    expect(await before.json()).to.deep.equal({ error: "contents_deleted" });
    const latest = await get("/fx-deleted/parts/recording.wav");
    expect(latest.status).to.equal(404);
    expect(await latest.json()).to.deep.equal({ error: "not_found" });
  });

  describe("private regions", function () {
    const privateGet = (url: string, role = "WORKSPACE_MEMBER") =>
      get(url, { role, workspace: "ws-private" });

    it("rewrites a relayed record's urls with the body's version", async function () {
      const signed = await stored("fx-private");
      nextReply = () =>
        Buffer.from(
          JSON.stringify({
            callRef: "fx-private",
            version: 3,
            redacted: true,
            vcon: decodeVcon(signed),
            jws: signed,
            parts: []
          })
        );
      const res = await privateGet("/fx-private");
      expect(res.status).to.equal(200);
      const body = (await res.json()) as {
        vcon: { attachments: { url?: string }[]; dialog: { url?: string }[] };
        jws: SignedVcon;
      };
      expect(relayed.at(-1)!.request.op).to.equal("record.get");
      expect(body.jws).to.deep.equal(signed);
      const urls = urlsOf(body.vcon);
      expect(urls).to.not.be.empty;
      for (const u of urls)
        expect(u).to.match(
          new RegExp(
            `^http://127\\.0\\.0\\.1:${port}/api/records/fx-private/parts/[^/?]+\\?version=3$`
          )
        );
    });

    it("refuses a relayed record over 4 MiB", async function () {
      nextReply = () =>
        Buffer.from(
          JSON.stringify({ version: 1, pad: "x".repeat(4 * 1024 * 1024) })
        );
      const res = await privateGet("/fx-private");
      expect(res.status).to.equal(413);
      expect(await res.json()).to.deep.equal({
        error: "too_large",
        message: "the record from the region is larger than 4 MiB"
      });
    });

    it("asks the region for a part by its raw name and maps its errors", async function () {
      nextReply = () => Buffer.from('{"type":"x"}\n');
      const ok = await privateGet(
        "/fx-private/parts/messages.ndjson?version=2&original=true",
        "WORKSPACE_ADMIN"
      );
      expect(ok.status).to.equal(200);
      expect(ok.headers.get("content-disposition")).to.equal(
        'attachment; filename="messages.ndjson"'
      );
      expect(ok.headers.get("content-type")).to.contain("application/x-ndjson");
      expect(ok.headers.get("x-content-hash")).to.equal(null);
      expect(relayed.at(-1)!.request).to.include({
        op: "record.part",
        callRef: "fx-private",
        part: "messages.ndjson",
        original: true,
        version: 2
      });
      for (const [code, status] of [
        ["permission_denied", 403],
        ["not_found", 404],
        ["contents_deleted", 410]
      ] as const) {
        nextReply = () => new RelayError(code);
        const res = await privateGet("/fx-private/parts/recording.wav");
        expect(res.status, code).to.equal(status);
        expect(((await res.json()) as { error: string }).error).to.equal(code);
      }
    });
  });
});
