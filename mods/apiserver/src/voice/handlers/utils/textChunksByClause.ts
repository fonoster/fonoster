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
  
  // Use reduce instead of a for loop to build the chunks
  const { chunks, start } = boundaries.reduce(
    (acc, boundary, index) => {
      // If we already have 2 or more chunks, don't process more
      if (acc.chunks.length >= 2) {
        return acc;
      }
      
      const end = boundary.index + boundary[0].length;
      const chunk = text.slice(acc.start, end).trim();
      
      return {
        chunks: [...acc.chunks, chunk],
        start: end
      };
    },
    { chunks: [] as string[], start: 0 }
  );

  const remainingText = text.slice(start).trim();
  const finalChunks = remainingText.length > 0 
    ? [...chunks, remainingText] 
    : chunks;

  return finalChunks;
}

export { textChunkTextByClause };
