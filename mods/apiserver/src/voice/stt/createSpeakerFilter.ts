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
import { getLogger } from "@fonoster/logger";
import { DiarizeMode } from "./types";

const logger = getLogger({ service: "apiserver", filePath: __filename });

type DeepgramWord = {
  word: string;
  punctuated_word?: string;
  speaker?: number;
};

type SpeakerFilter = {
  // Returns the text to use for this result, or null when every word
  // belonged to a speaker other than the caller.
  apply(params: {
    transcript: string;
    words: DeepgramWord[];
    isFinal: boolean;
  }): string | null;
};

function toText(words: DeepgramWord[]) {
  return words.map((w) => w.punctuated_word ?? w.word).join(" ");
}

function groupBySpeaker(words: DeepgramWord[]) {
  const speakers = [...new Set(words.map((w) => w.speaker!))];

  return speakers.map((speaker) => {
    const list = words.filter((w) => w.speaker === speaker);
    return { speaker, words: list.length, text: toText(list) };
  });
}

/**
 * Keeps the caller's words from a diarized Deepgram result. State is kept
 * per filter, so create one per stream (one per call).
 *
 * Only finalized results update the state: interim results repeat words and
 * change their guesses, so counting them would double-count and flip-flop.
 */
function createSpeakerFilter(mode: DiarizeMode): SpeakerFilter {
  let callerSpeaker: number | undefined;
  const wordCounts = new Map<number, number>();
  let warnedMissingSpeaker = false;

  const updateState = (words: DeepgramWord[]) => {
    if (mode === DiarizeMode.FIRST && callerSpeaker === undefined) {
      callerSpeaker = words[0].speaker;
      return;
    }

    if (mode === DiarizeMode.DOMINANT) {
      words.forEach((word) =>
        wordCounts.set(word.speaker!, (wordCounts.get(word.speaker!) ?? 0) + 1)
      );
    }
  };

  const getCallerSpeaker = (): number | undefined => {
    if (mode === DiarizeMode.FIRST) {
      return callerSpeaker;
    }

    // Dominant: the speaker with strictly the most words; none on a tie
    const ranked = [...wordCounts.entries()].sort((a, b) => b[1] - a[1]);

    if (ranked.length === 0 || ranked[0][1] === ranked[1]?.[1]) {
      return undefined;
    }

    return ranked[0][0];
  };

  return {
    apply({ transcript, words, isFinal }) {
      if (words.length === 0) {
        return transcript;
      }

      if (words.some((w) => w.speaker === undefined)) {
        if (!warnedMissingSpeaker) {
          logger.warn(
            "deepgram diarization is on but words have no speaker; passing transcript through",
            { mode }
          );
          warnedMissingSpeaker = true;
        }
        return transcript;
      }

      if (mode === DiarizeMode.LOG) {
        if (isFinal) {
          logger.info("deepgram diarization", {
            mode,
            speakers: groupBySpeaker(words)
          });
        }
        return transcript;
      }

      if (isFinal) {
        updateState(words);
      }

      const speaker = getCallerSpeaker();

      if (speaker === undefined) {
        return transcript;
      }

      const kept = words.filter((w) => w.speaker === speaker);

      if (kept.length === words.length) {
        return transcript;
      }

      logger.verbose("deepgram diarization dropped words", {
        mode,
        callerSpeaker: speaker,
        dropped: toText(words.filter((w) => w.speaker !== speaker))
      });

      return kept.length > 0 ? toText(kept) : null;
    }
  };
}

export { createSpeakerFilter, DeepgramWord, SpeakerFilter };
