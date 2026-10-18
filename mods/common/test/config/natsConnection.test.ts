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
import { natsConnectOptions, natsInboxPrefix } from "../../src/config";

describe("@common/config natsConnectOptions", function () {
  it("gives a per-service user its own inbox prefix", function () {
    expect(
      natsConnectOptions({
        url: "nats://nats:4222",
        user: "gateway",
        password: "p"
      })
    ).to.deep.equal({
      servers: "nats://nats:4222",
      user: "gateway",
      pass: "p",
      inboxPrefix: "_INBOX_gateway"
    });
    expect(natsInboxPrefix("region-agent")).to.equal("_INBOX_region-agent");
  });

  it("keeps the default inbox without a user (a NATS without per-service users)", function () {
    expect(natsConnectOptions("nats://nats:4222")).to.deep.equal({
      servers: "nats://nats:4222"
    });
    expect(natsConnectOptions({ url: "nats://nats:4222" })).to.deep.equal({
      servers: "nats://nats:4222"
    });
  });
});
