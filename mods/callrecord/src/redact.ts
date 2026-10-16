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
// Rule-based redaction (open question O3, first engine): payment card numbers, written as digits
// or as spoken digit words, validated with the Luhn check. Audio beeps need word timings and
// come with recordings.

const WORDS: Record<string, string> = {
  zero: "0",
  oh: "0",
  one: "1",
  two: "2",
  three: "3",
  four: "4",
  five: "5",
  six: "6",
  seven: "7",
  eight: "8",
  nine: "9",
  cero: "0",
  uno: "1",
  dos: "2",
  tres: "3",
  cuatro: "4",
  cinco: "5",
  seis: "6",
  siete: "7",
  ocho: "8",
  nueve: "9"
};

export const CARD_MASK = "[card number]";

function luhn(digits: string): boolean {
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let d = Number(digits[digits.length - 1 - i]);
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return sum % 10 === 0;
}

export function redactText(text: string): { text: string; redactions: number } {
  let redactions = 0;
  // Digits, possibly separated by spaces or dashes.
  let out = text.replace(/\b\d(?:[ -]?\d){12,18}\b/g, (m) => {
    const digits = m.replace(/[ -]/g, "");
    if (digits.length < 13 || digits.length > 19 || !luhn(digits)) return m;
    redactions++;
    return CARD_MASK;
  });
  // Spoken digit words ("four one one one ...").
  const word = `(?:${Object.keys(WORDS).join("|")})`;
  out = out.replace(
    new RegExp(`\\b${word}(?:[\\s,-]+${word}){12,18}\\b`, "gi"),
    (m) => {
      const digits = m
        .toLowerCase()
        .split(/[\s,-]+/)
        .map((w) => WORDS[w])
        .join("");
      if (!luhn(digits)) return m;
      redactions++;
      return CARD_MASK;
    }
  );
  return { text: out, redactions };
}
