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
import { NatsConnection, StringCodec } from "nats";
import { WorkspaceDirectory } from "../../src/regions/types";
import {
  WORKSPACE_DELETED_SUBJECT,
  subscribeWorkspaceDeleted
} from "../../src/workspaces/workspaceDeleted";

// AppBridge asks the apiserver whether an inbound call's workspace was deleted (#1318). The
// apiserver answers from Identity's deletion records, through the in-process directory.

const sc = StringCodec();

/** Just enough of a NATS connection: one subscription, driven by the test. */
function fakeNats() {
  const subs: {
    subject: string;
    queue?: string;
    callback: (err: Error | null, msg: unknown) => void;
    closed: boolean;
  }[] = [];
  const nc = {
    subscribe(
      subject: string,
      opts: {
        queue?: string;
        callback: (err: Error | null, msg: unknown) => void;
      }
    ) {
      const sub = { subject, ...opts, closed: false };
      subs.push(sub);
      return {
        unsubscribe: () => {
          sub.closed = true;
        }
      };
    }
  } as unknown as NatsConnection;
  /** Sends a request to the one subscriber and resolves its reply. */
  const ask = (body: unknown) =>
    new Promise<Record<string, unknown>>((resolve) =>
      subs[0].callback(null, {
        data: sc.encode(typeof body === "string" ? body : JSON.stringify(body)),
        respond: (data: Uint8Array) => {
          resolve(JSON.parse(sc.decode(data)));
          return true;
        }
      })
    );
  return { nc, subs, ask };
}

function directory(isDeleted: (key: string) => Promise<boolean>) {
  const asked: string[] = [];
  const d: WorkspaceDirectory = {
    workspace: async () => undefined,
    inRegion: async () => [],
    deleted: async () => [],
    isDeleted: (key) => {
      asked.push(key);
      return isDeleted(key);
    }
  };
  return { d, asked };
}

describe("@apiserver workspaces.deleted responder (#1318)", function () {
  it("subscribes to workspaces.deleted in queue group apiserver", function () {
    const { nc, subs } = fakeNats();
    const stop = subscribeWorkspaceDeleted(nc, () => undefined);
    expect(WORKSPACE_DELETED_SUBJECT).to.equal("workspaces.deleted");
    expect(subs[0]).to.include({
      subject: "workspaces.deleted",
      queue: "apiserver"
    });
    stop();
    expect(subs[0].closed).to.equal(true);
  });

  it("answers deleted true for a deleted workspace and false for a live one, asking each time", async function () {
    const { nc, ask } = fakeNats();
    const { d, asked } = directory(async (key) => key === "WOdeleted");
    subscribeWorkspaceDeleted(nc, () => d);
    expect(await ask({ accessKeyId: "WOdeleted" })).to.deep.equal({
      deleted: true
    });
    expect(await ask({ accessKeyId: "WOlive" })).to.deep.equal({
      deleted: false
    });
    expect(await ask({ accessKeyId: "WOdeleted" })).to.deep.equal({
      deleted: true
    });
    expect(asked).to.deep.equal(["WOdeleted", "WOlive", "WOdeleted"]);
  });

  it("answers an error when the directory isn't attached", async function () {
    const { nc, ask } = fakeNats();
    subscribeWorkspaceDeleted(nc, () => undefined);
    expect(await ask({ accessKeyId: "WOx" })).to.deep.equal({
      error: "directory unavailable"
    });
  });

  it("answers an error when Identity's database fails", async function () {
    const { nc, ask } = fakeNats();
    const { d } = directory(async () => {
      throw new Error("connection refused");
    });
    subscribeWorkspaceDeleted(nc, () => d);
    expect(await ask({ accessKeyId: "WOx" })).to.deep.equal({
      error: "directory unavailable"
    });
  });

  it("answers deleted false to a request without an accessKeyId", async function () {
    const { nc, ask } = fakeNats();
    const { d, asked } = directory(async () => true);
    subscribeWorkspaceDeleted(nc, () => d);
    expect(await ask({})).to.deep.equal({ deleted: false });
    expect(await ask("not json")).to.deep.equal({ deleted: false });
    expect(asked).to.deep.equal([]);
  });
});
