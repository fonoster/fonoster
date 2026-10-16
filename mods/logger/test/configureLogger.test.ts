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
import winston from "winston";
import defaultLogger, { configureLogger, getLogger } from "../src";

describe("@logger[configureLogger]", function () {
  // The root test run silences logs with LOGS_LEVEL=none; restore whatever
  // was in effect so later test files stay quiet.
  let initialLevel: string;

  before(function () {
    initialLevel = defaultLogger.level;
  });

  afterEach(function () {
    configureLogger({ level: initialLevel, transport: "console" });
  });

  it("updates loggers created before it was called", function () {
    const early = getLogger({ service: "early-test", filePath: __filename });

    configureLogger({ level: "debug" });

    expect(early.level).to.equal("debug");
    expect(early.isLevelEnabled("debug")).to.be.true;
    expect(defaultLogger.level).to.equal("debug");
  });

  it("applies to loggers created afterwards", function () {
    configureLogger({ level: "warn" });

    const late = getLogger({ service: "late-test", filePath: __filename });

    expect(late.level).to.equal("warn");
    expect(late.isLevelEnabled("info")).to.be.false;
  });

  it("swaps transports on every logger", function () {
    const logger = getLogger({ service: "transport-test", filePath: __filename });

    configureLogger({ transport: "console" });

    expect(logger.transports).to.have.length(1);
    expect(logger.transports[0]).to.be.instanceOf(winston.transports.Console);
  });

  it("keeps settings that weren't given", function () {
    configureLogger({ level: "verbose" });
    configureLogger({ format: "text" });

    expect(
      getLogger({ service: "keep-test", filePath: __filename }).level
    ).to.equal("verbose");
  });
});
