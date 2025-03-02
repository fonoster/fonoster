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

function textChunkTextByClause(text: string) {
  const boundaries = [...text.matchAll(CLAUSE_BOUNDARIES)];
  const chunks = [];
  let start = 0;

  for (let i = 0; i < boundaries.length; i++) {
    if (chunks.length >= 2) {
      break;
    }
    const boundary = boundaries[i];
    const end = boundary.index + boundary[0].length;
    chunks.push(text.slice(start, end).trim());
    start = end;
  }

  const remainingText = text.slice(start).trim();
  if (remainingText.length > 0) {
    chunks.push(remainingText);
  }

  return chunks;
}

export { textChunkTextByClause };
