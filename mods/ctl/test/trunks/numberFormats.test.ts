/**
 * Copyright (C) 2026 by Fonoster Inc (https://fonoster.com)
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
import { NumberFormat } from "@fonoster/types";
import { expect } from "chai";
import { askNumberFormats } from "../../src/utils/numberFormatQuestions";

/** Prompts that answer from a script and remember what they asked. */
function scripted(formats: NumberFormat[], prefixes: string[]) {
  const asked: string[] = [];
  return {
    asked,
    prompts: {
      select: async (config: { message: string }) => {
        asked.push(config.message);
        return formats.shift()!;
      },
      input: async (config: { message: string }) => {
        asked.push(config.message);
        return prefixes.shift()!;
      }
    }
  };
}

describe("@ctl[sipnet:trunks] number format questions", function () {
  it("asks for a prefix only after E.164 without +, National or International", async function () {
    for (const format of [
      NumberFormat.E164_WITHOUT_PLUS,
      NumberFormat.NATIONAL,
      NumberFormat.INTERNATIONAL
    ]) {
      const { asked, prompts } = scripted(
        [format, NumberFormat.NUMBER_FORMAT_UNSPECIFIED],
        ["9#"]
      );
      expect(await askNumberFormats(prompts)).to.deep.equal({
        calledNumberFormat: format,
        calledNumberPrefix: "9#"
      });
      expect(asked).to.deep.equal([
        "Called number format",
        "Called number prefix (optional: digits, * and #)",
        "Caller number format"
      ]);
    }
    const { asked, prompts } = scripted(
      [NumberFormat.E164, NumberFormat.NUMBER_FORMAT_UNSPECIFIED],
      []
    );
    expect(await askNumberFormats(prompts)).to.deep.equal({
      calledNumberFormat: NumberFormat.E164
    });
    expect(asked).to.deep.equal([
      "Called number format",
      "Caller number format"
    ]);
  });

  it("on update sends every field, \"\" for a prefix Leave as is or +E.164 doesn't take", async function () {
    const { prompts } = scripted(
      [NumberFormat.NUMBER_FORMAT_UNSPECIFIED, NumberFormat.E164],
      []
    );
    expect(
      await askNumberFormats(prompts, {
        calledNumberFormat: NumberFormat.NATIONAL,
        calledNumberPrefix: "9"
      })
    ).to.deep.equal({
      calledNumberFormat: NumberFormat.NUMBER_FORMAT_UNSPECIFIED,
      calledNumberPrefix: "",
      callerNumberFormat: NumberFormat.E164,
      callerNumberPrefix: ""
    });
  });
});
