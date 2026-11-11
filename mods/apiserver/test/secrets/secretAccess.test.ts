/*
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
import * as chai from "chai";
import { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { createSandbox } from "sinon";
import sinonChai from "sinon-chai";
import { Prisma } from "../../src/core/db";
import { TEST_TOKEN } from "../utils";

chai.use(chaiAsPromised);
chai.use(sinonChai);
const sandbox = createSandbox();

const WORKSPACE = "WOahn02s8tgdfghz72vb0fz538qpb5z35p";

// Only the payload matters: the apiserver decodes, the auth interceptor verifies.
const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
const API_KEY_TOKEN = [
  b64({ alg: "RS256", typ: "JWT" }),
  b64({
    sub: "apikey-ref",
    tokenUse: "access",
    accessKeyId: "AP2rgbe4tbkduyqmxbrhmmrzmmpu6ghsat",
    access: [{ accessKeyId: WORKSPACE, role: "WORKSPACE_ADMIN" }]
  }),
  "sig"
].join(".");

const APP_SECRET = {
  ref: "123",
  accessKeyId: WORKSPACE,
  name: "my-secret",
  secret: "s3cr3t"
};
const VENDOR_KEY = {
  ...APP_SECRET,
  ref: "456",
  name: "provider-key/deepgram"
};

function callWith(token: string, request: Record<string, unknown>) {
  const metadata = new grpc.Metadata();
  metadata.set("token", token);
  metadata.set("accessKeyId", WORKSPACE);
  return { metadata, request };
}

function run<T>(
  handler: (
    call: unknown,
    cb: (error: unknown, response?: T) => void
  ) => unknown,
  call: unknown
): Promise<T> {
  return new Promise((resolve, reject) => {
    handler(call, (error, response) =>
      error ? reject(error) : resolve(response as T)
    );
  });
}

function db(row: Record<string, unknown>) {
  return {
    secret: {
      findUnique: sandbox.stub().resolves(row),
      findMany: sandbox.stub().resolves([APP_SECRET, VENDOR_KEY]),
      update: sandbox.stub().resolves({ ref: row.ref }),
      delete: sandbox.stub().resolves({ ref: row.ref })
    }
  } as unknown as Prisma & {
    secret: Record<string, sinon.SinonStub>;
  };
}

describe("@secrets/access (API keys read values, vendor keys stay with Providers)", function () {
  afterEach(() => sandbox.restore());

  it("returns an app secret's value to an API key", async function () {
    const { getSecret } = await import("../../src/secrets/getSecret");
    const response = await run<{ secret: string }>(
      getSecret(db(APP_SECRET)),
      callWith(API_KEY_TOKEN, { ref: "123" })
    );
    expect(response.secret).to.equal("s3cr3t");
  });

  it("returns no value to a person signed in, owners included", async function () {
    const { getSecret } = await import("../../src/secrets/getSecret");
    const response = await run<{ secret: string; name: string }>(
      getSecret(db(APP_SECRET)),
      callWith(TEST_TOKEN, { ref: "123" })
    );
    expect(response.secret).to.equal("");
    expect(response.name).to.equal("my-secret");
  });

  it("never returns a vendor key's value, even to an API key", async function () {
    const { getSecret } = await import("../../src/secrets/getSecret");
    const response = await run<{ secret: string }>(
      getSecret(db(VENDOR_KEY)),
      callWith(API_KEY_TOKEN, { ref: "456" })
    );
    expect(response.secret).to.equal("");
  });

  it("lists secrets without values", async function () {
    const { listSecrets } = await import("../../src/secrets/listSecrets");
    const response = await run<{ items: { secret: string }[] }>(
      listSecrets(db(APP_SECRET)),
      callWith(API_KEY_TOKEN, { pageSize: 10 })
    );
    expect(response.items).to.have.length(2);
    expect(response.items.map((i) => i.secret)).to.deep.equal(["", ""]);
  });

  it("refuses to update a vendor key", async function () {
    const { updateSecret } = await import("../../src/secrets/updateSecret");
    const prisma = db(VENDOR_KEY);
    await expect(
      run(
        updateSecret(prisma),
        callWith(TEST_TOKEN, { ref: "456", name: "", secret: "x" })
      )
    ).to.be.rejected.and.eventually.have.property(
      "code",
      grpc.status.INVALID_ARGUMENT
    );
    expect(prisma.secret.update).not.to.have.been.called;
  });

  it("refuses to delete a vendor key", async function () {
    const { deleteSecret } = await import("../../src/secrets/deleteSecret");
    const prisma = db(VENDOR_KEY);
    await expect(
      run(deleteSecret(prisma), callWith(TEST_TOKEN, { ref: "456" }))
    ).to.be.rejected.and.eventually.have.property(
      "code",
      grpc.status.INVALID_ARGUMENT
    );
    expect(prisma.secret.delete).not.to.have.been.called;
  });

  it("keeps the stored value when an update has none", async function () {
    const { updateSecret } = await import("../../src/secrets/updateSecret");
    const prisma = db(APP_SECRET);
    await run(
      updateSecret(prisma),
      callWith(TEST_TOKEN, { ref: "123", name: "new-name", secret: "" })
    );
    expect(prisma.secret.update).to.have.been.calledOnceWith({
      where: { ref: "123" },
      data: { name: "new-name" }
    });
  });

  it("checks an updated name like createSecret does", async function () {
    const { updateSecret } = await import("../../src/secrets/updateSecret");
    const prisma = db(APP_SECRET);
    await expect(
      run(
        updateSecret(prisma),
        callWith(TEST_TOKEN, { ref: "123", name: "has space", secret: "" })
      )
    ).to.be.rejected.and.eventually.have.property(
      "code",
      grpc.status.INVALID_ARGUMENT
    );
    expect(prisma.secret.update).not.to.have.been.called;
  });
});
