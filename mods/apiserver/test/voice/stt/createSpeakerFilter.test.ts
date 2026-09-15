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
import {
  createSpeakerFilter,
  DeepgramWord
} from "../../../src/voice/stt/createSpeakerFilter";
import { DiarizeMode } from "../../../src/voice/stt/types";

// Builds words from "speaker:word" tokens, e.g. words("0:yes 1:hello")
function words(spec: string): DeepgramWord[] {
  return spec.split(" ").map((token) => {
    const [speaker, word] = token.split(":");
    return { word, punctuated_word: word, speaker: Number(speaker) };
  });
}

function transcriptOf(list: DeepgramWord[]) {
  return list.map((w) => w.word).join(" ");
}

function result(spec: string, isFinal = true) {
  const list = words(spec);
  return { transcript: transcriptOf(list), words: list, isFinal };
}

describe("@voice/stt/createSpeakerFilter", function () {
  describe("log mode", function () {
    it("returns the transcript unchanged with several speakers", function () {
      // Arrange
      const filter = createSpeakerFilter(DiarizeMode.LOG);

      // Act
      const text = filter.apply(result("0:my 0:account 1:goal 1:scored"));

      // Assert
      expect(text).to.equal("my account goal scored");
    });
  });

  describe("first mode", function () {
    it("locks onto the first speaker and drops the others afterward", function () {
      // Arrange
      const filter = createSpeakerFilter(DiarizeMode.FIRST);

      // Act
      const first = filter.apply(result("0:hello 0:there"));
      const second = filter.apply(result("1:breaking 0:yes 1:news"));

      // Assert
      expect(first).to.equal("hello there");
      expect(second).to.equal("yes");
    });

    it("does not lock onto a speaker from an interim result", function () {
      // Arrange
      const filter = createSpeakerFilter(DiarizeMode.FIRST);

      // Act
      const interim = filter.apply(result("1:tv 1:noise", false));
      filter.apply(result("0:hello"));
      const later = filter.apply(result("1:tv 0:yes"));

      // Assert
      expect(interim).to.equal("tv noise");
      expect(later).to.equal("yes");
    });

    it("passes the transcript through before a lock exists", function () {
      // Arrange
      const filter = createSpeakerFilter(DiarizeMode.FIRST);

      // Act
      const text = filter.apply(result("0:hi 1:there", false));

      // Assert
      expect(text).to.equal("hi there");
    });

    it("returns null when every word belongs to another speaker", function () {
      // Arrange
      const filter = createSpeakerFilter(DiarizeMode.FIRST);
      filter.apply(result("0:hello"));

      // Act
      const text = filter.apply(result("1:breaking 1:news"));

      // Assert
      expect(text).to.be.null;
    });
  });

  describe("dominant mode", function () {
    it("keeps the speaker with the most finalized words", function () {
      // Arrange
      const filter = createSpeakerFilter(DiarizeMode.DOMINANT);
      filter.apply(result("0:i 0:want 0:to 0:pay 1:ok"));

      // Act
      const text = filter.apply(result("1:weather 0:today"));

      // Assert
      expect(text).to.equal("today");
    });

    it("switches the leader as counts grow", function () {
      // Arrange
      const filter = createSpeakerFilter(DiarizeMode.DOMINANT);
      filter.apply(result("1:the 1:news"));

      // Act
      const before = filter.apply(result("1:tonight 0:yes", false));
      filter.apply(result("0:i 0:am 0:calling 0:about 0:my 0:bill"));
      const after = filter.apply(result("1:tonight 0:yes"));

      // Assert
      expect(before).to.equal("tonight");
      expect(after).to.equal("yes");
    });

    it("passes the transcript through on a tie", function () {
      // Arrange
      const filter = createSpeakerFilter(DiarizeMode.DOMINANT);

      // Act
      const text = filter.apply(result("0:hi 1:there"));

      // Assert
      expect(text).to.equal("hi there");
    });

    it("does not count words from interim results", function () {
      // Arrange
      const filter = createSpeakerFilter(DiarizeMode.DOMINANT);
      filter.apply(result("0:hello"));

      // Act
      filter.apply(result("1:a 1:b 1:c 1:d", false));
      const text = filter.apply(result("1:tv 0:yes", false));

      // Assert
      expect(text).to.equal("yes");
    });

    it("returns null when every word belongs to a non-leader", function () {
      // Arrange
      const filter = createSpeakerFilter(DiarizeMode.DOMINANT);
      filter.apply(result("0:i 0:want 0:to 0:pay"));

      // Act
      const text = filter.apply(result("1:goal", false));

      // Assert
      expect(text).to.be.null;
    });
  });

  it("passes the transcript through when words have no speaker", function () {
    // Arrange
    const filter = createSpeakerFilter(DiarizeMode.FIRST);
    filter.apply(result("0:hello"));

    // Act
    const text = filter.apply({
      transcript: "no speakers here",
      words: [{ word: "no" }, { word: "speakers" }, { word: "here" }],
      isFinal: true
    });

    // Assert
    expect(text).to.equal("no speakers here");
  });

  it("passes the transcript through when there are no words", function () {
    // Arrange
    const filter = createSpeakerFilter(DiarizeMode.DOMINANT);

    // Act
    const text = filter.apply({ transcript: "", words: [], isFinal: true });

    // Assert
    expect(text).to.equal("");
  });

  it("rebuilds text from punctuated_word, falling back to word", function () {
    // Arrange
    const filter = createSpeakerFilter(DiarizeMode.FIRST);
    filter.apply(result("0:hello"));

    // Act
    const text = filter.apply({
      transcript: "Yes, please. goal",
      words: [
        { word: "yes", punctuated_word: "Yes,", speaker: 0 },
        { word: "please", speaker: 0 },
        { word: "goal", punctuated_word: "Goal!", speaker: 1 }
      ],
      isFinal: true
    });

    // Assert
    expect(text).to.equal("Yes, please");
  });
});
