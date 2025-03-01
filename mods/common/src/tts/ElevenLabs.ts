/*
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
 * distributed under the License is distributed on an "AS IS"BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { VoiceGender, VoiceLanguage } from "./types";

enum ElevenLabsVoice {
  SARAH = "Sarah",
  LAURA = "Laura",
  CHARLIE = "Charlie",
  GEORGE = "George",
  CALLUM = "Callum",
  LIAM = "Liam",
  CHARLOTTE = "Charlotte",
  ALICE = "Alice",
  MATILDA = "Matilda",
  WILL = "Will",
  JESSICA = "Jessica",
  ERIC = "Eric",
  CHRIS = "Chris",
  BRIAN = "Brian",
  DANIEL = "Daniel",
  LILY = "Lily",
  BILL = "Bill"
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
    name: ElevenLabsVoice.CHARLOTTE,
    displayName: "Charlotte",
    languageCode: VoiceLanguage.SV_SE,
    gender: VoiceGender.FEMALE
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
