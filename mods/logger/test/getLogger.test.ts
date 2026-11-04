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
import winston from "winston";
import { configureLogger } from "../src";
import { getSettings } from "../src/envs";
import { getLogger } from "../src/getLogger";

const MESSAGE = Symbol.for("message");
const sandbox = createSandbox();

/** A transport that keeps every rendered line instead of writing it. */
class CaptureTransport extends winston.Transport {
  lines: string[] = [];

  log(info: Record<string | symbol, unknown>, next: () => void) {
    this.lines.push(info[MESSAGE] as string);
    next();
  }
}

describe("@fonoster/logger/getLogger", function () {
  // The root test run silences logs with LOGS_LEVEL=none; restore whatever
  // was in effect so later test files stay quiet.
  let initialLevel: string;

  before(function () {
    initialLevel = getSettings().level;
  });

  afterEach(function () {
    configureLogger({ level: initialLevel, transport: "console" });
    return sandbox.restore();
  });

  it("renders the day of the month, not the day of the week, in the timestamp", function () {
    // 22 July 2026 is a Wednesday: lowercase `dd` rendered the weekday index, 03.
    sandbox.useFakeTimers(new Date(2026, 6, 22, 0, 32, 59, 123));
    const logger = getLogger({
      service: "timestamp-test",
      filePath: __filename
    });
    logger.level = "info";

    const info = logger.format.transform({ level: "info", message: "hello" });

    expect(info.timestamp).to.equal("2026-07-22 00:32:59.123");
  });

  it("doesn't format a call below the level", function () {
    // Arrange
    configureLogger({ level: "info" });
    const logger = getLogger({ service: "gate-test", filePath: __filename });
    let calls = 0;
    const payload = {
      toJSON() {
        calls++;
        return {};
      }
    };

    // Act
    logger.verbose("dropped", { payload });

    // Assert
    expect(calls).to.equal(0);
  });

  it("renders a kept call the same as before, redacted", function () {
    // Arrange
    sandbox.useFakeTimers(new Date(2026, 6, 22, 0, 32, 59, 123));
    configureLogger({ level: "info" });
    const logger = getLogger({ service: "kept-test", filePath: __filename });
    const capture = new CaptureTransport();
    // Only the capture: keep test output quiet.
    logger.clear();
    logger.add(capture);

    // Act
    logger.info("kept", { password: "x", a: 1 });

    // Assert
    expect(capture.lines).to.deep.equal([
      '2026-07-22 00:32:59.123 [info]: (kept-test) kept {"password":"[redacted]","a":1}'
    ]);
  });

  it("follows a level change made by configureLogger", function () {
    // Arrange
    configureLogger({ level: "info" });
    const logger = getLogger({ service: "level-test", filePath: __filename });

    // Act
    configureLogger({ level: "verbose" });
    const capture = new CaptureTransport();
    // Only the capture: keep test output quiet.
    logger.clear();
    logger.add(capture);
    logger.verbose("now kept");
    logger.silly("still dropped");

    // Assert
    expect(capture.lines).to.have.length(1);
    expect(capture.lines[0]).to.contain("now kept");
  });
});
