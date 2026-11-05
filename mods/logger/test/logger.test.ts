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
import defaultLogger, { configureLogger } from "../src";
import { getSettings } from "../src/envs";

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

describe("@fonoster/logger/logger", function () {
  // The root test run silences logs with LOGS_LEVEL=none; restore whatever
  // was in effect so later test files stay quiet.
  let initial: { level: string; format: "json" | "text" };

  before(function () {
    const { level, format } = getSettings();
    initial = { level, format };
  });

  afterEach(function () {
    configureLogger({ ...initial, transport: "console" });
    return sandbox.restore();
  });

  it("doesn't format a call below the level", function () {
    // Arrange
    configureLogger({ level: "info" });
    let calls = 0;
    const payload = {
      toJSON() {
        calls++;
        return {};
      }
    };

    // Act
    defaultLogger.verbose("dropped", { payload });

    // Assert
    expect(calls).to.equal(0);
  });

  it("renders a kept call the same as before, redacted", function () {
    // Arrange
    sandbox.useFakeTimers(new Date(Date.UTC(2026, 6, 22, 0, 32, 59, 123)));
    configureLogger({ level: "info", format: "json" });
    const capture = new CaptureTransport();
    // Only the capture: keep test output quiet.
    defaultLogger.clear();
    defaultLogger.add(capture);

    // Act
    defaultLogger.info("kept", { password: "x", a: 1 });

    // Assert
    expect(capture.lines).to.deep.equal([
      '{"a":1,"level":"info","message":"kept","password":"[redacted]","timestamp":"2026-07-22T00:32:59.123Z"}'
    ]);
  });

  it("follows a level change made by configureLogger", function () {
    // Arrange
    configureLogger({ level: "info" });

    // Act
    configureLogger({ level: "verbose" });
    const capture = new CaptureTransport();
    // Only the capture: keep test output quiet.
    defaultLogger.clear();
    defaultLogger.add(capture);
    defaultLogger.verbose("now kept");
    defaultLogger.silly("still dropped");

    // Assert
    expect(capture.lines).to.have.length(1);
    expect(capture.lines[0]).to.contain("now kept");
  });
});
