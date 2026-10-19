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
import * as fs from "fs";
import * as path from "path";
import Ajv from "ajv";
import { expect } from "chai";
import {
  APP_COMMAND_SCHEMAS,
  APPBRIDGE_MESSAGE_SCHEMAS,
  SESSION_PROTOCOL,
  sessionProtocolDocument
} from "../../src/session";

const ajv = new Ajv({ strict: false });
const valid = (schema: object, data: unknown) => ajv.validate(schema, data);

describe("@common/session schema", function () {
  it("is exported to schema/session.v1.json (run generate:session-schema)", function () {
    const file = path.join(__dirname, "..", "..", "schema", "session.v1.json");
    expect(JSON.parse(fs.readFileSync(file, "utf8"))).to.deep.equal(
      JSON.parse(JSON.stringify(sessionProtocolDocument()))
    );
  });

  it("names every schema by its type", function () {
    for (const [type, schema] of [
      ...Object.entries(APPBRIDGE_MESSAGE_SCHEMAS),
      ...Object.entries(APP_COMMAND_SCHEMAS)
    ]) {
      expect((schema.properties.type as { const: string }).const).to.equal(
        type
      );
    }
  });

  it("accepts a session.start from the spec", function () {
    expect(
      valid(APPBRIDGE_MESSAGE_SCHEMAS["session.start"], {
        type: "session.start",
        protocol: SESSION_PROTOCOL,
        sessionRef: "s1",
        callRef: "c1",
        appRef: "a1",
        direction: "inbound",
        from: "+15550001111",
        to: "+15550002222",
        metadata: {},
        handoff: null,
        audio: { codec: "pcm16", rate: 16000 },
        tracks: [{ id: 1, side: "inbound", kind: "audio", codec: "pcm16" }],
        speech: { voice: "fonoster/default", language: "en-US" }
      })
    ).to.equal(true);
  });

  it("rejects speak without text and accepts unknown fields", function () {
    expect(
      valid(APP_COMMAND_SCHEMAS.speak, { type: "speak", id: "r9", last: true })
    ).to.equal(false);
    expect(
      valid(APP_COMMAND_SCHEMAS.speak, {
        type: "speak",
        text: "hi",
        futureField: 1
      })
    ).to.equal(true);
  });

  it("checks transfer modes and DTMF digits", function () {
    expect(
      valid(APP_COMMAND_SCHEMAS.transfer, {
        type: "transfer",
        to: "+1",
        mode: "warm"
      })
    ).to.equal(true);
    expect(
      valid(APP_COMMAND_SCHEMAS.transfer, {
        type: "transfer",
        to: "+1",
        mode: "blind"
      })
    ).to.equal(false);
    expect(
      valid(APP_COMMAND_SCHEMAS["dtmf.send"], {
        type: "dtmf.send",
        digits: "12#"
      })
    ).to.equal(true);
    expect(
      valid(APP_COMMAND_SCHEMAS["dtmf.send"], {
        type: "dtmf.send",
        digits: "x"
      })
    ).to.equal(false);
  });
});
