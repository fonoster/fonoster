/*
 * Copyright (C) 2022 by Fonoster Inc (https://fonoster.com)
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
import sinon from "sinon";
import sinonChai from "sinon-chai";
import chaiAsPromised from "chai-as-promised";
import { objectToQString } from "../src/utils";
const expect = chai.expect;
chai.use(sinonChai);
chai.use(chaiAsPromised);
const sandbox = sinon.createSandbox();

describe("@fonoster/voice/utils", () => {
  it("will convert an object to a query string", () => {
    const testObject = {
      optionA: "A",
      optionB: "B",
      optionC: undefined
    };
    expect(objectToQString(testObject)).to.be.equal("optionA=A&optionB=B");
    expect(objectToQString({ sharp: "#", n: "121G" })).to.be.equal(
      "sharp=%23&n=121G"
    );
    expect(objectToQString()).to.be.equal("");
  });
});
