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
import { createNumberRequestSchema } from "../../src/validators/sipnet/numbers";

describe("@common[validators/sipnet/numbers]", function () {
  const number = {
    name: "London desk",
    telUrl: "tel:+442036705880",
    city: "London",
    country: "United Kingdom",
    countryIsoCode: "GB",
    appRef: "123"
  };

  it("accepts a telUrl that is tel: and an E.164 number", function () {
    expect(createNumberRequestSchema.safeParse(number).success).to.equal(true);
  });

  ["tel:442036705880", "tel:02036705880", "tel:+0123", "+442036705880"].forEach(
    (telUrl) => {
      it(`rejects the telUrl ${telUrl}`, function () {
        const result = createNumberRequestSchema.safeParse({
          ...number,
          telUrl
        });

        expect(result.success).to.equal(false);
        expect(result.error?.issues[0].path).to.deep.equal(["telUrl"]);
        expect(result.error?.issues[0].message).to.equal(
          "Must be tel: and an E.164 number, such as tel:+18095550123"
        );
      });
    }
  );
});
