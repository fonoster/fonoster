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
  US_EAST_1 = "us-east-1",
  US_EAST_2 = "us-east-2",
  US_WEST_1 = "us-west-1",
  US_WEST_2 = "us-west-2",
  AF_SOUTH_1 = "af-south-1",
  AP_EAST_1 = "ap-east-1",
  AP_SOUTH_1 = "ap-south-1",
  AP_NORTHEAST_3 = "ap-northeast-3",
  AP_NORTHEAST_2 = "ap-northeast-2",
  AP_SOUTHEAST_1 = "ap-southeast-1",
  AP_SOUTHEAST_2 = "ap-southeast-2",
  AP_NORTHEAST_1 = "ap-northeast-1",
  CA_CENTRAL_1 = "ca-central-1",
  EU_CENTRAL_1 = "eu-central-1",
  EU_WEST_1 = "eu-west-1",
  EU_WEST_2 = "eu-west-2",
  EU_SOUTH_1 = "eu-south-1",
  EU_WEST_3 = "eu-west-3",
  EU_NORTH_1 = "eu-north-1",
  ME_SOUTH_1 = "me-south-1",
  SA_EAST_1 = "sa-east-1",
  US_GOV_EAST_1 = "us-gov-east-1",
  US_GOV_WEST_1 = "us-gov-west-1"
}

export enum TextType {
  SSML = "ssml",
  Text = "text"
}

export enum LanguageCode {
  ARB = "arb",
  CMN_CN = "cmn-CN",
  CY_GB = "cy-GB",
  DA_DK = "da-DK",
  DE_DE = "de-DE",
  EN_AU = "en-AU",
  EN_GB = "en-GB",
  EN_GB_WLS = "en-GB-WLS",
  EN_IN = "en-IN",
  EN_US = "en-US",
  ES_ES = "es-ES",
  ES_MX = "es-MX",
  ES_US = "es-US",
  FR_CA = "fr-CA",
  FR_FR = "fr-FR",
  IS_IS = "is-IS",
  IT_IT = "it-IT",
  JA_JP = "ja-JP",
  HI_IN = "hi-IN",
  KO_KR = "ko-KR",
  NB_NO = "nb-NO",
  NL_NL = "nl-NL",
  PL_PL = "pl-PL",
  PT_BR = "pt-BR",
  PT_PT = "pt-PT",
  RO_RO = "ro-RO",
  RU_RU = "ru-RU",
  SV_SE = "sv-SE",
  TR_TR = "tr-TR",
  EN_NZ = "en-NZ",
  EN_ZA = "en-ZA"
}

export enum Engine {
  STANDARD = "standard",
  NEURAL = "neural"
}

export enum Voice {
  ADITI = "Aditi",
  AMY = "Amy",
  ASTRID = "Astrid",
  BIANCA = "Bianca",
  BRIAN = "Brian",
  CAMILA = "Camila",
  CARLA = "Carla",
  CARMEN = "Carmen",
  CELINE = "Celine",
  CHANTAL = "Chantal",
  CONCHITA = "Conchita",
  CRISTIANO = "Cristiano",
  DORA = "Dora",
  EMMA = "Emma",
  ENRIQUE = "Enrique",
  EWA = "Ewa",
  FILIZ = "Filiz",
  GABRIELLE = "Gabrielle",
  GERAINT = "Geraint",
  GIORGIO = "Giorgio",
  GWYNETH = "Gwyneth",
  HANS = "Hans",
  INES = "Ines",
  IVY = "Ivy",
  JACEK = "Jacek",
  JAN = "Jan",
  JOANNA = "Joanna",
  JOEY = "Joey",
  JUSTIN = "Justin",
  KARL = "Karl",
  KENDRA = "Kendra",
  KEVIN = "Kevin",
  KIMBERLY = "Kimberly",
  LEA = "Lea",
  LIV = "Liv",
  LOTTE = "Lotte",
  LUCIA = "Lucia",
  LUPE = "Lupe",
  MADS = "Mads",
  MAJA = "Maja",
  MARLENE = "Marlene",
  MATHIEU = "Mathieu",
  MATTHEW = "Matthew",
  MAXIM = "Maxim",
  MIA = "Mia",
  MIGUEL = "Miguel",
  MIZUKI = "Mizuki",
  NAJA = "Naja",
  NICOLE = "Nicole",
  OLIVIA = "Olivia",
  PENELOPE = "Penelope",
  RAVEENA = "Raveena",
  RICARDO = "Ricardo",
  RUBEN = "Ruben",
  RUSSELL = "Russell",
  SALLI = "Salli",
  SEOYEON = "Seoyeon",
  TAKUMI = "Takumi",
  TATYANA = "Tatyana",
  VICKI = "Vicki",
  VITORIA = "Vitoria",
  ZEINA = "Zeina",
  ZHIYU = "Zhiyu",
  ARIA = "Aria",
  AYANDA = "Ayanda"
}
