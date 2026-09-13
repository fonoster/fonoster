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
import { expect } from "chai";
import { createSandbox } from "sinon";
import { getLogger } from "../src/getLogger";

const sandbox = createSandbox();

describe("@fonoster/logger/getLogger", function () {
  afterEach(function () {
    return sandbox.restore();
  });

  it("renders the day of the month, not the day of the week, in the timestamp", function () {
    // 22 July 2026 is a Wednesday: lowercase `dd` rendered the weekday index, 03.
    sandbox.useFakeTimers(new Date(2026, 6, 22, 0, 32, 59, 123));
    const logger = getLogger({
      service: "timestamp-test",
      filePath: __filename
    });

    const info = logger.format.transform({ level: "info", message: "hello" });

    expect(info.timestamp).to.equal("2026-07-22 00:32:59.123");
  });
});
