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
/** One passage a knowledge search found: its text, the document it came from and its score. */
export type KnowledgePassage = {
  text: string;
  source?: string;
  score?: number;
};

/**
 * Each passage is cut at this many characters before it goes into the model's prompt: the
 * splitter's chunk size, so a normal passage goes in whole and a loader that skips splitting
 * can't flood the prompt.
 */
export const MAX_PROMPT_PASSAGE_TEXT = 1000;

/** The passages as the model sees them: their text, each capped, one per line. */
export function passagesText(passages: KnowledgePassage[]): string {
  return passages
    .map((p) =>
      p.text.length > MAX_PROMPT_PASSAGE_TEXT
        ? `${p.text.slice(0, MAX_PROMPT_PASSAGE_TEXT)}…`
        : p.text
    )
    .join("\n");
}
