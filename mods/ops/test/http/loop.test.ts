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
import * as sinon from "sinon";
import { startLoop } from "../../src/interop/startLoop";

describe("@ops/http loop", function () {
  let clock: sinon.SinonFakeTimers;

  beforeEach(function () {
    clock = sinon.useFakeTimers({ toFake: ["setTimeout"] });
  });

  afterEach(function () {
    clock.restore();
  });

  const settle = () => new Promise((r) => setImmediate(r));

  it("runs the first pass right away, and no second one while it runs", async function () {
    const ends: (() => void)[] = [];
    const pass = sinon.stub().callsFake(
      () =>
        new Promise<void>((resolve) => {
          ends.push(resolve);
        })
    );
    startLoop(pass, 1000);
    expect(pass.callCount).to.equal(1);

    clock.tick(5000);
    await settle();
    expect(pass.callCount).to.equal(1);

    ends[0]();
    await settle();
    expect(pass.callCount).to.equal(1);
    clock.tick(999);
    expect(pass.callCount).to.equal(1);
    clock.tick(1);
    expect(pass.callCount).to.equal(2);
  });
});
