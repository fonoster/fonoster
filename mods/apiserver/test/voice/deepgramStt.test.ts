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
import { buildTranscribeConfig, Deepgram } from "../../src/voice/stt/Deepgram";
import { DeepgramModel } from "../../src/voice/stt/types";

describe("@voice/stt/Deepgram", function () {
  const schema = Deepgram.getConfigValidationSchema();

  it("should accept a regular language code", function () {
    expect(schema.safeParse({ languageCode: "es-ES" }).success).to.be.true;
  });

  it("should accept the multilingual code with nova-3", function () {
    const result = schema.safeParse({ languageCode: "multi", model: "nova-3" });

    expect(result.success).to.be.true;
  });

  it("should accept the multilingual code without a model", function () {
    expect(schema.safeParse({ languageCode: "multi" }).success).to.be.true;
  });

  it("should accept the multilingual code with nova-2", function () {
    const result = schema.safeParse({ languageCode: "multi", model: "nova-2" });

    expect(result.success).to.be.true;
  });

  it("should reject the multilingual code with an English-only model", function () {
    const result = schema.safeParse({
      languageCode: "multi",
      model: "nova-2-phonecall"
    });

    expect(result.success).to.be.false;
  });

  it("should reject an unknown language code", function () {
    expect(schema.safeParse({ languageCode: "xx-XX" }).success).to.be.false;
  });

  it("should default to nova-3 when multilingual has no model", function () {
    const config = buildTranscribeConfig({
      languageCode: "multi"
    } as Parameters<typeof buildTranscribeConfig>[0]);

    expect(config.model).to.equal(DeepgramModel.NOVA_3);
    expect(config.language).to.equal("multi");
    expect(config.endpointing).to.equal(100);
  });

  it("should keep the phonecall default for regular language codes", function () {
    const config = buildTranscribeConfig({
      languageCode: "es-ES"
    } as Parameters<typeof buildTranscribeConfig>[0]);

    expect(config.model).to.equal(DeepgramModel.NOVA_2_PHONECALL);
    expect(config).to.not.have.property("endpointing");
  });
});
