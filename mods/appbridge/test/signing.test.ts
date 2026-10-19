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
// voice-session, "Connection requests are signed" and "Connection requests are bound to the app":
// AppBridge's headers verify with the voice SDK's checks, and the bound signature names the app
// and workspace it was made for.
import { expect } from "chai";
import { verifyAppSignature, verifySignature } from "../../voice/src/signature";
import { signatureHeaders } from "../src/signing";

const lower = (h: Record<string, string>) =>
  Object.fromEntries(Object.entries(h).map(([k, v]) => [k.toLowerCase(), v]));

describe("@appbridge connection signing", function () {
  const url = "ws://autopilot:3000";
  const binding = { appRef: "app-1", workspaceRef: "WS1" };

  it("keeps the URL-only signature apps already verify", function () {
    const headers = lower(signatureHeaders(url, "s", 1_700_000_000));
    expect(verifySignature([url], headers, "s", 1_700_000_000).ok).to.equal(
      true
    );
    expect(headers["x-fonoster-app-signature"]).to.equal(undefined);
  });

  it("binds the signature to the app and workspace", function () {
    const headers = lower(signatureHeaders(url, "s", 1_700_000_000, binding));
    expect(headers["x-fonoster-app-ref"]).to.equal("app-1");
    expect(headers["x-fonoster-workspace-ref"]).to.equal("WS1");
    expect(verifySignature([url], headers, "s", 1_700_000_000).ok).to.equal(
      true
    );
    expect(
      verifyAppSignature([url], headers, "s", 1_700_000_000)
    ).to.deep.equal({ ok: true, binding });
    // The same signature does not verify for another URL, app or workspace.
    expect(
      verifyAppSignature(["ws://tenant.example/"], headers, "s", 1_700_000_000)
        .ok
    ).to.equal(false);
    for (const forged of [
      { "x-fonoster-app-ref": "app-2" },
      { "x-fonoster-workspace-ref": "WS2" }
    ])
      expect(
        verifyAppSignature([url], { ...headers, ...forged }, "s", 1_700_000_000)
          .ok
      ).to.equal(false);
  });

  it("signs an app without a known workspace with an empty one", function () {
    const headers = lower(
      signatureHeaders(url, "s", 1_700_000_000, { appRef: "app-1" })
    );
    expect(
      verifyAppSignature([url], headers, "s", 1_700_000_000)
    ).to.deep.equal({
      ok: true,
      binding: { appRef: "app-1", workspaceRef: "" }
    });
  });
});
