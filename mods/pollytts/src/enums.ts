/*
 * Copyright (C) 2021 by Fonoster Inc (https://fonoster.com)
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

// Visit Amazon docs for details about this values
// https://docs.aws.amazon.com/polly/latest/dg/API_SynthesizeSpeech.html
// https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Concepts.RegionsAndAvailabilityZones.html

export enum Region {
  us_east_2 = "us-east-2",
  us_east_1 = "us-east-1",
  us_west_1 = "us-west-1",
  us_west_2 = "us-west-2",
  af_south_1 = "af-south-1",
  ap_east_1 = "ap-east-1",
  ap_south_1 = "ap-south-1",
  ap_northeast_3 = "ap-northeast-3",
  ap_northeast_2 = "ap-northeast-2",
  ap_southeast_1 = "ap-southeast-1",
  ap_southeast_2 = "ap-southeast-2",
  ap_northeast_1 = "ap-northeast-1",
  ca_central_1 = "ca-central-1",
  eu_central_1 = "eu-central-1",
  eu_west_1 = "eu-west-1",
  eu_west_2 = "eu-west-2",
  eu_south_1 = "eu-south-1",
  eu_west_3 = "eu-west-3",
  eu_north_1 = "eu-north-1",
  me_south_1 = "me-south-1",
  sa_east_1 = "sa-east-1",
  us_gov_east_1 = "us-gov-east-1",
  us_gov_west_1 = "us-gov-west-1"
}

export enum TextType {
  SSML = "ssml",
  Text = "text"
}

export enum LanguageCode {
  arb = "arb",
  cmn_CN = "cmn-CN ",
  cy_GB = "cy-GB",
  da_DK = "da-DK",
  de_DE = "de-DE",
  en_AU = "en-AU",
  en_GB = "en-GB",
  en_GB_WLS = "en-GB-WLS",
  en_IN = "en-IN",
  en_US = "en-US",
  es_ES = "es-ES",
  es_MX = "es-MX",
  es_US = "es-US",
  fr_CA = "fr-CA",
  fr_FR = "fr-FR",
  is_IS = "is-IS",
  it_IT = "it-IT",
  ja_JP = "ja-JP",
  hi_IN = "hi-IN",
  ko_KR = "ko-KR",
  nb_NO = "nb-NO",
  nl_NL = "nl-NL",
  pl_PL = "pl-PL",
  pt_BR = "pt-BR",
  pt_PT = "pt-PT",
  ro_RO = "ro-RO",
  ru_RU = "ru-RU",
  sv_SE = "sv-SE",
  tr_TR = "tr-TR",
  en_NZ = "en-NZ ",
  en_ZA = "en-ZA"
}

export enum Engine {
  Standard = "standard",
  Neural = "neural"
}

export enum Voice {
  Aditi = "Aditi",
  Amy = "Amy",
  Astrid = "Astrid",
  Bianca = "Bianca",
  Brian = "Brian",
  Camila = "Camila",
  Carla = "Carla",
  Carmen = "Carmen",
  Celine = "Celine",
  Chantal = "Conchita",
  Conchita = "Conchita",
  Cristiano = "Cristiano",
  Dora = "Dora",
  Emma = "Emma",
  Enrique = "Enrique",
  Ewa = "Ewa",
  Filiz = "Filiz",
  Gabrielle = "Gabrielle",
  Geraint = "Geraint",
  Giorgio = "Giorgio",
  Gwyneth = "Gwyneth",
  Hans = "Hans",
  Ines = "Ines",
  Ivy = "Ivy",
  Jacek = "Jacek",
  Jan = "Jan",
  Joanna = "Joanna",
  Joey = "Joey",
  Justin = "Justin",
  Karl = "Karl",
  Kendra = "Kendra",
  Kevin = "Kevin",
  Kimberly = "Kimberly",
  Lea = "Lea",
  Liv = "Liv",
  Lotte = "Lotte",
  Lucia = "Lucia",
  Lupe = "Lupe",
  Mads = "Mads",
  Maja = "Maja",
  Marlene = "Marlene",
  Mathieu = "Mathieu",
  Matthew = "Matthew",
  Maxim = "Maxim",
  Mia = "Mia",
  Miguel = "Miguel",
  Mizuki = "Mizuki",
  Naja = "Naja",
  Nicole = "Nicole",
  Olivia = "Olivia",
  Penelope = "Penelope",
  Raveena = "Raveena",
  Ricardo = "Ricardo",
  Ruben = "Ruben",
  Russell = "Russell",
  Salli = "Salli",
  Seoyeon = "Seoyeon",
  Takumi = "Takumi",
  Tatyana = "Tatyana",
  Vicki = "Vicki",
  Vitoria = "Vitoria",
  Zeina = "Zeina",
  Zhiyu = "Zhiyu",
  Aria = "Aria",
  Ayanda = "Ayanda"
}
