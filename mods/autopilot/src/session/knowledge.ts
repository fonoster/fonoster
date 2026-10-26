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
import { KnowledgePassage, passagesText } from "../knowledge/passages";

/**
 * The knowledge port (rework-autopilot A8): one operation, find what is relevant to a question.
 * Implementations (S3 + Unstructured today) are wired by the operator; their keys never live in
 * the agent config.
 */
export interface KnowledgePort {
  find(question: string, signal: AbortSignal): Promise<string>;
  /** The same lookup as passages, with where each came from; used instead of `find` when present. */
  search?(question: string, signal: AbortSignal): Promise<KnowledgePassage[]>;
}

export type { KnowledgePassage };
export { passagesText };

/** A port's lookup as passages: its own `search`, or what `find` returned as one passage. */
export async function searchKnowledge(
  port: KnowledgePort,
  question: string,
  signal: AbortSignal
): Promise<KnowledgePassage[]> {
  if (port.search) return port.search(question, signal);
  const text = (await port.find(question, signal))?.trim();
  return text ? [{ text }] : [];
}

/** Knowledge lookups never hold a reply back longer than this. */
export const KNOWLEDGE_TIMEOUT_MS = 800;

/** Adapts the current knowledge bases (mods/autopilot/src/knowledge) to the port. */
export function fromKnowledgeBase(kb: {
  queryKnowledgeBase(query: string, k?: number): Promise<string>;
  searchKnowledgeBase?(query: string, k?: number): Promise<KnowledgePassage[]>;
}): KnowledgePort {
  return {
    find: (question) => kb.queryKnowledgeBase(question),
    ...(kb.searchKnowledgeBase
      ? { search: (question: string) => kb.searchKnowledgeBase!(question) }
      : {})
  };
}
