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
import { VoiceGender, VoiceLanguage } from "./types";

enum ElevenLabsVoice {
  SARAH = "EXAVITQu4vr4xnSDxMaL",
  LAURA = "FGY2WhTYpPnrIDTdsKH5",
  CHARLIE = "IKne3meq5aSn9XLyUdCD",
  GEORGE = "JBFqnCBsd6RMkjVDRZzb",
  CALLUM = "N2lVS1w4EtoT3dr4eOWO",
  LIAM = "TX3LPaxmHKxFdv7VOQHJ",
  ALICE = "Xb7hH8MSUJpSbSDYk0k2",
  MATILDA = "XrExE9yKIg1WjnnlVkGX",
  WILL = "bIHbv24MWmeRgasZH58o",
  JESSICA = "cgSgspJ2msm6clMCkdW9",
  ERIC = "cjVigY5qzO86Huf0OWal",
  CHRIS = "iP95p4xoKVk53GoZ742B",
  BRIAN = "nPczCjzI2devNBz1zQrb",
  DANIEL = "onwK4e9ZLuTAKqWW03F9",
  LILY = "pFZP5JQG7iQjIQuC4Bku",
  BILL = "pqHfZKP75CvOlQylNhV4"
}

const ElevenLabsVoiceDetails = [
  {
    name: ElevenLabsVoice.SARAH,
    displayName: "Sarah",
    languageCode: VoiceLanguage.EN_US,
    gender: VoiceGender.FEMALE
  },
  {
    name: ElevenLabsVoice.LAURA,
    displayName: "Laura",
    languageCode: VoiceLanguage.EN_US,
    gender: VoiceGender.FEMALE
  },
  {
    name: ElevenLabsVoice.CHARLIE,
    displayName: "Charlie",
    languageCode: VoiceLanguage.EN_AU,
    gender: VoiceGender.MALE
  },
  {
    name: ElevenLabsVoice.GEORGE,
    displayName: "George",
    languageCode: VoiceLanguage.EN_GB,
    gender: VoiceGender.MALE
  },
  {
    name: ElevenLabsVoice.CALLUM,
    displayName: "Callum",
    languageCode: VoiceLanguage.EN_GB,
    gender: VoiceGender.MALE
  },
  {
    name: ElevenLabsVoice.LIAM,
    displayName: "Liam",
    languageCode: VoiceLanguage.EN_US,
    gender: VoiceGender.MALE
  },
  {
    name: ElevenLabsVoice.ALICE,
    displayName: "Alice",
    languageCode: VoiceLanguage.EN_GB,
    gender: VoiceGender.FEMALE
  },
  {
    name: ElevenLabsVoice.MATILDA,
    displayName: "Matilda",
    languageCode: VoiceLanguage.EN_US,
    gender: VoiceGender.FEMALE
  },
  {
    name: ElevenLabsVoice.WILL,
    displayName: "Will",
    languageCode: VoiceLanguage.EN_US,
    gender: VoiceGender.MALE
  },
  {
    name: ElevenLabsVoice.JESSICA,
    displayName: "Jessica",
    languageCode: VoiceLanguage.EN_US,
    gender: VoiceGender.MALE
  },
  {
    name: ElevenLabsVoice.ERIC,
    displayName: "Eric",
    languageCode: VoiceLanguage.EN_US,
    gender: VoiceGender.MALE
  },
  {
    name: ElevenLabsVoice.CHRIS,
    displayName: "Chris",
    languageCode: VoiceLanguage.EN_US,
    gender: VoiceGender.MALE
  },
  {
    name: ElevenLabsVoice.BRIAN,
    displayName: "Brian",
    languageCode: VoiceLanguage.EN_US,
    gender: VoiceGender.MALE
  },
  {
    name: ElevenLabsVoice.DANIEL,
    displayName: "Daniel",
    languageCode: VoiceLanguage.EN_GB,
    gender: VoiceGender.MALE
  },
  {
    name: ElevenLabsVoice.LILY,
    displayName: "Lily",
    languageCode: VoiceLanguage.EN_GB,
    gender: VoiceGender.FEMALE
  },
  {
    name: ElevenLabsVoice.BILL,
    displayName: "Bill",
    languageCode: VoiceLanguage.EN_US,
    gender: VoiceGender.MALE
  }
];

export { ElevenLabsVoice, ElevenLabsVoiceDetails };
