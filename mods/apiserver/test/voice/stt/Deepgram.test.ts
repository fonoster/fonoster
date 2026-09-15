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
import { EventEmitter } from "events";
import { PassThrough } from "stream";
import { VoiceLanguage } from "@fonoster/common";
import { expect } from "chai";
import { createSandbox } from "sinon";
import {
  buildTranscribeConfig,
  Deepgram
} from "../../../src/voice/stt/Deepgram";
import { DeepgramModel, DiarizeMode } from "../../../src/voice/stt/types";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { LiveTranscriptionEvents } = require("@deepgram/sdk");

const sandbox = createSandbox();

const baseConfig = {
  languageCode: VoiceLanguage.EN_US,
  model: DeepgramModel.NOVA_3,
  smartFormat: true,
  noDelay: true
};

// Builds a live Results event from "speaker:word" tokens
function transcriptEvent(
  spec: string,
  flags: { is_final?: boolean; speech_final?: boolean }
) {
  const words = spec.split(" ").map((token, i) => {
    const [speaker, word] = token.split(":");
    return {
      word,
      punctuated_word: word,
      start: i,
      end: i + 0.5,
      confidence: 0.9,
      speaker: Number(speaker)
    };
  });

  return {
    ...flags,
    channel: {
      alternatives: [{ transcript: words.map((w) => w.word).join(" "), words }]
    }
  };
}

function setup(configOverrides: Record<string, unknown> = {}) {
  const connection = Object.assign(new EventEmitter(), {
    send: sandbox.stub(),
    destroy: sandbox.stub()
  });

  const deepgram = new Deepgram({
    config: { ...baseConfig, ...configOverrides },
    credentials: { apiKey: "test" }
  });

  const live = sandbox.stub().returns(connection);
  deepgram.client = { listen: { live } };

  const speech: string[] = [];
  const out = deepgram.streamTranscribe(new PassThrough());
  out.on("data", (result) => speech.push(result.speech));

  connection.emit(LiveTranscriptionEvents.Open);

  return { connection, live, speech };
}

describe("@voice/stt/Deepgram", function () {
  afterEach(function () {
    sandbox.restore();
  });

  describe("config validation", function () {
    const schema = Deepgram.getConfigValidationSchema();

    it("accepts diarize with each mode", function () {
      for (const mode of Object.values(DiarizeMode)) {
        expect(schema.safeParse({ diarize: true, diarizeMode: mode }).success)
          .to.be.true;
      }
    });

    it("accepts existing configs without diarize fields", function () {
      expect(schema.safeParse(baseConfig).success).to.be.true;
    });

    it("rejects an unknown diarize mode", function () {
      expect(
        schema.safeParse({ diarize: true, diarizeMode: "loudest" }).success
      ).to.be.false;
    });

    it("rejects a non-boolean diarize flag", function () {
      expect(schema.safeParse({ diarize: "yes" }).success).to.be.false;
    });
  });

  describe("buildTranscribeConfig", function () {
    it("does not send diarize when the flag is missing", function () {
      expect(buildTranscribeConfig(baseConfig)).to.not.have.property("diarize");
    });

    it("does not send diarize when the flag is off", function () {
      const config = buildTranscribeConfig({ ...baseConfig, diarize: false });
      expect(config).to.not.have.property("diarize");
    });

    it("sends diarize when the flag is on", function () {
      const config = buildTranscribeConfig({ ...baseConfig, diarize: true });
      expect(config).to.have.property("diarize", true);
    });

    it("never sends diarizeMode", function () {
      const config = buildTranscribeConfig({
        ...baseConfig,
        diarize: true,
        diarizeMode: DiarizeMode.FIRST
      });
      expect(config).to.not.have.property("diarizeMode");
    });
  });

  describe("streamTranscribe", function () {
    it("emits the full transcript when diarization is off", function () {
      // Arrange
      const { connection, live, speech } = setup();

      // Act
      connection.emit(
        LiveTranscriptionEvents.Transcript,
        transcriptEvent("0:hello 1:breaking 1:news", { speech_final: true })
      );

      // Assert
      expect(live.firstCall.args[0]).to.not.have.property("diarize");
      expect(speech).to.deep.equal(["hello breaking news"]);
    });

    it("emits only the caller's words in first mode", function () {
      // Arrange
      const { connection, live, speech } = setup({
        diarize: true,
        diarizeMode: DiarizeMode.FIRST
      });

      // Act
      connection.emit(
        LiveTranscriptionEvents.Transcript,
        transcriptEvent("0:hello", { is_final: true, speech_final: true })
      );
      connection.emit(
        LiveTranscriptionEvents.Transcript,
        transcriptEvent("1:breaking 0:yes 1:news", {
          is_final: true,
          speech_final: true
        })
      );

      // Assert
      expect(live.firstCall.args[0]).to.have.property("diarize", true);
      expect(speech).to.deep.equal(["hello", "yes"]);
    });

    it("emits nothing when a result is entirely another speaker", function () {
      // Arrange
      const { connection, speech } = setup({
        diarize: true,
        diarizeMode: DiarizeMode.FIRST
      });

      // Act
      connection.emit(
        LiveTranscriptionEvents.Transcript,
        transcriptEvent("0:hello", { is_final: true, speech_final: true })
      );
      connection.emit(
        LiveTranscriptionEvents.Transcript,
        transcriptEvent("1:breaking 1:news", {
          is_final: true,
          speech_final: true
        })
      );

      // Assert
      expect(speech).to.deep.equal(["hello"]);
    });

    it("uses the filtered transcript for the UtteranceEnd fallback", function () {
      // Arrange
      const { connection, speech } = setup({
        diarize: true,
        diarizeMode: DiarizeMode.FIRST
      });
      connection.emit(
        LiveTranscriptionEvents.Transcript,
        transcriptEvent("0:hello", { is_final: true, speech_final: true })
      );

      // Act
      connection.emit(
        LiveTranscriptionEvents.Transcript,
        transcriptEvent("1:breaking 0:yes 1:news", {})
      );
      connection.emit(LiveTranscriptionEvents.UtteranceEnd, {});

      // Assert
      expect(speech).to.deep.equal(["hello", "yes"]);
    });

    it("drops a mislabeled interim when its finalized result is another speaker", function () {
      // Arrange
      const { connection, speech } = setup({
        diarize: true,
        diarizeMode: DiarizeMode.FIRST
      });
      connection.emit(
        LiveTranscriptionEvents.Transcript,
        transcriptEvent("0:hello", { is_final: true, speech_final: true })
      );

      // Act
      connection.emit(
        LiveTranscriptionEvents.Transcript,
        transcriptEvent("0:and 0:now 0:the", {})
      );
      connection.emit(
        LiveTranscriptionEvents.Transcript,
        transcriptEvent("1:and 1:now 1:the 1:weather", {
          is_final: true,
          speech_final: true
        })
      );
      connection.emit(LiveTranscriptionEvents.UtteranceEnd, {});

      // Assert
      expect(speech).to.deep.equal(["hello"]);
    });

    it("keeps the transcript unchanged in log mode", function () {
      // Arrange
      const { connection, speech } = setup({ diarize: true });

      // Act
      connection.emit(
        LiveTranscriptionEvents.Transcript,
        transcriptEvent("0:hello 1:breaking 1:news", {
          is_final: true,
          speech_final: true
        })
      );

      // Assert
      expect(speech).to.deep.equal(["hello breaking news"]);
    });
  });
});
