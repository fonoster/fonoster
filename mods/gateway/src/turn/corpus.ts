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
// The turn-taking replay corpus format (add-turn-taking task 1.5). A call is a timeline of what
// the caller said (with the truth about each segment) and when the agent was speaking. Language
// neutral: any Detector implementation can be replayed against the same files.

export type SegmentKind = "turn" | "backchannel" | "interruption";

export type CallerSegment = {
  startMs: number;
  endMs: number;
  text: string;
  kind: SegmentKind;
  /** Segments of one caller turn share an id; a pause between them is not an end of turn. */
  turn?: number;
};

export type AgentOutput = {
  startMs: number;
  endMs: number;
  interruptible: boolean;
};

export type CorpusCall = {
  name: string;
  /** Only consented calls may be in a corpus: "synthetic", "internal" or "customer-opt-in". */
  consent: "synthetic" | "internal" | "customer-opt-in";
  language: string;
  segments: CallerSegment[];
  agent: AgentOutput[];
  /** Simulated recognizer latency after each segment ends (default 300 ms). */
  sttLatencyMs?: number;
  /**
   * What the call exercises (for the report's breakdown), e.g. ["long-pause"]. When absent the
   * category is read from the name `<language>-<category>-<n>`.
   */
  tags?: string[];
};

export type Corpus = { format: "fonoster.turn-corpus.v1"; calls: CorpusCall[] };
