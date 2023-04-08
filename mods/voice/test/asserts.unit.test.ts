/*
 * Copyright (C) 2023 by Fonoster Inc (https://fonoster.com)
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
import chai from "chai";
import sinonChai from "sinon-chai";
import chaiAsPromised from "chai-as-promised";
import {
  assertsFinishOnKeyIsChar,
  assertsValueIsPositive,
  assertsValuesIsZeroOrGreater
} from "../src/asserts";
const expect = chai.expect;
chai.use(sinonChai);
chai.use(chaiAsPromised);

describe("@fonoster/voice/asserts", () => {
  it("ensures that numDigits and timeout are both positive numbers", () => {
    expect(() => assertsValueIsPositive("numDigits", 0)).to.throw(
      "the option 'numDigits' must be a number greater than zero"
    );
    expect(() => assertsValueIsPositive("numDigits", -1)).to.throw(
      "the option 'numDigits' must be a number greater than zero"
    );
    expect(() => assertsValueIsPositive("numDigits", 0)).to.not.throw;
    expect(() => assertsValuesIsZeroOrGreater("timeout", 0)).to.not.throw;
    expect(() => assertsValuesIsZeroOrGreater("timeout", -1)).to.throw(
      "the option 'timeout' must be a number equal or greater than zero"
    );
  });

  it("finish on key is on the keypad", () => {
    expect(() => assertsFinishOnKeyIsChar("-1")).to.throw(
      "the option 'finishOnKey' must be a single char [0-9], *, or #"
    );
    expect(() => assertsFinishOnKeyIsChar("01")).to.throw(
      "the option 'finishOnKey' must be a single char [0-9], *, or #"
    );
    expect(() => assertsFinishOnKeyIsChar("0")).to.not.throw;
  });
});
