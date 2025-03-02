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
const CLAUSE_BOUNDARIES = /[.?!;]+/g;

function textChunksByFirstNaturalPause(text: string) {
  const boundary = text.match(CLAUSE_BOUNDARIES)?.[0];
  if (!boundary) {
    // No pause found, return the entire text as the first chunk
    return [text.trim()];
  }

  const boundaryIndex = text.indexOf(boundary) + boundary.length;
  const firstChunk = text.slice(0, boundaryIndex).trim();
  const secondChunk = text.slice(boundaryIndex).trim();

  return secondChunk ? [firstChunk, secondChunk] : [firstChunk];
}

export { textChunksByFirstNaturalPause };
