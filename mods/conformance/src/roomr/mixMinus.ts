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
import { RATE } from "./rtp";

// The mix-minus checker (roomr "Rooms mix audio for their participants"), across SIP legs and
// RTP participants alike (redesign-roomr 11.3): each sending party plays its own tone, and the
// checker reads which of those tones each party heard. Mix-minus holds when every party hears
// every other sender and never its own tone.

/** Amplitude (peak, in samples) of the `hz` component of `pcm` (Goertzel). */
export function toneAmplitude(
  pcm: Int16Array,
  hz: number,
  rate = RATE
): number {
  const n = pcm.length;
  if (!n) return 0;
  const k = Math.round((n * hz) / rate);
  const w = (2 * Math.PI * k) / n;
  const coeff = 2 * Math.cos(w);
  let s1 = 0;
  let s2 = 0;
  for (let i = 0; i < n; i++) {
    const s0 = pcm[i] + coeff * s1 - s2;
    s2 = s1;
    s1 = s0;
  }
  const power = s1 * s1 + s2 * s2 - coeff * s1 * s2;
  return (2 * Math.sqrt(Math.max(0, power))) / n;
}

/** A tone counts as heard above this amplitude (a test tone is 8000; codecs and mixing lose some). */
export const HEARD_AMPLITUDE = 800;

export type MixParty = {
  name: string;
  /** The tone this party sent, if it sent one. */
  hz?: number;
  /** What it heard over the checked window, 16 kHz linear. */
  heard: Int16Array;
};

/**
 * For each party, the names of the senders whose tone it heard, sorted. Scenarios compare the
 * result with the expected mix-minus (`{ a: [b], b: [a], c: [a, b] }`).
 */
export function tonesHeard(parties: MixParty[]): Record<string, string[]> {
  const senders = parties.filter((p) => p.hz);
  const out: Record<string, string[]> = {};
  for (const p of parties) {
    out[p.name] = senders
      .filter((s) => toneAmplitude(p.heard, s.hz!) > HEARD_AMPLITUDE)
      .map((s) => s.name)
      .sort();
  }
  return out;
}
