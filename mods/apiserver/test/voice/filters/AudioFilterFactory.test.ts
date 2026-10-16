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
import * as chai from "chai";
import { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import {
  AudioFilterFactory,
  audioFiltersConfigSchema
} from "../../../src/voice/filters";

chai.use(chaiAsPromised);

describe("@voice/filters/AudioFilterFactory", function () {
  beforeEach(function () {
    process.env.AIC_SDK_LICENSE = "test-license";
  });

  afterEach(function () {
    delete process.env.AIC_SDK_LICENSE;
  });

  it("creates the registered filter with default options", function () {
    // Act
    const filter = AudioFilterFactory.createFilter({ name: "aiCoustics" });

    // Assert
    expect(filter.name).to.equal("aiCoustics");
  });

  it("rejects invalid options with a message naming the filter", function () {
    expect(() =>
      AudioFilterFactory.createFilter({
        name: "aiCoustics",
        options: { enhancementLevel: "loud" }
      })
    ).to.throw(/aiCoustics.*enhancementLevel/);
  });

  it("throws for an unknown filter and lists the available ones", function () {
    expect(() => AudioFilterFactory.createFilter({ name: "nope" })).to.throw(
      /Unknown audio filter "nope".*aiCoustics/
    );
  });

  it("builds a chain from config", async function () {
    // Arrange: the filter passes audio through until its model is ready
    const chain = AudioFilterFactory.createChainFromConfig([
      { name: "aiCoustics", options: { enhancementLevel: 0.5 } }
    ]);

    // Act
    await chain.process(new Int16Array(320));

    // Assert
    expect(chain.getStats().filters.map((f) => f.name)).to.deep.equal([
      "aiCoustics"
    ]);
  });

  it("builds an empty chain from an empty config", async function () {
    // Arrange
    const chain = AudioFilterFactory.createChainFromConfig([]);
    const frame = new Int16Array(320);

    // Act & Assert
    expect(await chain.process(frame)).to.equal(frame);
  });

  it("validates the config shape", function () {
    expect(audioFiltersConfigSchema.safeParse([{ name: "aiCoustics" }]).success)
      .to.be.true;
    expect(audioFiltersConfigSchema.safeParse([{ options: {} }]).success).to.be
      .false;
    expect(audioFiltersConfigSchema.safeParse({ name: "aiCoustics" }).success)
      .to.be.false;
  });

  it("refuses filesystem and environment options from an application", function () {
    // Arrange: these read the media server's disk and env, so they are not
    // something a voice application may set
    const offLimits = [
      { modelDir: "/etc" },
      { modelFile: "/etc/passwd" },
      { autoDownload: false },
      { licenseEnv: "AWS_SECRET_ACCESS_KEY" }
    ];

    // Act & Assert
    offLimits.forEach((options) =>
      expect(() =>
        AudioFilterFactory.createFilter({ name: "aiCoustics", options })
      ).to.throw(/Invalid options/)
    );
  });

  it("allows those options for callers inside the media server", function () {
    expect(() =>
      AudioFilterFactory.createFilter(
        { name: "aiCoustics", options: { modelDir: "./models" } },
        { trusted: true }
      )
    ).to.not.throw();
  });

  it("rejects a model name that could walk the filesystem", function () {
    expect(() =>
      AudioFilterFactory.createFilter({
        name: "aiCoustics",
        options: { model: "../../etc/passwd" }
      })
    ).to.throw(/Invalid model name/);
  });

  it("closes filters it already built when a later one is invalid", function () {
    // Arrange: the first filter is real and holds a model, the second is not
    const closes: string[] = [];
    const original = AudioFilterFactory.createFilter.bind(AudioFilterFactory);
    AudioFilterFactory.createFilter = ((config, options) => {
      if (config.name === "nope") {
        throw new Error('Unknown audio filter "nope"');
      }
      const filter = original(config, options);
      return { ...filter, close: () => closes.push(config.name) };
    }) as typeof AudioFilterFactory.createFilter;

    // Act
    try {
      expect(() =>
        AudioFilterFactory.createChainFromConfig([
          { name: "aiCoustics" },
          { name: "nope" }
        ])
      ).to.throw(/Unknown audio filter/);
    } finally {
      AudioFilterFactory.createFilter = original;
    }

    // Assert
    expect(closes).to.deep.equal(["aiCoustics"]);
  });

  it("lists registered filters with their defaults", function () {
    // Act
    const aiCoustics = AudioFilterFactory.listFilters().find(
      (f) => f.name === "aiCoustics"
    );

    // Assert
    expect(aiCoustics?.defaults).to.include({
      model: "quail-vf-2.2-s-16khz",
      enhancementLevel: 1,
      bypass: false
    });
  });
});
