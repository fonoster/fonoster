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
  // Aura 2 English Voices - Featured
  AURA_2_THALIA_EN = "aura-2-thalia-en",
  AURA_2_ANDROMEDA_EN = "aura-2-andromeda-en",
  AURA_2_HELENA_EN = "aura-2-helena-en",
  AURA_2_APOLLO_EN = "aura-2-apollo-en",
  AURA_2_ARCAS_EN = "aura-2-arcas-en",
  AURA_2_ARIES_EN = "aura-2-aries-en",

  // Aura 2 English Voices - All Available
  AURA_2_AMALTHEA_EN = "aura-2-amalthea-en",
  AURA_2_ASTERIA_EN = "aura-2-asteria-en",
  AURA_2_ATHENA_EN = "aura-2-athena-en",
  AURA_2_ATLAS_EN = "aura-2-atlas-en",
  AURA_2_AURORA_EN = "aura-2-aurora-en",
  AURA_2_CALLISTA_EN = "aura-2-callista-en",
  AURA_2_CORA_EN = "aura-2-cora-en",
  AURA_2_CORDELIA_EN = "aura-2-cordelia-en",
  AURA_2_DELIA_EN = "aura-2-delia-en",
  AURA_2_DRACO_EN = "aura-2-draco-en",
  AURA_2_ELECTRA_EN = "aura-2-electra-en",
  AURA_2_HARMONIA_EN = "aura-2-harmonia-en",
  AURA_2_HERA_EN = "aura-2-hera-en",
  AURA_2_IRIS_EN = "aura-2-iris-en",
  AURA_2_JUNO_EN = "aura-2-juno-en",
  AURA_2_LUNA_EN = "aura-2-luna-en",
  AURA_2_MAIA_EN = "aura-2-maia-en",
  AURA_2_NOVA_EN = "aura-2-nova-en",
  AURA_2_ORION_EN = "aura-2-orion-en",
  AURA_2_PANDORA_EN = "aura-2-pandora-en",
  AURA_2_PHOEBE_EN = "aura-2-phoebe-en",
  AURA_2_PLUTO_EN = "aura-2-pluto-en",
  AURA_2_SATURN_EN = "aura-2-saturn-en",
  AURA_2_SELENE_EN = "aura-2-selene-en",
  AURA_2_THEIA_EN = "aura-2-theia-en",
  AURA_2_VESTA_EN = "aura-2-vesta-en",
  AURA_2_ZEUS_EN = "aura-2-zeus-en",

  // Aura 2 Spanish Voices - Featured
  AURA_2_CELESTE_ES = "aura-2-celeste-es",
  AURA_2_ESTRELLA_ES = "aura-2-estrella-es",
  AURA_2_NESTOR_ES = "aura-2-nestor-es",

  // Aura 2 Spanish Voices - All Available
  AURA_2_SIRIO_ES = "aura-2-sirio-es",
  AURA_2_CARINA_ES = "aura-2-carina-es",
  AURA_2_ALVARO_ES = "aura-2-alvaro-es",
  AURA_2_DIANA_ES = "aura-2-diana-es",
  AURA_2_AQUILA_ES = "aura-2-aquila-es",
  AURA_2_SELENA_ES = "aura-2-selena-es",
  AURA_2_JAVIER_ES = "aura-2-javier-es",

  // Aura 1 English Voices
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
  // Aura 2 English Voices - Featured
  {
    name: DeepgramVoice.AURA_2_THALIA_EN,
    displayName: "Thalia",
    languageCode: VoiceLanguage.EN_US,
    gender: VoiceGender.FEMALE
  },
  {
    name: DeepgramVoice.AURA_2_ANDROMEDA_EN,
    displayName: "Andromeda",
    languageCode: VoiceLanguage.EN_US,
    gender: VoiceGender.FEMALE
  },
  {
    name: DeepgramVoice.AURA_2_HELENA_EN,
    displayName: "Helena",
    languageCode: VoiceLanguage.EN_US,
    gender: VoiceGender.FEMALE
  },
  {
    name: DeepgramVoice.AURA_2_APOLLO_EN,
    displayName: "Apollo",
    languageCode: VoiceLanguage.EN_US,
    gender: VoiceGender.MALE
  },
  {
    name: DeepgramVoice.AURA_2_ARCAS_EN,
    displayName: "Arcas",
    languageCode: VoiceLanguage.EN_US,
    gender: VoiceGender.MALE
  },
  {
    name: DeepgramVoice.AURA_2_ARIES_EN,
    displayName: "Aries",
    languageCode: VoiceLanguage.EN_US,
    gender: VoiceGender.MALE
  },

  // Aura 2 English Voices - All Available
  {
    name: DeepgramVoice.AURA_2_AMALTHEA_EN,
    displayName: "Amalthea",
    languageCode: VoiceLanguage.EN_PH,
    gender: VoiceGender.FEMALE
  },
  {
    name: DeepgramVoice.AURA_2_ASTERIA_EN,
    displayName: "Asteria",
    languageCode: VoiceLanguage.EN_US,
    gender: VoiceGender.FEMALE
  },
  {
    name: DeepgramVoice.AURA_2_ATHENA_EN,
    displayName: "Athena",
    languageCode: VoiceLanguage.EN_US,
    gender: VoiceGender.FEMALE
  },
  {
    name: DeepgramVoice.AURA_2_ATLAS_EN,
    displayName: "Atlas",
    languageCode: VoiceLanguage.EN_US,
    gender: VoiceGender.MALE
  },
  {
    name: DeepgramVoice.AURA_2_AURORA_EN,
    displayName: "Aurora",
    languageCode: VoiceLanguage.EN_US,
    gender: VoiceGender.FEMALE
  },
  {
    name: DeepgramVoice.AURA_2_CALLISTA_EN,
    displayName: "Callista",
    languageCode: VoiceLanguage.EN_US,
    gender: VoiceGender.FEMALE
  },
  {
    name: DeepgramVoice.AURA_2_CORA_EN,
    displayName: "Cora",
    languageCode: VoiceLanguage.EN_US,
    gender: VoiceGender.FEMALE
  },
  {
    name: DeepgramVoice.AURA_2_CORDELIA_EN,
    displayName: "Cordelia",
    languageCode: VoiceLanguage.EN_US,
    gender: VoiceGender.FEMALE
  },
  {
    name: DeepgramVoice.AURA_2_DELIA_EN,
    displayName: "Delia",
    languageCode: VoiceLanguage.EN_US,
    gender: VoiceGender.FEMALE
  },
  {
    name: DeepgramVoice.AURA_2_DRACO_EN,
    displayName: "Draco",
    languageCode: VoiceLanguage.EN_GB,
    gender: VoiceGender.MALE
  },
  {
    name: DeepgramVoice.AURA_2_ELECTRA_EN,
    displayName: "Electra",
    languageCode: VoiceLanguage.EN_US,
    gender: VoiceGender.FEMALE
  },
  {
    name: DeepgramVoice.AURA_2_HARMONIA_EN,
    displayName: "Harmonia",
    languageCode: VoiceLanguage.EN_US,
    gender: VoiceGender.FEMALE
  },
  {
    name: DeepgramVoice.AURA_2_HERA_EN,
    displayName: "Hera",
    languageCode: VoiceLanguage.EN_US,
    gender: VoiceGender.FEMALE
  },
  {
    name: DeepgramVoice.AURA_2_IRIS_EN,
    displayName: "Iris",
    languageCode: VoiceLanguage.EN_US,
    gender: VoiceGender.FEMALE
  },
  {
    name: DeepgramVoice.AURA_2_JUNO_EN,
    displayName: "Juno",
    languageCode: VoiceLanguage.EN_US,
    gender: VoiceGender.FEMALE
  },
  {
    name: DeepgramVoice.AURA_2_LUNA_EN,
    displayName: "Luna",
    languageCode: VoiceLanguage.EN_US,
    gender: VoiceGender.FEMALE
  },
  {
    name: DeepgramVoice.AURA_2_MAIA_EN,
    displayName: "Maia",
    languageCode: VoiceLanguage.EN_US,
    gender: VoiceGender.FEMALE
  },
  {
    name: DeepgramVoice.AURA_2_NOVA_EN,
    displayName: "Nova",
    languageCode: VoiceLanguage.EN_US,
    gender: VoiceGender.FEMALE
  },
  {
    name: DeepgramVoice.AURA_2_ORION_EN,
    displayName: "Orion",
    languageCode: VoiceLanguage.EN_US,
    gender: VoiceGender.MALE
  },
  {
    name: DeepgramVoice.AURA_2_PANDORA_EN,
    displayName: "Pandora",
    languageCode: VoiceLanguage.EN_GB,
    gender: VoiceGender.FEMALE
  },
  {
    name: DeepgramVoice.AURA_2_PHOEBE_EN,
    displayName: "Phoebe",
    languageCode: VoiceLanguage.EN_US,
    gender: VoiceGender.FEMALE
  },
  {
    name: DeepgramVoice.AURA_2_PLUTO_EN,
    displayName: "Pluto",
    languageCode: VoiceLanguage.EN_US,
    gender: VoiceGender.MALE
  },
  {
    name: DeepgramVoice.AURA_2_SATURN_EN,
    displayName: "Saturn",
    languageCode: VoiceLanguage.EN_US,
    gender: VoiceGender.MALE
  },
  {
    name: DeepgramVoice.AURA_2_SELENE_EN,
    displayName: "Selene",
    languageCode: VoiceLanguage.EN_US,
    gender: VoiceGender.FEMALE
  },
  {
    name: DeepgramVoice.AURA_2_THEIA_EN,
    displayName: "Theia",
    languageCode: VoiceLanguage.EN_AU,
    gender: VoiceGender.FEMALE
  },
  {
    name: DeepgramVoice.AURA_2_VESTA_EN,
    displayName: "Vesta",
    languageCode: VoiceLanguage.EN_US,
    gender: VoiceGender.FEMALE
  },
  {
    name: DeepgramVoice.AURA_2_ZEUS_EN,
    displayName: "Zeus",
    languageCode: VoiceLanguage.EN_US,
    gender: VoiceGender.MALE
  },

  // Aura 2 Spanish Voices - Featured
  {
    name: DeepgramVoice.AURA_2_CELESTE_ES,
    displayName: "Celeste",
    languageCode: VoiceLanguage.ES_CO,
    gender: VoiceGender.FEMALE
  },
  {
    name: DeepgramVoice.AURA_2_ESTRELLA_ES,
    displayName: "Estrella",
    languageCode: VoiceLanguage.ES_MX,
    gender: VoiceGender.FEMALE
  },
  {
    name: DeepgramVoice.AURA_2_NESTOR_ES,
    displayName: "Nestor",
    languageCode: VoiceLanguage.ES_ES,
    gender: VoiceGender.MALE
  },

  // Aura 2 Spanish Voices - All Available
  {
    name: DeepgramVoice.AURA_2_SIRIO_ES,
    displayName: "Sirio",
    languageCode: VoiceLanguage.ES_MX,
    gender: VoiceGender.MALE
  },
  {
    name: DeepgramVoice.AURA_2_CARINA_ES,
    displayName: "Carina",
    languageCode: VoiceLanguage.ES_ES,
    gender: VoiceGender.FEMALE
  },
  {
    name: DeepgramVoice.AURA_2_ALVARO_ES,
    displayName: "Alvaro",
    languageCode: VoiceLanguage.ES_ES,
    gender: VoiceGender.MALE
  },
  {
    name: DeepgramVoice.AURA_2_DIANA_ES,
    displayName: "Diana",
    languageCode: VoiceLanguage.ES_ES,
    gender: VoiceGender.FEMALE
  },
  {
    name: DeepgramVoice.AURA_2_AQUILA_ES,
    displayName: "Aquila",
    languageCode: VoiceLanguage.ES_419,
    gender: VoiceGender.MALE
  },
  {
    name: DeepgramVoice.AURA_2_SELENA_ES,
    displayName: "Selena",
    languageCode: VoiceLanguage.ES_419,
    gender: VoiceGender.FEMALE
  },
  {
    name: DeepgramVoice.AURA_2_JAVIER_ES,
    displayName: "Javier",
    languageCode: VoiceLanguage.ES_MX,
    gender: VoiceGender.MALE
  },

  // Aura 1 English Voices
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
