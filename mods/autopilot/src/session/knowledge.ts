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
/**
 * The knowledge port (rework-autopilot A8): one operation, find what is relevant to a question.
 * Implementations (S3 + Unstructured today) are wired by the operator; their keys never live in
 * the assistant config.
 */
export interface KnowledgePort {
  find(question: string, signal: AbortSignal): Promise<string>;
}

/** Knowledge lookups never hold a reply back longer than this. */
export const KNOWLEDGE_TIMEOUT_MS = 800;

/** Adapts the current knowledge bases (mods/autopilot/src/knowledge) to the port. */
export function fromKnowledgeBase(kb: {
  queryKnowledgeBase(query: string, k?: number): Promise<string>;
}): KnowledgePort {
  return { find: (question) => kb.queryKnowledgeBase(question) };
}
