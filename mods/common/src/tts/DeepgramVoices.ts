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

enum DeepgramVoice {
  AURA_ASTERIA_EN = "aura-asteria-en",
  AURA_LUNA_EN = "aura-luna-en",
  AURA_STELLA_EN = "aura-stella-en",
  AURA_ATHENA_EN = "aura-athena-en",
  AURA_HERA_EN = "aura-hera-en",
  AURA_ORION_EN = "aura-orion-en",
  AURA_ARCAS_EN = "aura-arcas-en",
  AURA_PERSEUS_EN = "aura-perseus-en",
  AURA_ANGUS_EN = "aura-angus-en",
  AURA_ORPHEUS_EN = "aura-orpheus-en",
  AURA_HELIOS_EN = "aura-helios-en",
  AURA_ZEUS_EN = "aura-zeus-en"
}

const DeepgramVoiceDetails = [
  {
    name: DeepgramVoice.AURA_ASTERIA_EN,
    displayName: "Asteria",
    languageCode: VoiceLanguage.EN_US,
    gender: VoiceGender.FEMALE
  },
  {
    name: DeepgramVoice.AURA_LUNA_EN,
    displayName: "Luna",
    languageCode: VoiceLanguage.EN_US,
    gender: VoiceGender.FEMALE
  },
  {
    name: DeepgramVoice.AURA_STELLA_EN,
    displayName: "Stella",
    languageCode: VoiceLanguage.EN_US,
    gender: VoiceGender.FEMALE
  },
  {
    name: DeepgramVoice.AURA_ATHENA_EN,
    displayName: "Athena",
    languageCode: VoiceLanguage.EN_GB,
    gender: VoiceGender.FEMALE
  },
  {
    name: DeepgramVoice.AURA_HERA_EN,
    displayName: "Hera",
    languageCode: VoiceLanguage.EN_US,
    gender: VoiceGender.FEMALE
  },
  {
    name: DeepgramVoice.AURA_ORION_EN,
    displayName: "Orion",
    languageCode: VoiceLanguage.EN_US,
    gender: VoiceGender.MALE
  },
  {
    name: DeepgramVoice.AURA_ARCAS_EN,
    displayName: "Arcas",
    languageCode: VoiceLanguage.EN_US,
    gender: VoiceGender.MALE
  },
  {
    name: DeepgramVoice.AURA_PERSEUS_EN,
    displayName: "Perseus",
    languageCode: VoiceLanguage.EN_US,
    gender: VoiceGender.MALE
  },
  {
    name: DeepgramVoice.AURA_ANGUS_EN,
    displayName: "Angus",
    languageCode: VoiceLanguage.EN_IE,
    gender: VoiceGender.MALE
  },
  {
    name: DeepgramVoice.AURA_ORPHEUS_EN,
    displayName: "Orpheus",
    languageCode: VoiceLanguage.EN_US,
    gender: VoiceGender.MALE
  },
  {
    name: DeepgramVoice.AURA_HELIOS_EN,
    displayName: "Helios",
    languageCode: VoiceLanguage.EN_GB,
    gender: VoiceGender.MALE
  },
  {
    name: DeepgramVoice.AURA_ZEUS_EN,
    displayName: "Zeus",
    languageCode: VoiceLanguage.EN_US,
    gender: VoiceGender.MALE
  }
];

export { DeepgramVoice, DeepgramVoiceDetails };
