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
// Generates turn-corpus/synthetic-v1.json: synthetic calls with known truth for turn-taking
// replay (add-turn-taking task 1.5). Deterministic (seeded); rerun after changing it.
//
//   npx tsx mods/conformance/scripts/generate-turn-corpus.ts
import * as fs from "fs";
import * as path from "path";

type Segment = {
  startMs: number;
  endMs: number;
  text: string;
  kind: "turn" | "backchannel" | "interruption";
  turn?: number;
};
type Output = { startMs: number; endMs: number; interruptible: boolean };
type Call = {
  name: string;
  consent: "synthetic";
  language: string;
  segments: Segment[];
  agent: Output[];
};

let seed = 20261015;
const rand = () =>
  (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
const between = (a: number, b: number) => Math.round(a + rand() * (b - a));

const TEXT = {
  en: {
    turn: [
      "I want to pay my bill",
      "What are your opening hours",
      "I need to change my appointment",
      "Can I speak to someone about my order"
    ],
    tail: ["for this month", "on Saturday", "to next Tuesday", "please"],
    back: ["uh-huh", "mhm", "yeah", "okay"],
    cut: [
      "No wait, I meant Tuesday",
      "Sorry, that's not what I asked",
      "Hold on, stop please"
    ]
  },
  es: {
    turn: [
      "Quiero pagar mi factura",
      "A qué hora abren",
      "Necesito cambiar mi cita",
      "Quiero hablar con alguien de mi pedido"
    ],
    tail: ["de este mes", "el sábado", "para el martes", "por favor"],
    back: ["ajá", "sí", "claro", "vale"],
    cut: [
      "No, espere, era el martes",
      "Perdón, no pregunté eso",
      "Espere, pare por favor"
    ]
  }
};
const pick = <T>(list: T[]) => list[Math.floor(rand() * list.length)];

function call(
  name: string,
  language: "en" | "es",
  build: (t: (typeof TEXT)["en"]) => { segments: Segment[]; agent: Output[] }
): Call {
  return { name, consent: "synthetic", language, ...build(TEXT[language]) };
}

const calls: Call[] = [];
for (const lang of ["en", "es"] as const) {
  for (let i = 0; i < 6; i++) {
    // A single clean turn, then the agent answers.
    calls.push(
      call(`${lang}-clean-${i}`, lang, (t) => {
        const end = between(1200, 2600);
        return {
          segments: [
            {
              startMs: 500,
              endMs: end,
              text: pick(t.turn),
              kind: "turn",
              turn: 1
            }
          ],
          agent: [
            { startMs: end + 1200, endMs: end + 3600, interruptible: true }
          ]
        };
      })
    );
    // A short pause inside one turn (300-700 ms).
    calls.push(
      call(`${lang}-short-pause-${i}`, lang, (t) => {
        const a = between(1000, 1800);
        const b = a + between(300, 700);
        const end = b + between(600, 1200);
        return {
          segments: [
            {
              startMs: 500,
              endMs: a,
              text: pick(t.turn),
              kind: "turn",
              turn: 1
            },
            {
              startMs: b,
              endMs: end,
              text: pick(t.tail),
              kind: "turn",
              turn: 1
            }
          ],
          agent: [
            { startMs: end + 1200, endMs: end + 3400, interruptible: true }
          ]
        };
      })
    );
    // A long thinking pause inside one turn (1000-1600 ms): the hard case.
    calls.push(
      call(`${lang}-long-pause-${i}`, lang, (t) => {
        const a = between(1000, 1800);
        const b = a + between(1000, 1600);
        const end = b + between(600, 1200);
        return {
          segments: [
            {
              startMs: 500,
              endMs: a,
              text: pick(t.turn),
              kind: "turn",
              turn: 1
            },
            {
              startMs: b,
              endMs: end,
              text: pick(t.tail),
              kind: "turn",
              turn: 1
            }
          ],
          agent: [
            { startMs: end + 1300, endMs: end + 3500, interruptible: true }
          ]
        };
      })
    );
    // A backchannel while the agent speaks.
    calls.push(
      call(`${lang}-backchannel-${i}`, lang, (t) => {
        const end = between(1200, 2000);
        const out = end + 1000;
        const bc = out + between(800, 2000);
        return {
          segments: [
            {
              startMs: 400,
              endMs: end,
              text: pick(t.turn),
              kind: "turn",
              turn: 1
            },
            {
              startMs: bc,
              endMs: bc + between(250, 450),
              text: pick(t.back),
              kind: "backchannel"
            }
          ],
          agent: [{ startMs: out, endMs: out + 4500, interruptible: true }]
        };
      })
    );
    // A real barge-in while the agent speaks.
    calls.push(
      call(`${lang}-barge-in-${i}`, lang, (t) => {
        const end = between(1200, 2000);
        const out = end + 1000;
        const cut = out + between(800, 2000);
        return {
          segments: [
            {
              startMs: 400,
              endMs: end,
              text: pick(t.turn),
              kind: "turn",
              turn: 1
            },
            {
              startMs: cut,
              endMs: cut + between(1200, 1800),
              text: pick(t.cut),
              kind: "interruption",
              turn: 2
            }
          ],
          agent: [{ startMs: out, endMs: out + 5000, interruptible: true }]
        };
      })
    );
  }
}

const out = path.join(__dirname, "..", "turn-corpus", "synthetic-v1.json");
fs.writeFileSync(
  out,
  JSON.stringify({ format: "fonoster.turn-corpus.v1", calls }, null, 1) + "\n"
);
console.log(
  `wrote ${calls.length} calls to ${path.relative(process.cwd(), out)}`
);
