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
import { expect } from "chai";
import { generateKeyPairSync } from "crypto";
import * as fs from "fs";
import * as http from "http";
import { AddressInfo } from "net";
import * as os from "os";
import * as path from "path";
import {
  DirIdentityStore,
  enroll,
  EnrollError,
  KubeIdentityStore,
  loadIdentity,
  verifyToken
} from "../src";
import { KubeSecrets } from "../src/kube";
import { FakeControlPlane } from "./fakeControlPlane";

// add-private-regions task 3.1: `fonoster-region enroll <token>` (contract 1 and 2).

async function rejects(p: Promise<unknown>, code: string) {
  try {
    await p;
  } catch (e) {
    expect(e).to.be.instanceOf(EnrollError);
    expect((e as EnrollError).code).to.equal(code);
    return e as EnrollError;
  }
  throw new Error(`expected ${code}`);
}

describe("@region-agent enrollment", function () {
  let cp: FakeControlPlane;
  let dir: string;
  beforeEach(async () => {
    cp = await new FakeControlPlane().start();
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "region-enroll-"));
  });
  afterEach(async () => {
    await cp.stop();
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it("verifies the token's signature, audience and expiry", async function () {
    const keys = { keys: [cp.publicJwk] };
    const ok = cp.issue();
    expect(verifyToken(ok.token, keys as never).sub).to.equal(cp.regionRef);
    const other = generateKeyPairSync("ec", { namedCurve: "P-256" }).privateKey;
    expect(() =>
      verifyToken(cp.issue({ key: other }).token, keys as never)
    ).to.throw(/token_invalid.*bad signature/);
    expect(() =>
      verifyToken(cp.issue({ aud: "other" }).token, keys as never)
    ).to.throw(/token_invalid.*audience/);
    expect(() =>
      verifyToken(cp.issue({ expiresInS: -10 }).token, keys as never)
    ).to.throw(/token_expired/);
    expect(() => verifyToken("abc", keys as never)).to.throw(/token_invalid/);
  });

  it("enrolls: Ed25519 public key in, credentials stored 0600 with a leaf include", async function () {
    const { token, jti } = cp.issue();
    const identity = await enroll({
      token,
      store: new DirIdentityStore(dir),
      version: "0.28.1"
    });
    expect(identity.regionRef).to.equal(cp.regionRef);
    // A region serves several workspaces (PR-14): no workspace in the identity.
    expect(identity).to.include({
      regionId: "acme-hq",
      kind: "private",
      sipDomain: "sip.acme.example"
    });
    expect(identity.workspaceRef).to.equal(undefined);
    expect(identity.tokenId).to.equal(jti);
    const sent = cp.enrollments[0] as Record<string, unknown>;
    expect(sent.token).to.equal(token);
    expect(Buffer.from(String(sent.publicKey), "base64url")).to.have.length(32);
    expect(sent.version).to.equal("0.28.1");
    expect(sent.components).to.deep.equal({
      roomrNodes: 1,
      appbridges: 1,
      autopilot: true
    });
    for (const f of ["region.json", "leaf.creds", "cell.key", "leaf.conf"])
      expect(fs.statSync(path.join(dir, f)).mode & 0o777).to.equal(0o600);
    expect(fs.readFileSync(path.join(dir, "leaf.creds"), "utf8")).to.include(
      "NATS USER JWT"
    );
    const conf = fs.readFileSync(path.join(dir, "leaf.conf"), "utf8");
    expect(conf).to.include('url: "nats://127.0.0.1:7422"');
    expect(conf).to.include('credentials: "/etc/nats/region/leaf.creds"');
    expect(fs.readFileSync(path.join(dir, "cell.key"), "utf8")).to.include(
      "PRIVATE KEY"
    );
    expect((await loadIdentity(new DirIdentityStore(dir))).regionRef).to.equal(
      cp.regionRef
    );
  });

  it("explains token_used, token_expired and token_invalid", async function () {
    const { token } = cp.issue();
    const store = new DirIdentityStore(dir);
    await enroll({ token, store, version: "1" });
    const used = await rejects(
      enroll({ token, store, version: "1" }),
      "token_used"
    );
    expect(used.message).to.match(/re-issue a token/);
    await rejects(
      enroll({
        token: cp.issue({ expiresInS: -5 }).token,
        store,
        version: "1"
      }),
      "token_expired"
    );
    cp.nextResponse = { status: 400, body: { error: "token_invalid" } };
    await rejects(
      enroll({ token: cp.issue().token, store, version: "1" }),
      "token_invalid"
    );
    cp.nextResponse = { status: 409, body: { error: "workspace_deleted" } };
    await rejects(
      enroll({ token: cp.issue().token, store, version: "1" }),
      "workspace_deleted"
    );
    const forged = generateKeyPairSync("ec", {
      namedCurve: "P-256"
    }).privateKey;
    await rejects(
      enroll({ token: cp.issue({ key: forged }).token, store, version: "1" }),
      "token_invalid"
    );
  });

  it("refuses plain-text URLs off this host and a different control plane", async function () {
    const store = new DirIdentityStore(dir);
    await rejects(
      enroll({
        token: cp.issue({ cp: "http://cp.example.com" }).token,
        store,
        version: "1"
      }),
      "insecure_url"
    );
    await rejects(
      enroll({
        token: cp.issue({ leaf: "nats://leaf.example.com:7422" }).token,
        store,
        version: "1"
      }),
      "insecure_url"
    );
    await rejects(
      enroll({
        token: cp.issue().token,
        store,
        version: "1",
        controlPlane: "https://api.fonoster.com"
      }),
      "control_plane_mismatch"
    );
  });

  it("stores the credentials in a Kubernetes Secret", async function () {
    const secrets: Record<string, Record<string, string>> = {};
    const api = http.createServer((req, res) => {
      const name = decodeURIComponent(String(req.url).split("/").pop() ?? "");
      const chunks: Buffer[] = [];
      req.on("data", (c) => chunks.push(c));
      req.on("end", () => {
        const body = chunks.length
          ? JSON.parse(Buffer.concat(chunks).toString())
          : {};
        expect(req.headers.authorization).to.equal("Bearer sa-token");
        if (req.method === "PATCH") {
          if (!secrets[name]) {
            res.writeHead(404);
            return res.end("{}");
          }
          Object.assign(secrets[name], body.data);
        } else if (req.method === "POST") {
          secrets[body.metadata.name] = body.data;
        } else if (req.method === "GET") {
          if (!secrets[name]) {
            res.writeHead(404);
            return res.end("{}");
          }
          res.writeHead(200);
          return res.end(JSON.stringify({ data: secrets[name] }));
        }
        res.writeHead(200);
        res.end("{}");
      });
    });
    await new Promise<void>((r) => api.listen(0, "127.0.0.1", r));
    const kube = new KubeSecrets({
      server: `http://127.0.0.1:${(api.address() as AddressInfo).port}`,
      token: "sa-token",
      namespace: "cell"
    });
    const store = new KubeIdentityStore(kube, "fonoster-region");
    await enroll({ token: cp.issue().token, store, version: "1" });
    expect(Object.keys(secrets["fonoster-region"])).to.have.members([
      "region.json",
      "leaf.creds",
      "cell.key",
      "leaf.conf"
    ]);
    expect((await loadIdentity(store)).regionRef).to.equal(cp.regionRef);
    await new Promise<void>((r) => api.close(() => r()));
  });
});
