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
import { expect } from "chai";
import { traceHeaders } from "../src";

// Trace propagation (add-platform 2.5). Media-control commands and call.incoming no longer travel
// over NATS (redesign-roomr: a control stream per call), so what is left on NATS is AppBridge's
// own messages, such as callrecord.sealed, which carry the call's traceparent as a header.
const TP = "00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01";

describe("@appbridge/trace propagation over NATS", function () {
  it("puts the call's traceparent on the NATS headers it publishes", function () {
    expect(traceHeaders(TP).get("traceparent")).to.equal(TP);
  });
});
