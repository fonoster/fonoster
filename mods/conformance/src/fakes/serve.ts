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
// The fake providers as a standalone server (the rebuild stack's `fakes` service, ST-B6): fake
// TTS, STT and LLM on fixed ports so a local stack runs calls without vendor keys or paid calls.
//
//   node dist/fakes/serve.js        # TTS :7001, STT :7002, LLM :7003, OAuth2 :7004 on 0.0.0.0
//
// FAKES_HOST, FAKES_TTS_PORT, FAKES_STT_PORT, FAKES_LLM_PORT, FAKES_OAUTH2_PORT override the
// defaults. The fake OAuth2 provider (sign-in) follows FAKES_OAUTH2_PROFILE (github, oidc) and offers
// FAKES_OAUTH2_EMAIL as the account to sign in with. The STT
// transcribes every call with FAKES_STT_SCRIPT (JSON [{atMs, text}], by caller-audio time) so an
// Autopilot conversation moves without a real recognizer; the LLM echoes the caller.
import { FakeOAuth2 } from "./providers/FakeOAuth2";
import { FakeLlm } from "./providers/FakeLlm";
import { FakeStt, SttScriptEntry } from "./providers/FakeStt";
import { FakeTts } from "./providers/FakeTts";

export const DEFAULT_STT_SCRIPT: SttScriptEntry[] = [
  { atMs: 6000, text: "Hi, what are your opening hours?" },
  { atMs: 16000, text: "Great, thank you." }
];

export async function serveFakes(
  env: Record<string, string | undefined> = process.env
) {
  const host = env.FAKES_HOST ?? "0.0.0.0";
  const port = (name: string, def: number) => Number(env[name] ?? def);
  const script = env.FAKES_STT_SCRIPT
    ? (JSON.parse(env.FAKES_STT_SCRIPT) as SttScriptEntry[])
    : DEFAULT_STT_SCRIPT;
  const tts = await new FakeTts().start(port("FAKES_TTS_PORT", 7001), host);
  const stt = new FakeStt();
  stt.configure({ script });
  await stt.start(port("FAKES_STT_PORT", 7002), host);
  const llm = await new FakeLlm().start(port("FAKES_LLM_PORT", 7003), host);
  const oauth2 = await new FakeOAuth2(
    env.FAKES_OAUTH2_PROFILE ?? "github",
    env.FAKES_OAUTH2_EMAIL
  ).start(port("FAKES_OAUTH2_PORT", 7004), host);
  return { tts, stt, llm, oauth2 };
}

// eslint-disable-next-line no-undef
if (require.main === module) {
  serveFakes()
    .then(({ tts, stt, llm, oauth2 }) => {
      console.log(
        `fakes ready: tts ${tts.url} stt ${stt.url} llm ${llm.url} oauth2 ${oauth2.url} (ports on ${process.env.FAKES_HOST ?? "0.0.0.0"})`
      );
      const stop = () =>
        Promise.all([tts.stop(), stt.stop(), llm.stop(), oauth2.stop()]).then(() =>
          process.exit(0)
        );
      process.on("SIGTERM", stop);
      process.on("SIGINT", stop);
    })
    .catch((e: Error) => {
      console.error(`fakes failed to start: ${e.message}`);
      process.exit(1);
    });
}
