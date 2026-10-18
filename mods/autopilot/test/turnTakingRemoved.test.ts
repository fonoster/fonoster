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
import * as fs from "fs";
import * as path from "path";
import { sessionAssistantSchema } from "@fonoster/common";
import { expect } from "chai";

// add-turn-taking 3.1: turn-taking lives in the gateway. Autopilot carries no VAD, no speech-wait
// timer, no late-speech or barge-in detection of its own; assistants that still name those
// settings are rejected with a message saying where they moved.

const ROOT = path.join(__dirname, "..");

function sources(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? sources(p) : p.endsWith(".ts") ? [p] : [];
  });
}

describe("@autopilot[turn-taking moved to the gateway]", function () {
  it("ships no VAD model or runtime", function () {
    const pkg = JSON.parse(
      fs.readFileSync(path.join(ROOT, "package.json"), "utf8")
    );
    expect(Object.keys(pkg.dependencies ?? {})).to.not.include(
      "onnxruntime-node"
    );
    expect(fs.existsSync(path.join(ROOT, "src", "vad"))).to.equal(false);
    const offenders = sources(path.join(ROOT, "src"))
      .filter((f) =>
        /silero|maxSpeechWaitTimeout|hasLateSpeech|SPEECH_START|SPEECH_END|SPEECH_RESULT/i.test(
          fs.readFileSync(f, "utf8")
        )
      )
      .map((f) => path.relative(ROOT, f));
    expect(offenders).to.deep.equal([]);
  });

  it("rejects VAD-era assistant settings", function () {
    const result = sessionAssistantSchema.safeParse({
      conversationSettings: {
        systemPrompt: "x",
        goodbyeMessage: "x",
        systemErrorMessage: "x",
        maxSpeechWaitTimeout: 500,
        vad: { activationThreshold: 0.5 }
      },
      languageModel: { model: "openai/gpt-4o-mini" }
    });
    expect(result.success).to.equal(false);
    expect(JSON.stringify(result.error?.issues)).to.match(/gateway/);
  });
});
