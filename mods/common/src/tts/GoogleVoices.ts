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

enum GoogleVoice {
  AF_ZA_STANDARD_A = "af-ZA-Standard-A",
  AM_ET_STANDARD_A = "am-ET-Standard-A",
  AM_ET_STANDARD_B = "am-ET-Standard-B",
  AM_ET_WAVENET_A = "am-ET-Wavenet-A",
  AM_ET_WAVENET_B = "am-ET-Wavenet-B",
  AR_XA_STANDARD_A = "ar-XA-Standard-A",
  AR_XA_STANDARD_B = "ar-XA-Standard-B",
  AR_XA_STANDARD_C = "ar-XA-Standard-C",
  AR_XA_STANDARD_D = "ar-XA-Standard-D",
  AR_XA_WAVENET_A = "ar-XA-Wavenet-A",
  AR_XA_WAVENET_B = "ar-XA-Wavenet-B",
  AR_XA_WAVENET_C = "ar-XA-Wavenet-C",
  AR_XA_WAVENET_D = "ar-XA-Wavenet-D",
  BG_BG_STANDARD_A = "bg-BG-Standard-A",
  BN_IN_STANDARD_A = "bn-IN-Standard-A",
  BN_IN_STANDARD_B = "bn-IN-Standard-B",
  BN_IN_STANDARD_C = "bn-IN-Standard-C",
  BN_IN_STANDARD_D = "bn-IN-Standard-D",
  BN_IN_WAVENET_A = "bn-IN-Wavenet-A",
  BN_IN_WAVENET_B = "bn-IN-Wavenet-B",
  BN_IN_WAVENET_C = "bn-IN-Wavenet-C",
  BN_IN_WAVENET_D = "bn-IN-Wavenet-D",
  CA_ES_STANDARD_A = "ca-ES-Standard-A",
  CMN_CN_STANDARD_A = "cmn-CN-Standard-A",
  CMN_CN_STANDARD_B = "cmn-CN-Standard-B",
  CMN_CN_STANDARD_C = "cmn-CN-Standard-C",
  CMN_CN_STANDARD_D = "cmn-CN-Standard-D",
  CMN_CN_WAVENET_A = "cmn-CN-Wavenet-A",
  CMN_CN_WAVENET_B = "cmn-CN-Wavenet-B",
  CMN_CN_WAVENET_C = "cmn-CN-Wavenet-C",
  CMN_CN_WAVENET_D = "cmn-CN-Wavenet-D",
  CMN_TW_STANDARD_A = "cmn-TW-Standard-A",
  CMN_TW_STANDARD_B = "cmn-TW-Standard-B",
  CMN_TW_STANDARD_C = "cmn-TW-Standard-C",
  CMN_TW_WAVENET_A = "cmn-TW-Wavenet-A",
  CMN_TW_WAVENET_B = "cmn-TW-Wavenet-B",
  CMN_TW_WAVENET_C = "cmn-TW-Wavenet-C",
  CS_CZ_STANDARD_A = "cs-CZ-Standard-A",
  CS_CZ_WAVENET_A = "cs-CZ-Wavenet-A",
  DA_DK_NEURAL2_D = "da-DK-Neural2-D",
  DA_DK_STANDARD_A = "da-DK-Standard-A",
  DA_DK_STANDARD_C = "da-DK-Standard-C",
  DA_DK_STANDARD_D = "da-DK-Standard-D",
  DA_DK_STANDARD_E = "da-DK-Standard-E",
  DA_DK_WAVENET_A = "da-DK-Wavenet-A",
  DA_DK_WAVENET_C = "da-DK-Wavenet-C",
  DA_DK_WAVENET_D = "da-DK-Wavenet-D",
  DA_DK_WAVENET_E = "da-DK-Wavenet-E",
  DE_DE_NEURAL2_A = "de-DE-Neural2-A",
  DE_DE_NEURAL2_B = "de-DE-Neural2-B",
  DE_DE_NEURAL2_C = "de-DE-Neural2-C",
  DE_DE_NEURAL2_D = "de-DE-Neural2-D",
  DE_DE_NEURAL2_F = "de-DE-Neural2-F",
  DE_DE_POLYGLOT_1 = "de-DE-Polyglot-1",
  DE_DE_STANDARD_A = "de-DE-Standard-A",
  DE_DE_STANDARD_B = "de-DE-Standard-B",
  DE_DE_STANDARD_C = "de-DE-Standard-C",
  DE_DE_STANDARD_D = "de-DE-Standard-D",
  DE_DE_STANDARD_E = "de-DE-Standard-E",
  DE_DE_STANDARD_F = "de-DE-Standard-F",
  DE_DE_STUDIO_B = "de-DE-Studio-B",
  DE_DE_STUDIO_C = "de-DE-Studio-C",
  DE_DE_WAVENET_A = "de-DE-Wavenet-A",
  DE_DE_WAVENET_B = "de-DE-Wavenet-B",
  DE_DE_WAVENET_C = "de-DE-Wavenet-C",
  DE_DE_WAVENET_D = "de-DE-Wavenet-D",
  DE_DE_WAVENET_E = "de-DE-Wavenet-E",
  DE_DE_WAVENET_F = "de-DE-Wavenet-F",
  EL_GR_STANDARD_A = "el-GR-Standard-A",
  EL_GR_WAVENET_A = "el-GR-Wavenet-A",
  EN_AU_NEURAL2_A = "en-AU-Neural2-A",
  EN_AU_NEURAL2_B = "en-AU-Neural2-B",
  EN_AU_NEURAL2_C = "en-AU-Neural2-C",
  EN_AU_NEURAL2_D = "en-AU-Neural2-D",
  EN_AU_NEWS_E = "en-AU-News-E",
  EN_AU_NEWS_F = "en-AU-News-F",
  EN_AU_NEWS_G = "en-AU-News-G",
  EN_AU_POLYGLOT_1 = "en-AU-Polyglot-1",
  EN_AU_STANDARD_A = "en-AU-Standard-A",
  EN_AU_STANDARD_B = "en-AU-Standard-B",
  EN_AU_STANDARD_C = "en-AU-Standard-C",
  EN_AU_STANDARD_D = "en-AU-Standard-D",
  EN_AU_WAVENET_A = "en-AU-Wavenet-A",
  EN_AU_WAVENET_B = "en-AU-Wavenet-B",
  EN_AU_WAVENET_C = "en-AU-Wavenet-C",
  EN_AU_WAVENET_D = "en-AU-Wavenet-D",
  EN_GB_NEURAL2_A = "en-GB-Neural2-A",
  EN_GB_NEURAL2_B = "en-GB-Neural2-B",
  EN_GB_NEURAL2_C = "en-GB-Neural2-C",
  EN_GB_NEURAL2_D = "en-GB-Neural2-D",
  EN_GB_NEURAL2_F = "en-GB-Neural2-F",
  EN_GB_NEWS_G = "en-GB-News-G",
  EN_GB_NEWS_H = "en-GB-News-H",
  EN_GB_NEWS_I = "en-GB-News-I",
  EN_GB_NEWS_J = "en-GB-News-J",
  EN_GB_NEWS_K = "en-GB-News-K",
  EN_GB_NEWS_L = "en-GB-News-L",
  EN_GB_NEWS_M = "en-GB-News-M",
  EN_GB_STANDARD_A = "en-GB-Standard-A",
  EN_GB_STANDARD_B = "en-GB-Standard-B",
  EN_GB_STANDARD_C = "en-GB-Standard-C",
  EN_GB_STANDARD_D = "en-GB-Standard-D",
  EN_GB_STANDARD_F = "en-GB-Standard-F",
  EN_GB_STUDIO_B = "en-GB-Studio-B",
  EN_GB_STUDIO_C = "en-GB-Studio-C",
  EN_GB_WAVENET_A = "en-GB-Wavenet-A",
  EN_GB_WAVENET_B = "en-GB-Wavenet-B",
  EN_GB_WAVENET_C = "en-GB-Wavenet-C",
  EN_GB_WAVENET_D = "en-GB-Wavenet-D",
  EN_GB_WAVENET_F = "en-GB-Wavenet-F",
  EN_IN_NEURAL2_A = "en-IN-Neural2-A",
  EN_IN_NEURAL2_B = "en-IN-Neural2-B",
  EN_IN_NEURAL2_C = "en-IN-Neural2-C",
  EN_IN_NEURAL2_D = "en-IN-Neural2-D",
  EN_IN_STANDARD_A = "en-IN-Standard-A",
  EN_IN_STANDARD_B = "en-IN-Standard-B",
  EN_IN_STANDARD_C = "en-IN-Standard-C",
  EN_IN_STANDARD_D = "en-IN-Standard-D",
  EN_IN_WAVENET_A = "en-IN-Wavenet-A",
  EN_IN_WAVENET_B = "en-IN-Wavenet-B",
  EN_IN_WAVENET_C = "en-IN-Wavenet-C",
  EN_IN_WAVENET_D = "en-IN-Wavenet-D",
  EN_US_CASUAL_K = "en-US-Casual-K",
  EN_US_JOURNEY_D = "en-US-Journey-D",
  EN_US_JOURNEY_F = "en-US-Journey-F",
  EN_US_JOURNEY_O = "en-US-Journey-O",
  EN_US_NEURAL2_A = "en-US-Neural2-A",
  EN_US_NEURAL2_C = "en-US-Neural2-C",
  EN_US_NEURAL2_D = "en-US-Neural2-D",
  EN_US_NEURAL2_E = "en-US-Neural2-E",
  EN_US_NEURAL2_F = "en-US-Neural2-F",
  EN_US_NEURAL2_G = "en-US-Neural2-G",
  EN_US_NEURAL2_H = "en-US-Neural2-H",
  EN_US_NEURAL2_I = "en-US-Neural2-I",
  EN_US_NEURAL2_J = "en-US-Neural2-J",
  EN_US_NEWS_K = "en-US-News-K",
  EN_US_NEWS_L = "en-US-News-L",
  EN_US_NEWS_N = "en-US-News-N",
  EN_US_POLYGLOT_1 = "en-US-Polyglot-1",
  EN_US_STANDARD_A = "en-US-Standard-A",
  EN_US_STANDARD_B = "en-US-Standard-B",
  EN_US_STANDARD_C = "en-US-Standard-C",
  EN_US_STANDARD_D = "en-US-Standard-D",
  EN_US_STANDARD_E = "en-US-Standard-E",
  EN_US_STANDARD_F = "en-US-Standard-F",
  EN_US_STANDARD_G = "en-US-Standard-G",
  EN_US_STANDARD_H = "en-US-Standard-H",
  EN_US_STANDARD_I = "en-US-Standard-I",
  EN_US_STANDARD_J = "en-US-Standard-J",
  EN_US_STUDIO_O = "en-US-Studio-O",
  EN_US_STUDIO_Q = "en-US-Studio-Q",
  EN_US_WAVENET_A = "en-US-Wavenet-A",
  EN_US_WAVENET_B = "en-US-Wavenet-B",
  EN_US_WAVENET_C = "en-US-Wavenet-C",
  EN_US_WAVENET_D = "en-US-Wavenet-D",
  EN_US_WAVENET_E = "en-US-Wavenet-E",
  EN_US_WAVENET_F = "en-US-Wavenet-F",
  EN_US_WAVENET_G = "en-US-Wavenet-G",
  EN_US_WAVENET_H = "en-US-Wavenet-H",
  EN_US_WAVENET_I = "en-US-Wavenet-I",
  EN_US_WAVENET_J = "en-US-Wavenet-J",
  ES_ES_NEURAL2_A = "es-ES-Neural2-A",
  ES_ES_NEURAL2_B = "es-ES-Neural2-B",
  ES_ES_NEURAL2_C = "es-ES-Neural2-C",
  ES_ES_NEURAL2_D = "es-ES-Neural2-D",
  ES_ES_NEURAL2_E = "es-ES-Neural2-E",
  ES_ES_NEURAL2_F = "es-ES-Neural2-F",
  ES_ES_POLYGLOT_1 = "es-ES-Polyglot-1",
  ES_ES_STANDARD_A = "es-ES-Standard-A",
  ES_ES_STANDARD_B = "es-ES-Standard-B",
  ES_ES_STANDARD_C = "es-ES-Standard-C",
  ES_ES_STANDARD_D = "es-ES-Standard-D",
  ES_ES_STUDIO_C = "es-ES-Studio-C",
  ES_ES_STUDIO_F = "es-ES-Studio-F",
  ES_ES_WAVENET_B = "es-ES-Wavenet-B",
  ES_ES_WAVENET_C = "es-ES-Wavenet-C",
  ES_ES_WAVENET_D = "es-ES-Wavenet-D",
  ES_US_NEURAL2_A = "es-US-Neural2-A",
  ES_US_NEURAL2_B = "es-US-Neural2-B",
  ES_US_NEURAL2_C = "es-US-Neural2-C",
  ES_US_NEWS_D = "es-US-News-D",
  ES_US_NEWS_E = "es-US-News-E",
  ES_US_NEWS_F = "es-US-News-F",
  ES_US_NEWS_G = "es-US-News-G",
  ES_US_POLYGLOT_1 = "es-US-Polyglot-1",
  ES_US_STANDARD_A = "es-US-Standard-A",
  ES_US_STANDARD_B = "es-US-Standard-B",
  ES_US_STANDARD_C = "es-US-Standard-C",
  ES_US_STUDIO_B = "es-US-Studio-B",
  ES_US_WAVENET_A = "es-US-Wavenet-A",
  ES_US_WAVENET_B = "es-US-Wavenet-B",
  ES_US_WAVENET_C = "es-US-Wavenet-C",
  EU_ES_STANDARD_A = "eu-ES-Standard-A",
  FI_FI_STANDARD_A = "fi-FI-Standard-A",
  FI_FI_WAVENET_A = "fi-FI-Wavenet-A",
  FIL_PH_STANDARD_A = "fil-PH-Standard-A",
  FIL_PH_STANDARD_B = "fil-PH-Standard-B",
  FIL_PH_STANDARD_C = "fil-PH-Standard-C",
  FIL_PH_STANDARD_D = "fil-PH-Standard-D",
  FIL_PH_WAVENET_A = "fil-PH-Wavenet-A",
  FIL_PH_WAVENET_B = "fil-PH-Wavenet-B",
  FIL_PH_WAVENET_C = "fil-PH-Wavenet-C",
  FIL_PH_WAVENET_D = "fil-PH-Wavenet-D",
  FIL_PH_NEURAL2_A = "fil-ph-Neural2-A",
  FIL_PH_NEURAL2_D = "fil-ph-Neural2-D",
  FR_CA_NEURAL2_A = "fr-CA-Neural2-A",
  FR_CA_NEURAL2_B = "fr-CA-Neural2-B",
  FR_CA_NEURAL2_C = "fr-CA-Neural2-C",
  FR_CA_NEURAL2_D = "fr-CA-Neural2-D",
  FR_CA_STANDARD_A = "fr-CA-Standard-A",
  FR_CA_STANDARD_B = "fr-CA-Standard-B",
  FR_CA_STANDARD_C = "fr-CA-Standard-C",
  FR_CA_STANDARD_D = "fr-CA-Standard-D",
  FR_CA_WAVENET_A = "fr-CA-Wavenet-A",
  FR_CA_WAVENET_B = "fr-CA-Wavenet-B",
  FR_CA_WAVENET_C = "fr-CA-Wavenet-C",
  FR_CA_WAVENET_D = "fr-CA-Wavenet-D",
  FR_FR_NEURAL2_A = "fr-FR-Neural2-A",
  FR_FR_NEURAL2_B = "fr-FR-Neural2-B",
  FR_FR_NEURAL2_C = "fr-FR-Neural2-C",
  FR_FR_NEURAL2_D = "fr-FR-Neural2-D",
  FR_FR_NEURAL2_E = "fr-FR-Neural2-E",
  FR_FR_POLYGLOT_1 = "fr-FR-Polyglot-1",
  FR_FR_STANDARD_A = "fr-FR-Standard-A",
  FR_FR_STANDARD_B = "fr-FR-Standard-B",
  FR_FR_STANDARD_C = "fr-FR-Standard-C",
  FR_FR_STANDARD_D = "fr-FR-Standard-D",
  FR_FR_STANDARD_E = "fr-FR-Standard-E",
  FR_FR_STUDIO_A = "fr-FR-Studio-A",
  FR_FR_STUDIO_D = "fr-FR-Studio-D",
  FR_FR_WAVENET_A = "fr-FR-Wavenet-A",
  FR_FR_WAVENET_B = "fr-FR-Wavenet-B",
  FR_FR_WAVENET_C = "fr-FR-Wavenet-C",
  FR_FR_WAVENET_D = "fr-FR-Wavenet-D",
  FR_FR_WAVENET_E = "fr-FR-Wavenet-E",
  GL_ES_STANDARD_A = "gl-ES-Standard-A",
  GU_IN_STANDARD_A = "gu-IN-Standard-A",
  GU_IN_STANDARD_B = "gu-IN-Standard-B",
  GU_IN_STANDARD_C = "gu-IN-Standard-C",
  GU_IN_STANDARD_D = "gu-IN-Standard-D",
  GU_IN_WAVENET_A = "gu-IN-Wavenet-A",
  GU_IN_WAVENET_B = "gu-IN-Wavenet-B",
  GU_IN_WAVENET_C = "gu-IN-Wavenet-C",
  GU_IN_WAVENET_D = "gu-IN-Wavenet-D",
  HE_IL_STANDARD_A = "he-IL-Standard-A",
  HE_IL_STANDARD_B = "he-IL-Standard-B",
  HE_IL_STANDARD_C = "he-IL-Standard-C",
  HE_IL_STANDARD_D = "he-IL-Standard-D",
  HE_IL_WAVENET_A = "he-IL-Wavenet-A",
  HE_IL_WAVENET_B = "he-IL-Wavenet-B",
  HE_IL_WAVENET_C = "he-IL-Wavenet-C",
  HE_IL_WAVENET_D = "he-IL-Wavenet-D",
  HI_IN_NEURAL2_A = "hi-IN-Neural2-A",
  HI_IN_NEURAL2_B = "hi-IN-Neural2-B",
  HI_IN_NEURAL2_C = "hi-IN-Neural2-C",
  HI_IN_NEURAL2_D = "hi-IN-Neural2-D",
  HI_IN_STANDARD_A = "hi-IN-Standard-A",
  HI_IN_STANDARD_B = "hi-IN-Standard-B",
  HI_IN_STANDARD_C = "hi-IN-Standard-C",
  HI_IN_STANDARD_D = "hi-IN-Standard-D",
  HI_IN_WAVENET_A = "hi-IN-Wavenet-A",
  HI_IN_WAVENET_B = "hi-IN-Wavenet-B",
  HI_IN_WAVENET_C = "hi-IN-Wavenet-C",
  HI_IN_WAVENET_D = "hi-IN-Wavenet-D",
  HU_HU_STANDARD_A = "hu-HU-Standard-A",
  HU_HU_WAVENET_A = "hu-HU-Wavenet-A",
  ID_ID_STANDARD_A = "id-ID-Standard-A",
  ID_ID_STANDARD_B = "id-ID-Standard-B",
  ID_ID_STANDARD_C = "id-ID-Standard-C",
  ID_ID_STANDARD_D = "id-ID-Standard-D",
  ID_ID_WAVENET_A = "id-ID-Wavenet-A",
  ID_ID_WAVENET_B = "id-ID-Wavenet-B",
  ID_ID_WAVENET_C = "id-ID-Wavenet-C",
  ID_ID_WAVENET_D = "id-ID-Wavenet-D",
  IS_IS_STANDARD_A = "is-IS-Standard-A",
  IT_IT_NEURAL2_A = "it-IT-Neural2-A",
  IT_IT_NEURAL2_C = "it-IT-Neural2-C",
  IT_IT_STANDARD_A = "it-IT-Standard-A",
  IT_IT_STANDARD_B = "it-IT-Standard-B",
  IT_IT_STANDARD_C = "it-IT-Standard-C",
  IT_IT_STANDARD_D = "it-IT-Standard-D",
  IT_IT_WAVENET_A = "it-IT-Wavenet-A",
  IT_IT_WAVENET_B = "it-IT-Wavenet-B",
  IT_IT_WAVENET_C = "it-IT-Wavenet-C",
  IT_IT_WAVENET_D = "it-IT-Wavenet-D",
  JA_JP_NEURAL2_B = "ja-JP-Neural2-B",
  JA_JP_NEURAL2_C = "ja-JP-Neural2-C",
  JA_JP_NEURAL2_D = "ja-JP-Neural2-D",
  JA_JP_STANDARD_A = "ja-JP-Standard-A",
  JA_JP_STANDARD_B = "ja-JP-Standard-B",
  JA_JP_STANDARD_C = "ja-JP-Standard-C",
  JA_JP_STANDARD_D = "ja-JP-Standard-D",
  JA_JP_WAVENET_A = "ja-JP-Wavenet-A",
  JA_JP_WAVENET_B = "ja-JP-Wavenet-B",
  JA_JP_WAVENET_C = "ja-JP-Wavenet-C",
  JA_JP_WAVENET_D = "ja-JP-Wavenet-D",
  KN_IN_STANDARD_A = "kn-IN-Standard-A",
  KN_IN_STANDARD_B = "kn-IN-Standard-B",
  KN_IN_STANDARD_C = "kn-IN-Standard-C",
  KN_IN_STANDARD_D = "kn-IN-Standard-D",
  KN_IN_WAVENET_A = "kn-IN-Wavenet-A",
  KN_IN_WAVENET_B = "kn-IN-Wavenet-B",
  KN_IN_WAVENET_C = "kn-IN-Wavenet-C",
  KN_IN_WAVENET_D = "kn-IN-Wavenet-D",
  KO_KR_NEURAL2_A = "ko-KR-Neural2-A",
  KO_KR_NEURAL2_B = "ko-KR-Neural2-B",
  KO_KR_NEURAL2_C = "ko-KR-Neural2-C",
  KO_KR_STANDARD_A = "ko-KR-Standard-A",
  KO_KR_STANDARD_B = "ko-KR-Standard-B",
  KO_KR_STANDARD_C = "ko-KR-Standard-C",
  KO_KR_STANDARD_D = "ko-KR-Standard-D",
  KO_KR_WAVENET_A = "ko-KR-Wavenet-A",
  KO_KR_WAVENET_B = "ko-KR-Wavenet-B",
  KO_KR_WAVENET_C = "ko-KR-Wavenet-C",
  KO_KR_WAVENET_D = "ko-KR-Wavenet-D",
  LT_LT_STANDARD_A = "lt-LT-Standard-A",
  LV_LV_STANDARD_A = "lv-LV-Standard-A",
  ML_IN_STANDARD_A = "ml-IN-Standard-A",
  ML_IN_STANDARD_B = "ml-IN-Standard-B",
  ML_IN_STANDARD_C = "ml-IN-Standard-C",
  ML_IN_STANDARD_D = "ml-IN-Standard-D",
  ML_IN_WAVENET_A = "ml-IN-Wavenet-A",
  ML_IN_WAVENET_B = "ml-IN-Wavenet-B",
  ML_IN_WAVENET_C = "ml-IN-Wavenet-C",
  ML_IN_WAVENET_D = "ml-IN-Wavenet-D",
  MR_IN_STANDARD_A = "mr-IN-Standard-A",
  MR_IN_STANDARD_B = "mr-IN-Standard-B",
  MR_IN_STANDARD_C = "mr-IN-Standard-C",
  MR_IN_WAVENET_A = "mr-IN-Wavenet-A",
  MR_IN_WAVENET_B = "mr-IN-Wavenet-B",
  MR_IN_WAVENET_C = "mr-IN-Wavenet-C",
  MS_MY_STANDARD_A = "ms-MY-Standard-A",
  MS_MY_STANDARD_B = "ms-MY-Standard-B",
  MS_MY_STANDARD_C = "ms-MY-Standard-C",
  MS_MY_STANDARD_D = "ms-MY-Standard-D",
  MS_MY_WAVENET_A = "ms-MY-Wavenet-A",
  MS_MY_WAVENET_B = "ms-MY-Wavenet-B",
  MS_MY_WAVENET_C = "ms-MY-Wavenet-C",
  MS_MY_WAVENET_D = "ms-MY-Wavenet-D",
  NB_NO_STANDARD_A = "nb-NO-Standard-A",
  NB_NO_STANDARD_B = "nb-NO-Standard-B",
  NB_NO_STANDARD_C = "nb-NO-Standard-C",
  NB_NO_STANDARD_D = "nb-NO-Standard-D",
  NB_NO_STANDARD_E = "nb-NO-Standard-E",
  NB_NO_WAVENET_A = "nb-NO-Wavenet-A",
  NB_NO_WAVENET_B = "nb-NO-Wavenet-B",
  NB_NO_WAVENET_C = "nb-NO-Wavenet-C",
  NB_NO_WAVENET_D = "nb-NO-Wavenet-D",
  NB_NO_WAVENET_E = "nb-NO-Wavenet-E",
  NL_BE_STANDARD_A = "nl-BE-Standard-A",
  NL_BE_STANDARD_B = "nl-BE-Standard-B",
  NL_BE_WAVENET_A = "nl-BE-Wavenet-A",
  NL_BE_WAVENET_B = "nl-BE-Wavenet-B",
  NL_NL_STANDARD_A = "nl-NL-Standard-A",
  NL_NL_STANDARD_B = "nl-NL-Standard-B",
  NL_NL_STANDARD_C = "nl-NL-Standard-C",
  NL_NL_STANDARD_D = "nl-NL-Standard-D",
  NL_NL_STANDARD_E = "nl-NL-Standard-E",
  NL_NL_WAVENET_A = "nl-NL-Wavenet-A",
  NL_NL_WAVENET_B = "nl-NL-Wavenet-B",
  NL_NL_WAVENET_C = "nl-NL-Wavenet-C",
  NL_NL_WAVENET_D = "nl-NL-Wavenet-D",
  NL_NL_WAVENET_E = "nl-NL-Wavenet-E",
  PA_IN_STANDARD_A = "pa-IN-Standard-A",
  PA_IN_STANDARD_B = "pa-IN-Standard-B",
  PA_IN_STANDARD_C = "pa-IN-Standard-C",
  PA_IN_STANDARD_D = "pa-IN-Standard-D",
  PA_IN_WAVENET_A = "pa-IN-Wavenet-A",
  PA_IN_WAVENET_B = "pa-IN-Wavenet-B",
  PA_IN_WAVENET_C = "pa-IN-Wavenet-C",
  PA_IN_WAVENET_D = "pa-IN-Wavenet-D",
  PL_PL_STANDARD_A = "pl-PL-Standard-A",
  PL_PL_STANDARD_B = "pl-PL-Standard-B",
  PL_PL_STANDARD_C = "pl-PL-Standard-C",
  PL_PL_STANDARD_D = "pl-PL-Standard-D",
  PL_PL_STANDARD_E = "pl-PL-Standard-E",
  PL_PL_WAVENET_A = "pl-PL-Wavenet-A",
  PL_PL_WAVENET_B = "pl-PL-Wavenet-B",
  PL_PL_WAVENET_C = "pl-PL-Wavenet-C",
  PL_PL_WAVENET_D = "pl-PL-Wavenet-D",
  PL_PL_WAVENET_E = "pl-PL-Wavenet-E",
  PT_BR_NEURAL2_A = "pt-BR-Neural2-A",
  PT_BR_NEURAL2_B = "pt-BR-Neural2-B",
  PT_BR_NEURAL2_C = "pt-BR-Neural2-C",
  PT_BR_STANDARD_A = "pt-BR-Standard-A",
  PT_BR_STANDARD_B = "pt-BR-Standard-B",
  PT_BR_STANDARD_C = "pt-BR-Standard-C",
  PT_BR_WAVENET_A = "pt-BR-Wavenet-A",
  PT_BR_WAVENET_B = "pt-BR-Wavenet-B",
  PT_BR_WAVENET_C = "pt-BR-Wavenet-C",
  PT_PT_STANDARD_A = "pt-PT-Standard-A",
  PT_PT_STANDARD_B = "pt-PT-Standard-B",
  PT_PT_STANDARD_C = "pt-PT-Standard-C",
  PT_PT_STANDARD_D = "pt-PT-Standard-D",
  PT_PT_WAVENET_A = "pt-PT-Wavenet-A",
  PT_PT_WAVENET_B = "pt-PT-Wavenet-B",
  PT_PT_WAVENET_C = "pt-PT-Wavenet-C",
  PT_PT_WAVENET_D = "pt-PT-Wavenet-D",
  RO_RO_STANDARD_A = "ro-RO-Standard-A",
  RO_RO_WAVENET_A = "ro-RO-Wavenet-A",
  RU_RU_STANDARD_A = "ru-RU-Standard-A",
  RU_RU_STANDARD_B = "ru-RU-Standard-B",
  RU_RU_STANDARD_C = "ru-RU-Standard-C",
  RU_RU_STANDARD_D = "ru-RU-Standard-D",
  RU_RU_STANDARD_E = "ru-RU-Standard-E",
  RU_RU_WAVENET_A = "ru-RU-Wavenet-A",
  RU_RU_WAVENET_B = "ru-RU-Wavenet-B",
  RU_RU_WAVENET_C = "ru-RU-Wavenet-C",
  RU_RU_WAVENET_D = "ru-RU-Wavenet-D",
  RU_RU_WAVENET_E = "ru-RU-Wavenet-E",
  SK_SK_STANDARD_A = "sk-SK-Standard-A",
  SK_SK_WAVENET_A = "sk-SK-Wavenet-A",
  SR_RS_STANDARD_A = "sr-RS-Standard-A",
  SV_SE_STANDARD_A = "sv-SE-Standard-A",
  SV_SE_STANDARD_B = "sv-SE-Standard-B",
  SV_SE_STANDARD_C = "sv-SE-Standard-C",
  SV_SE_STANDARD_D = "sv-SE-Standard-D",
  SV_SE_STANDARD_E = "sv-SE-Standard-E",
  SV_SE_WAVENET_A = "sv-SE-Wavenet-A",
  SV_SE_WAVENET_B = "sv-SE-Wavenet-B",
  SV_SE_WAVENET_C = "sv-SE-Wavenet-C",
  SV_SE_WAVENET_D = "sv-SE-Wavenet-D",
  SV_SE_WAVENET_E = "sv-SE-Wavenet-E",
  TA_IN_STANDARD_A = "ta-IN-Standard-A",
  TA_IN_STANDARD_B = "ta-IN-Standard-B",
  TA_IN_STANDARD_C = "ta-IN-Standard-C",
  TA_IN_STANDARD_D = "ta-IN-Standard-D",
  TA_IN_WAVENET_A = "ta-IN-Wavenet-A",
  TA_IN_WAVENET_B = "ta-IN-Wavenet-B",
  TA_IN_WAVENET_C = "ta-IN-Wavenet-C",
  TA_IN_WAVENET_D = "ta-IN-Wavenet-D",
  TE_IN_STANDARD_A = "te-IN-Standard-A",
  TE_IN_STANDARD_B = "te-IN-Standard-B",
  TH_TH_NEURAL2_C = "th-TH-Neural2-C",
  TH_TH_STANDARD_A = "th-TH-Standard-A",
  TR_TR_STANDARD_A = "tr-TR-Standard-A",
  TR_TR_STANDARD_B = "tr-TR-Standard-B",
  TR_TR_STANDARD_C = "tr-TR-Standard-C",
  TR_TR_STANDARD_D = "tr-TR-Standard-D",
  TR_TR_STANDARD_E = "tr-TR-Standard-E",
  TR_TR_WAVENET_A = "tr-TR-Wavenet-A",
  TR_TR_WAVENET_B = "tr-TR-Wavenet-B",
  TR_TR_WAVENET_C = "tr-TR-Wavenet-C",
  TR_TR_WAVENET_D = "tr-TR-Wavenet-D",
  TR_TR_WAVENET_E = "tr-TR-Wavenet-E",
  UK_UA_STANDARD_A = "uk-UA-Standard-A",
  UK_UA_WAVENET_A = "uk-UA-Wavenet-A",
  UR_IN_STANDARD_A = "ur-IN-Standard-A",
  UR_IN_STANDARD_B = "ur-IN-Standard-B",
  UR_IN_WAVENET_A = "ur-IN-Wavenet-A",
  UR_IN_WAVENET_B = "ur-IN-Wavenet-B",
  VI_VN_NEURAL2_A = "vi-VN-Neural2-A",
  VI_VN_NEURAL2_D = "vi-VN-Neural2-D",
  VI_VN_STANDARD_A = "vi-VN-Standard-A",
  VI_VN_STANDARD_B = "vi-VN-Standard-B",
  VI_VN_STANDARD_C = "vi-VN-Standard-C",
  VI_VN_STANDARD_D = "vi-VN-Standard-D",
  VI_VN_WAVENET_A = "vi-VN-Wavenet-A",
  VI_VN_WAVENET_B = "vi-VN-Wavenet-B",
  VI_VN_WAVENET_C = "vi-VN-Wavenet-C",
  VI_VN_WAVENET_D = "vi-VN-Wavenet-D",
  YUE_HK_STANDARD_A = "yue-HK-Standard-A",
  YUE_HK_STANDARD_B = "yue-HK-Standard-B",
  YUE_HK_STANDARD_C = "yue-HK-Standard-C",
  YUE_HK_STANDARD_D = "yue-HK-Standard-D"
}

const GoogleVoiceDetails = [
  {
    name: GoogleVoice.AF_ZA_STANDARD_A,
    displayName: "Standard A",
    languageCode: VoiceLanguage.AF_ZA,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.AM_ET_STANDARD_A,
    displayName: "Standard A",
    languageCode: VoiceLanguage.AM_ET,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.AM_ET_STANDARD_B,
    displayName: "Standard B",
    languageCode: VoiceLanguage.AM_ET,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.AM_ET_WAVENET_A,
    displayName: "Wavenet A",
    languageCode: VoiceLanguage.AM_ET,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.AM_ET_WAVENET_B,
    displayName: "Wavenet B",
    languageCode: VoiceLanguage.AM_ET,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.AR_XA_STANDARD_A,
    displayName: "Standard A",
    languageCode: VoiceLanguage.AR_XA,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.AR_XA_STANDARD_B,
    displayName: "Standard B",
    languageCode: VoiceLanguage.AR_XA,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.AR_XA_STANDARD_C,
    displayName: "Standard C",
    languageCode: VoiceLanguage.AR_XA,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.AR_XA_STANDARD_D,
    displayName: "Standard D",
    languageCode: VoiceLanguage.AR_XA,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.AR_XA_WAVENET_A,
    displayName: "Wavenet A",
    languageCode: VoiceLanguage.AR_XA,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.AR_XA_WAVENET_B,
    displayName: "Wavenet B",
    languageCode: VoiceLanguage.AR_XA,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.AR_XA_WAVENET_C,
    displayName: "Wavenet C",
    languageCode: VoiceLanguage.AR_XA,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.AR_XA_WAVENET_D,
    displayName: "Wavenet D",
    languageCode: VoiceLanguage.AR_XA,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.BG_BG_STANDARD_A,
    displayName: "Standard A",
    languageCode: VoiceLanguage.BG_BG,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.BN_IN_STANDARD_A,
    displayName: "Standard A",
    languageCode: VoiceLanguage.BN_IN,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.BN_IN_STANDARD_B,
    displayName: "Standard B",
    languageCode: VoiceLanguage.BN_IN,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.BN_IN_STANDARD_C,
    displayName: "Standard C",
    languageCode: VoiceLanguage.BN_IN,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.BN_IN_STANDARD_D,
    displayName: "Standard D",
    languageCode: VoiceLanguage.BN_IN,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.BN_IN_WAVENET_A,
    displayName: "Wavenet A",
    languageCode: VoiceLanguage.BN_IN,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.BN_IN_WAVENET_B,
    displayName: "Wavenet B",
    languageCode: VoiceLanguage.BN_IN,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.BN_IN_WAVENET_C,
    displayName: "Wavenet C",
    languageCode: VoiceLanguage.BN_IN,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.BN_IN_WAVENET_D,
    displayName: "Wavenet D",
    languageCode: VoiceLanguage.BN_IN,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.CA_ES_STANDARD_A,
    displayName: "Standard A",
    languageCode: VoiceLanguage.CA_ES,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.CMN_CN_STANDARD_A,
    displayName: "Standard A",
    languageCode: VoiceLanguage.CMN_CN,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.CMN_CN_STANDARD_B,
    displayName: "Standard B",
    languageCode: VoiceLanguage.CMN_CN,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.CMN_CN_STANDARD_C,
    displayName: "Standard C",
    languageCode: VoiceLanguage.CMN_CN,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.CMN_CN_STANDARD_D,
    displayName: "Standard D",
    languageCode: VoiceLanguage.CMN_CN,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.CMN_CN_WAVENET_A,
    displayName: "Wavenet A",
    languageCode: VoiceLanguage.CMN_CN,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.CMN_CN_WAVENET_B,
    displayName: "Wavenet B",
    languageCode: VoiceLanguage.CMN_CN,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.CMN_CN_WAVENET_C,
    displayName: "Wavenet C",
    languageCode: VoiceLanguage.CMN_CN,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.CMN_CN_WAVENET_D,
    displayName: "Wavenet D",
    languageCode: VoiceLanguage.CMN_CN,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.CMN_TW_STANDARD_A,
    displayName: "Standard A",
    languageCode: VoiceLanguage.CMN_TW,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.CMN_TW_STANDARD_B,
    displayName: "Standard B",
    languageCode: VoiceLanguage.CMN_TW,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.CMN_TW_STANDARD_C,
    displayName: "Standard C",
    languageCode: VoiceLanguage.CMN_TW,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.CMN_TW_WAVENET_A,
    displayName: "Wavenet A",
    languageCode: VoiceLanguage.CMN_TW,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.CMN_TW_WAVENET_B,
    displayName: "Wavenet B",
    languageCode: VoiceLanguage.CMN_TW,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.CMN_TW_WAVENET_C,
    displayName: "Wavenet C",
    languageCode: VoiceLanguage.CMN_TW,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.CS_CZ_STANDARD_A,
    displayName: "Standard A",
    languageCode: VoiceLanguage.CS_CZ,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.CS_CZ_WAVENET_A,
    displayName: "Wavenet A",
    languageCode: VoiceLanguage.CS_CZ,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.DA_DK_NEURAL2_D,
    displayName: "Neural2 D",
    languageCode: VoiceLanguage.DA_DK,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.DA_DK_STANDARD_A,
    displayName: "Standard A",
    languageCode: VoiceLanguage.DA_DK,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.DA_DK_STANDARD_C,
    displayName: "Standard C",
    languageCode: VoiceLanguage.DA_DK,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.DA_DK_STANDARD_D,
    displayName: "Standard D",
    languageCode: VoiceLanguage.DA_DK,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.DA_DK_STANDARD_E,
    displayName: "Standard E",
    languageCode: VoiceLanguage.DA_DK,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.DA_DK_WAVENET_A,
    displayName: "Wavenet A",
    languageCode: VoiceLanguage.DA_DK,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.DA_DK_WAVENET_C,
    displayName: "Wavenet C",
    languageCode: VoiceLanguage.DA_DK,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.DA_DK_WAVENET_D,
    displayName: "Wavenet D",
    languageCode: VoiceLanguage.DA_DK,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.DA_DK_WAVENET_E,
    displayName: "Wavenet E",
    languageCode: VoiceLanguage.DA_DK,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.DE_DE_NEURAL2_A,
    displayName: "Neural2 A",
    languageCode: VoiceLanguage.DE_DE,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.DE_DE_NEURAL2_B,
    displayName: "Neural2 B",
    languageCode: VoiceLanguage.DE_DE,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.DE_DE_NEURAL2_C,
    displayName: "Neural2 C",
    languageCode: VoiceLanguage.DE_DE,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.DE_DE_NEURAL2_D,
    displayName: "Neural2 D",
    languageCode: VoiceLanguage.DE_DE,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.DE_DE_NEURAL2_F,
    displayName: "Neural2 F",
    languageCode: VoiceLanguage.DE_DE,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.DE_DE_POLYGLOT_1,
    displayName: "Polyglot 1",
    languageCode: VoiceLanguage.DE_DE,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.DE_DE_STANDARD_A,
    displayName: "Standard A",
    languageCode: VoiceLanguage.DE_DE,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.DE_DE_STANDARD_B,
    displayName: "Standard B",
    languageCode: VoiceLanguage.DE_DE,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.DE_DE_STANDARD_C,
    displayName: "Standard C",
    languageCode: VoiceLanguage.DE_DE,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.DE_DE_STANDARD_D,
    displayName: "Standard D",
    languageCode: VoiceLanguage.DE_DE,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.DE_DE_STANDARD_E,
    displayName: "Standard E",
    languageCode: VoiceLanguage.DE_DE,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.DE_DE_STANDARD_F,
    displayName: "Standard F",
    languageCode: VoiceLanguage.DE_DE,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.DE_DE_STUDIO_B,
    displayName: "Studio B",
    languageCode: VoiceLanguage.DE_DE,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.DE_DE_STUDIO_C,
    displayName: "Studio C",
    languageCode: VoiceLanguage.DE_DE,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.DE_DE_WAVENET_A,
    displayName: "Wavenet A",
    languageCode: VoiceLanguage.DE_DE,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.DE_DE_WAVENET_B,
    displayName: "Wavenet B",
    languageCode: VoiceLanguage.DE_DE,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.DE_DE_WAVENET_C,
    displayName: "Wavenet C",
    languageCode: VoiceLanguage.DE_DE,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.DE_DE_WAVENET_D,
    displayName: "Wavenet D",
    languageCode: VoiceLanguage.DE_DE,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.DE_DE_WAVENET_E,
    displayName: "Wavenet E",
    languageCode: VoiceLanguage.DE_DE,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.DE_DE_WAVENET_F,
    displayName: "Wavenet F",
    languageCode: VoiceLanguage.DE_DE,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.EL_GR_STANDARD_A,
    displayName: "Standard A",
    languageCode: VoiceLanguage.EL_GR,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.EL_GR_WAVENET_A,
    displayName: "Wavenet A",
    languageCode: VoiceLanguage.EL_GR,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.EN_AU_NEURAL2_A,
    displayName: "Neural2 A",
    languageCode: VoiceLanguage.EN_AU,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.EN_AU_NEURAL2_B,
    displayName: "Neural2 B",
    languageCode: VoiceLanguage.EN_AU,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.EN_AU_NEURAL2_C,
    displayName: "Neural2 C",
    languageCode: VoiceLanguage.EN_AU,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.EN_AU_NEURAL2_D,
    displayName: "Neural2 D",
    languageCode: VoiceLanguage.EN_AU,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.EN_AU_NEWS_E,
    displayName: "News E",
    languageCode: VoiceLanguage.EN_AU,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.EN_AU_NEWS_F,
    displayName: "News F",
    languageCode: VoiceLanguage.EN_AU,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.EN_AU_NEWS_G,
    displayName: "News G",
    languageCode: VoiceLanguage.EN_AU,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.EN_AU_POLYGLOT_1,
    displayName: "Polyglot 1",
    languageCode: VoiceLanguage.EN_AU,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.EN_AU_STANDARD_A,
    displayName: "Standard A",
    languageCode: VoiceLanguage.EN_AU,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.EN_AU_STANDARD_B,
    displayName: "Standard B",
    languageCode: VoiceLanguage.EN_AU,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.EN_AU_STANDARD_C,
    displayName: "Standard C",
    languageCode: VoiceLanguage.EN_AU,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.EN_AU_STANDARD_D,
    displayName: "Standard D",
    languageCode: VoiceLanguage.EN_AU,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.EN_AU_WAVENET_A,
    displayName: "Wavenet A",
    languageCode: VoiceLanguage.EN_AU,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.EN_AU_WAVENET_B,
    displayName: "Wavenet B",
    languageCode: VoiceLanguage.EN_AU,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.EN_AU_WAVENET_C,
    displayName: "Wavenet C",
    languageCode: VoiceLanguage.EN_AU,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.EN_AU_WAVENET_D,
    displayName: "Wavenet D",
    languageCode: VoiceLanguage.EN_AU,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.EN_GB_NEURAL2_A,
    displayName: "Neural2 A",
    languageCode: VoiceLanguage.EN_GB,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.EN_GB_NEURAL2_B,
    displayName: "Neural2 B",
    languageCode: VoiceLanguage.EN_GB,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.EN_GB_NEURAL2_C,
    displayName: "Neural2 C",
    languageCode: VoiceLanguage.EN_GB,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.EN_GB_NEURAL2_D,
    displayName: "Neural2 D",
    languageCode: VoiceLanguage.EN_GB,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.EN_GB_NEURAL2_F,
    displayName: "Neural2 F",
    languageCode: VoiceLanguage.EN_GB,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.EN_GB_NEWS_G,
    displayName: "News G",
    languageCode: VoiceLanguage.EN_GB,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.EN_GB_NEWS_H,
    displayName: "News H",
    languageCode: VoiceLanguage.EN_GB,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.EN_GB_NEWS_I,
    displayName: "News I",
    languageCode: VoiceLanguage.EN_GB,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.EN_GB_NEWS_J,
    displayName: "News J",
    languageCode: VoiceLanguage.EN_GB,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.EN_GB_NEWS_K,
    displayName: "News K",
    languageCode: VoiceLanguage.EN_GB,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.EN_GB_NEWS_L,
    displayName: "News L",
    languageCode: VoiceLanguage.EN_GB,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.EN_GB_NEWS_M,
    displayName: "News M",
    languageCode: VoiceLanguage.EN_GB,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.EN_GB_STANDARD_A,
    displayName: "Standard A",
    languageCode: VoiceLanguage.EN_GB,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.EN_GB_STANDARD_B,
    displayName: "Standard B",
    languageCode: VoiceLanguage.EN_GB,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.EN_GB_STANDARD_C,
    displayName: "Standard C",
    languageCode: VoiceLanguage.EN_GB,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.EN_GB_STANDARD_D,
    displayName: "Standard D",
    languageCode: VoiceLanguage.EN_GB,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.EN_GB_STANDARD_F,
    displayName: "Standard F",
    languageCode: VoiceLanguage.EN_GB,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.EN_GB_STUDIO_B,
    displayName: "Studio B",
    languageCode: VoiceLanguage.EN_GB,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.EN_GB_STUDIO_C,
    displayName: "Studio C",
    languageCode: VoiceLanguage.EN_GB,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.EN_GB_WAVENET_A,
    displayName: "Wavenet A",
    languageCode: VoiceLanguage.EN_GB,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.EN_GB_WAVENET_B,
    displayName: "Wavenet B",
    languageCode: VoiceLanguage.EN_GB,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.EN_GB_WAVENET_C,
    displayName: "Wavenet C",
    languageCode: VoiceLanguage.EN_GB,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.EN_GB_WAVENET_D,
    displayName: "Wavenet D",
    languageCode: VoiceLanguage.EN_GB,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.EN_GB_WAVENET_F,
    displayName: "Wavenet F",
    languageCode: VoiceLanguage.EN_GB,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.EN_IN_NEURAL2_A,
    displayName: "Neural2 A",
    languageCode: VoiceLanguage.EN_IN,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.EN_IN_NEURAL2_B,
    displayName: "Neural2 B",
    languageCode: VoiceLanguage.EN_IN,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.EN_IN_NEURAL2_C,
    displayName: "Neural2 C",
    languageCode: VoiceLanguage.EN_IN,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.EN_IN_NEURAL2_D,
    displayName: "Neural2 D",
    languageCode: VoiceLanguage.EN_IN,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.EN_IN_STANDARD_A,
    displayName: "Standard A",
    languageCode: VoiceLanguage.EN_IN,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.EN_IN_STANDARD_B,
    displayName: "Standard B",
    languageCode: VoiceLanguage.EN_IN,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.EN_IN_STANDARD_C,
    displayName: "Standard C",
    languageCode: VoiceLanguage.EN_IN,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.EN_IN_STANDARD_D,
    displayName: "Standard D",
    languageCode: VoiceLanguage.EN_IN,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.EN_IN_WAVENET_A,
    displayName: "Wavenet A",
    languageCode: VoiceLanguage.EN_IN,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.EN_IN_WAVENET_B,
    displayName: "Wavenet B",
    languageCode: VoiceLanguage.EN_IN,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.EN_IN_WAVENET_C,
    displayName: "Wavenet C",
    languageCode: VoiceLanguage.EN_IN,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.EN_IN_WAVENET_D,
    displayName: "Wavenet D",
    languageCode: VoiceLanguage.EN_IN,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.EN_US_CASUAL_K,
    displayName: "Casual K",
    languageCode: VoiceLanguage.EN_US,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.EN_US_JOURNEY_D,
    displayName: "Journey D",
    languageCode: VoiceLanguage.EN_US,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.EN_US_JOURNEY_F,
    displayName: "Journey F",
    languageCode: VoiceLanguage.EN_US,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.EN_US_JOURNEY_O,
    displayName: "Journey O",
    languageCode: VoiceLanguage.EN_US,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.EN_US_NEURAL2_A,
    displayName: "Neural2 A",
    languageCode: VoiceLanguage.EN_US,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.EN_US_NEURAL2_C,
    displayName: "Neural2 C",
    languageCode: VoiceLanguage.EN_US,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.EN_US_NEURAL2_D,
    displayName: "Neural2 D",
    languageCode: VoiceLanguage.EN_US,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.EN_US_NEURAL2_E,
    displayName: "Neural2 E",
    languageCode: VoiceLanguage.EN_US,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.EN_US_NEURAL2_F,
    displayName: "Neural2 F",
    languageCode: VoiceLanguage.EN_US,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.EN_US_NEURAL2_G,
    displayName: "Neural2 G",
    languageCode: VoiceLanguage.EN_US,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.EN_US_NEURAL2_H,
    displayName: "Neural2 H",
    languageCode: VoiceLanguage.EN_US,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.EN_US_NEURAL2_I,
    displayName: "Neural2 I",
    languageCode: VoiceLanguage.EN_US,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.EN_US_NEURAL2_J,
    displayName: "Neural2 J",
    languageCode: VoiceLanguage.EN_US,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.EN_US_NEWS_K,
    displayName: "News K",
    languageCode: VoiceLanguage.EN_US,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.EN_US_NEWS_L,
    displayName: "News L",
    languageCode: VoiceLanguage.EN_US,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.EN_US_NEWS_N,
    displayName: "News N",
    languageCode: VoiceLanguage.EN_US,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.EN_US_POLYGLOT_1,
    displayName: "Polyglot 1",
    languageCode: VoiceLanguage.EN_US,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.EN_US_STANDARD_A,
    displayName: "Standard A",
    languageCode: VoiceLanguage.EN_US,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.EN_US_STANDARD_B,
    displayName: "Standard B",
    languageCode: VoiceLanguage.EN_US,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.EN_US_STANDARD_C,
    displayName: "Standard C",
    languageCode: VoiceLanguage.EN_US,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.EN_US_STANDARD_D,
    displayName: "Standard D",
    languageCode: VoiceLanguage.EN_US,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.EN_US_STANDARD_E,
    displayName: "Standard E",
    languageCode: VoiceLanguage.EN_US,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.EN_US_STANDARD_F,
    displayName: "Standard F",
    languageCode: VoiceLanguage.EN_US,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.EN_US_STANDARD_G,
    displayName: "Standard G",
    languageCode: VoiceLanguage.EN_US,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.EN_US_STANDARD_H,
    displayName: "Standard H",
    languageCode: VoiceLanguage.EN_US,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.EN_US_STANDARD_I,
    displayName: "Standard I",
    languageCode: VoiceLanguage.EN_US,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.EN_US_STANDARD_J,
    displayName: "Standard J",
    languageCode: VoiceLanguage.EN_US,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.EN_US_STUDIO_O,
    displayName: "Studio O",
    languageCode: VoiceLanguage.EN_US,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.EN_US_STUDIO_Q,
    displayName: "Studio Q",
    languageCode: VoiceLanguage.EN_US,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.EN_US_WAVENET_A,
    displayName: "Wavenet A",
    languageCode: VoiceLanguage.EN_US,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.EN_US_WAVENET_B,
    displayName: "Wavenet B",
    languageCode: VoiceLanguage.EN_US,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.EN_US_WAVENET_C,
    displayName: "Wavenet C",
    languageCode: VoiceLanguage.EN_US,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.EN_US_WAVENET_D,
    displayName: "Wavenet D",
    languageCode: VoiceLanguage.EN_US,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.EN_US_WAVENET_E,
    displayName: "Wavenet E",
    languageCode: VoiceLanguage.EN_US,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.EN_US_WAVENET_F,
    displayName: "Wavenet F",
    languageCode: VoiceLanguage.EN_US,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.EN_US_WAVENET_G,
    displayName: "Wavenet G",
    languageCode: VoiceLanguage.EN_US,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.EN_US_WAVENET_H,
    displayName: "Wavenet H",
    languageCode: VoiceLanguage.EN_US,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.EN_US_WAVENET_I,
    displayName: "Wavenet I",
    languageCode: VoiceLanguage.EN_US,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.EN_US_WAVENET_J,
    displayName: "Wavenet J",
    languageCode: VoiceLanguage.EN_US,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.ES_ES_NEURAL2_A,
    displayName: "Neural2 A",
    languageCode: VoiceLanguage.ES_ES,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.ES_ES_NEURAL2_B,
    displayName: "Neural2 B",
    languageCode: VoiceLanguage.ES_ES,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.ES_ES_NEURAL2_C,
    displayName: "Neural2 C",
    languageCode: VoiceLanguage.ES_ES,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.ES_ES_NEURAL2_D,
    displayName: "Neural2 D",
    languageCode: VoiceLanguage.ES_ES,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.ES_ES_NEURAL2_E,
    displayName: "Neural2 E",
    languageCode: VoiceLanguage.ES_ES,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.ES_ES_NEURAL2_F,
    displayName: "Neural2 F",
    languageCode: VoiceLanguage.ES_ES,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.ES_ES_POLYGLOT_1,
    displayName: "Polyglot 1",
    languageCode: VoiceLanguage.ES_ES,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.ES_ES_STANDARD_A,
    displayName: "Standard A",
    languageCode: VoiceLanguage.ES_ES,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.ES_ES_STANDARD_B,
    displayName: "Standard B",
    languageCode: VoiceLanguage.ES_ES,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.ES_ES_STANDARD_C,
    displayName: "Standard C",
    languageCode: VoiceLanguage.ES_ES,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.ES_ES_STANDARD_D,
    displayName: "Standard D",
    languageCode: VoiceLanguage.ES_ES,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.ES_ES_STUDIO_C,
    displayName: "Studio C",
    languageCode: VoiceLanguage.ES_ES,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.ES_ES_STUDIO_F,
    displayName: "Studio F",
    languageCode: VoiceLanguage.ES_ES,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.ES_ES_WAVENET_B,
    displayName: "Wavenet B",
    languageCode: VoiceLanguage.ES_ES,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.ES_ES_WAVENET_C,
    displayName: "Wavenet C",
    languageCode: VoiceLanguage.ES_ES,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.ES_ES_WAVENET_D,
    displayName: "Wavenet D",
    languageCode: VoiceLanguage.ES_ES,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.ES_US_NEURAL2_A,
    displayName: "Neural2 A",
    languageCode: VoiceLanguage.ES_US,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.ES_US_NEURAL2_B,
    displayName: "Neural2 B",
    languageCode: VoiceLanguage.ES_US,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.ES_US_NEURAL2_C,
    displayName: "Neural2 C",
    languageCode: VoiceLanguage.ES_US,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.ES_US_NEWS_D,
    displayName: "News D",
    languageCode: VoiceLanguage.ES_US,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.ES_US_NEWS_E,
    displayName: "News E",
    languageCode: VoiceLanguage.ES_US,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.ES_US_NEWS_F,
    displayName: "News F",
    languageCode: VoiceLanguage.ES_US,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.ES_US_NEWS_G,
    displayName: "News G",
    languageCode: VoiceLanguage.ES_US,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.ES_US_POLYGLOT_1,
    displayName: "Polyglot 1",
    languageCode: VoiceLanguage.ES_US,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.ES_US_STANDARD_A,
    displayName: "Standard A",
    languageCode: VoiceLanguage.ES_US,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.ES_US_STANDARD_B,
    displayName: "Standard B",
    languageCode: VoiceLanguage.ES_US,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.ES_US_STANDARD_C,
    displayName: "Standard C",
    languageCode: VoiceLanguage.ES_US,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.ES_US_STUDIO_B,
    displayName: "Studio B",
    languageCode: VoiceLanguage.ES_US,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.ES_US_WAVENET_A,
    displayName: "Wavenet A",
    languageCode: VoiceLanguage.ES_US,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.ES_US_WAVENET_B,
    displayName: "Wavenet B",
    languageCode: VoiceLanguage.ES_US,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.ES_US_WAVENET_C,
    displayName: "Wavenet C",
    languageCode: VoiceLanguage.ES_US,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.EU_ES_STANDARD_A,
    displayName: "Standard A",
    languageCode: VoiceLanguage.EU_ES,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.FI_FI_STANDARD_A,
    displayName: "Standard A",
    languageCode: VoiceLanguage.FI_FI,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.FI_FI_WAVENET_A,
    displayName: "Wavenet A",
    languageCode: VoiceLanguage.FI_FI,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.FIL_PH_STANDARD_A,
    displayName: "Standard A",
    languageCode: VoiceLanguage.FIL_PH,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.FIL_PH_STANDARD_B,
    displayName: "Standard B",
    languageCode: VoiceLanguage.FIL_PH,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.FIL_PH_STANDARD_C,
    displayName: "Standard C",
    languageCode: VoiceLanguage.FIL_PH,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.FIL_PH_STANDARD_D,
    displayName: "Standard D",
    languageCode: VoiceLanguage.FIL_PH,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.FIL_PH_WAVENET_A,
    displayName: "Wavenet A",
    languageCode: VoiceLanguage.FIL_PH,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.FIL_PH_WAVENET_B,
    displayName: "Wavenet B",
    languageCode: VoiceLanguage.FIL_PH,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.FIL_PH_WAVENET_C,
    displayName: "Wavenet C",
    languageCode: VoiceLanguage.FIL_PH,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.FIL_PH_WAVENET_D,
    displayName: "Wavenet D",
    languageCode: VoiceLanguage.FIL_PH,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.FIL_PH_NEURAL2_A,
    displayName: "Neural2 A",
    languageCode: VoiceLanguage.FIL_PH,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.FIL_PH_NEURAL2_D,
    displayName: "Neural2 D",
    languageCode: VoiceLanguage.FIL_PH,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.FR_CA_NEURAL2_A,
    displayName: "Neural2 A",
    languageCode: VoiceLanguage.FR_CA,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.FR_CA_NEURAL2_B,
    displayName: "Neural2 B",
    languageCode: VoiceLanguage.FR_CA,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.FR_CA_NEURAL2_C,
    displayName: "Neural2 C",
    languageCode: VoiceLanguage.FR_CA,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.FR_CA_NEURAL2_D,
    displayName: "Neural2 D",
    languageCode: VoiceLanguage.FR_CA,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.FR_CA_STANDARD_A,
    displayName: "Standard A",
    languageCode: VoiceLanguage.FR_CA,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.FR_CA_STANDARD_B,
    displayName: "Standard B",
    languageCode: VoiceLanguage.FR_CA,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.FR_CA_STANDARD_C,
    displayName: "Standard C",
    languageCode: VoiceLanguage.FR_CA,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.FR_CA_STANDARD_D,
    displayName: "Standard D",
    languageCode: VoiceLanguage.FR_CA,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.FR_CA_WAVENET_A,
    displayName: "Wavenet A",
    languageCode: VoiceLanguage.FR_CA,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.FR_CA_WAVENET_B,
    displayName: "Wavenet B",
    languageCode: VoiceLanguage.FR_CA,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.FR_CA_WAVENET_C,
    displayName: "Wavenet C",
    languageCode: VoiceLanguage.FR_CA,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.FR_CA_WAVENET_D,
    displayName: "Wavenet D",
    languageCode: VoiceLanguage.FR_CA,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.FR_FR_NEURAL2_A,
    displayName: "Neural2 A",
    languageCode: VoiceLanguage.FR_FR,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.FR_FR_NEURAL2_B,
    displayName: "Neural2 B",
    languageCode: VoiceLanguage.FR_FR,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.FR_FR_NEURAL2_C,
    displayName: "Neural2 C",
    languageCode: VoiceLanguage.FR_FR,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.FR_FR_NEURAL2_D,
    displayName: "Neural2 D",
    languageCode: VoiceLanguage.FR_FR,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.FR_FR_NEURAL2_E,
    displayName: "Neural2 E",
    languageCode: VoiceLanguage.FR_FR,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.FR_FR_POLYGLOT_1,
    displayName: "Polyglot 1",
    languageCode: VoiceLanguage.FR_FR,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.FR_FR_STANDARD_A,
    displayName: "Standard A",
    languageCode: VoiceLanguage.FR_FR,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.FR_FR_STANDARD_B,
    displayName: "Standard B",
    languageCode: VoiceLanguage.FR_FR,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.FR_FR_STANDARD_C,
    displayName: "Standard C",
    languageCode: VoiceLanguage.FR_FR,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.FR_FR_STANDARD_D,
    displayName: "Standard D",
    languageCode: VoiceLanguage.FR_FR,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.FR_FR_STANDARD_E,
    displayName: "Standard E",
    languageCode: VoiceLanguage.FR_FR,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.FR_FR_STUDIO_A,
    displayName: "Studio A",
    languageCode: VoiceLanguage.FR_FR,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.FR_FR_STUDIO_D,
    displayName: "Studio D",
    languageCode: VoiceLanguage.FR_FR,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.FR_FR_WAVENET_A,
    displayName: "Wavenet A",
    languageCode: VoiceLanguage.FR_FR,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.FR_FR_WAVENET_B,
    displayName: "Wavenet B",
    languageCode: VoiceLanguage.FR_FR,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.FR_FR_WAVENET_C,
    displayName: "Wavenet C",
    languageCode: VoiceLanguage.FR_FR,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.FR_FR_WAVENET_D,
    displayName: "Wavenet D",
    languageCode: VoiceLanguage.FR_FR,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.FR_FR_WAVENET_E,
    displayName: "Wavenet E",
    languageCode: VoiceLanguage.FR_FR,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.GL_ES_STANDARD_A,
    displayName: "Standard A",
    languageCode: VoiceLanguage.GL_ES,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.GU_IN_STANDARD_A,
    displayName: "Standard A",
    languageCode: VoiceLanguage.GU_IN,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.GU_IN_STANDARD_B,
    displayName: "Standard B",
    languageCode: VoiceLanguage.GU_IN,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.GU_IN_STANDARD_C,
    displayName: "Standard C",
    languageCode: VoiceLanguage.GU_IN,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.GU_IN_STANDARD_D,
    displayName: "Standard D",
    languageCode: VoiceLanguage.GU_IN,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.GU_IN_WAVENET_A,
    displayName: "Wavenet A",
    languageCode: VoiceLanguage.GU_IN,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.GU_IN_WAVENET_B,
    displayName: "Wavenet B",
    languageCode: VoiceLanguage.GU_IN,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.GU_IN_WAVENET_C,
    displayName: "Wavenet C",
    languageCode: VoiceLanguage.GU_IN,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.GU_IN_WAVENET_D,
    displayName: "Wavenet D",
    languageCode: VoiceLanguage.GU_IN,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.HE_IL_STANDARD_A,
    displayName: "Standard A",
    languageCode: VoiceLanguage.HE_IL,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.HE_IL_STANDARD_B,
    displayName: "Standard B",
    languageCode: VoiceLanguage.HE_IL,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.HE_IL_STANDARD_C,
    displayName: "Standard C",
    languageCode: VoiceLanguage.HE_IL,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.HE_IL_STANDARD_D,
    displayName: "Standard D",
    languageCode: VoiceLanguage.HE_IL,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.HE_IL_WAVENET_A,
    displayName: "Wavenet A",
    languageCode: VoiceLanguage.HE_IL,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.HE_IL_WAVENET_B,
    displayName: "Wavenet B",
    languageCode: VoiceLanguage.HE_IL,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.HE_IL_WAVENET_C,
    displayName: "Wavenet C",
    languageCode: VoiceLanguage.HE_IL,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.HE_IL_WAVENET_D,
    displayName: "Wavenet D",
    languageCode: VoiceLanguage.HE_IL,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.HI_IN_NEURAL2_A,
    displayName: "Neural2 A",
    languageCode: VoiceLanguage.HI_IN,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.HI_IN_NEURAL2_B,
    displayName: "Neural2 B",
    languageCode: VoiceLanguage.HI_IN,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.HI_IN_NEURAL2_C,
    displayName: "Neural2 C",
    languageCode: VoiceLanguage.HI_IN,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.HI_IN_NEURAL2_D,
    displayName: "Neural2 D",
    languageCode: VoiceLanguage.HI_IN,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.HI_IN_STANDARD_A,
    displayName: "Standard A",
    languageCode: VoiceLanguage.HI_IN,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.HI_IN_STANDARD_B,
    displayName: "Standard B",
    languageCode: VoiceLanguage.HI_IN,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.HI_IN_STANDARD_C,
    displayName: "Standard C",
    languageCode: VoiceLanguage.HI_IN,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.HI_IN_STANDARD_D,
    displayName: "Standard D",
    languageCode: VoiceLanguage.HI_IN,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.HI_IN_WAVENET_A,
    displayName: "Wavenet A",
    languageCode: VoiceLanguage.HI_IN,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.HI_IN_WAVENET_B,
    displayName: "Wavenet B",
    languageCode: VoiceLanguage.HI_IN,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.HI_IN_WAVENET_C,
    displayName: "Wavenet C",
    languageCode: VoiceLanguage.HI_IN,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.HI_IN_WAVENET_D,
    displayName: "Wavenet D",
    languageCode: VoiceLanguage.HI_IN,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.HU_HU_STANDARD_A,
    displayName: "Standard A",
    languageCode: VoiceLanguage.HU_HU,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.HU_HU_WAVENET_A,
    displayName: "Wavenet A",
    languageCode: VoiceLanguage.HU_HU,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.ID_ID_STANDARD_A,
    displayName: "Standard A",
    languageCode: VoiceLanguage.ID_ID,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.ID_ID_STANDARD_B,
    displayName: "Standard B",
    languageCode: VoiceLanguage.ID_ID,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.ID_ID_STANDARD_C,
    displayName: "Standard C",
    languageCode: VoiceLanguage.ID_ID,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.ID_ID_STANDARD_D,
    displayName: "Standard D",
    languageCode: VoiceLanguage.ID_ID,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.ID_ID_WAVENET_A,
    displayName: "Wavenet A",
    languageCode: VoiceLanguage.ID_ID,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.ID_ID_WAVENET_B,
    displayName: "Wavenet B",
    languageCode: VoiceLanguage.ID_ID,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.ID_ID_WAVENET_C,
    displayName: "Wavenet C",
    languageCode: VoiceLanguage.ID_ID,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.ID_ID_WAVENET_D,
    displayName: "Wavenet D",
    languageCode: VoiceLanguage.ID_ID,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.IS_IS_STANDARD_A,
    displayName: "Standard A",
    languageCode: VoiceLanguage.IS_IS,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.IT_IT_NEURAL2_A,
    displayName: "Neural2 A",
    languageCode: VoiceLanguage.IT_IT,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.IT_IT_NEURAL2_C,
    displayName: "Neural2 C",
    languageCode: VoiceLanguage.IT_IT,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.IT_IT_STANDARD_A,
    displayName: "Standard A",
    languageCode: VoiceLanguage.IT_IT,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.IT_IT_STANDARD_B,
    displayName: "Standard B",
    languageCode: VoiceLanguage.IT_IT,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.IT_IT_STANDARD_C,
    displayName: "Standard C",
    languageCode: VoiceLanguage.IT_IT,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.IT_IT_STANDARD_D,
    displayName: "Standard D",
    languageCode: VoiceLanguage.IT_IT,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.IT_IT_WAVENET_A,
    displayName: "Wavenet A",
    languageCode: VoiceLanguage.IT_IT,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.IT_IT_WAVENET_B,
    displayName: "Wavenet B",
    languageCode: VoiceLanguage.IT_IT,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.IT_IT_WAVENET_C,
    displayName: "Wavenet C",
    languageCode: VoiceLanguage.IT_IT,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.IT_IT_WAVENET_D,
    displayName: "Wavenet D",
    languageCode: VoiceLanguage.IT_IT,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.JA_JP_NEURAL2_B,
    displayName: "Neural2 B",
    languageCode: VoiceLanguage.JA_JP,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.JA_JP_NEURAL2_C,
    displayName: "Neural2 C",
    languageCode: VoiceLanguage.JA_JP,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.JA_JP_NEURAL2_D,
    displayName: "Neural2 D",
    languageCode: VoiceLanguage.JA_JP,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.JA_JP_STANDARD_A,
    displayName: "Standard A",
    languageCode: VoiceLanguage.JA_JP,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.JA_JP_STANDARD_B,
    displayName: "Standard B",
    languageCode: VoiceLanguage.JA_JP,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.JA_JP_STANDARD_C,
    displayName: "Standard C",
    languageCode: VoiceLanguage.JA_JP,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.JA_JP_STANDARD_D,
    displayName: "Standard D",
    languageCode: VoiceLanguage.JA_JP,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.JA_JP_WAVENET_A,
    displayName: "Wavenet A",
    languageCode: VoiceLanguage.JA_JP,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.JA_JP_WAVENET_B,
    displayName: "Wavenet B",
    languageCode: VoiceLanguage.JA_JP,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.JA_JP_WAVENET_C,
    displayName: "Wavenet C",
    languageCode: VoiceLanguage.JA_JP,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.JA_JP_WAVENET_D,
    displayName: "Wavenet D",
    languageCode: VoiceLanguage.JA_JP,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.KN_IN_STANDARD_A,
    displayName: "Standard A",
    languageCode: VoiceLanguage.KN_IN,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.KN_IN_STANDARD_B,
    displayName: "Standard B",
    languageCode: VoiceLanguage.KN_IN,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.KN_IN_STANDARD_C,
    displayName: "Standard C",
    languageCode: VoiceLanguage.KN_IN,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.KN_IN_STANDARD_D,
    displayName: "Standard D",
    languageCode: VoiceLanguage.KN_IN,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.KN_IN_WAVENET_A,
    displayName: "Wavenet A",
    languageCode: VoiceLanguage.KN_IN,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.KN_IN_WAVENET_B,
    displayName: "Wavenet B",
    languageCode: VoiceLanguage.KN_IN,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.KN_IN_WAVENET_C,
    displayName: "Wavenet C",
    languageCode: VoiceLanguage.KN_IN,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.KN_IN_WAVENET_D,
    displayName: "Wavenet D",
    languageCode: VoiceLanguage.KN_IN,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.KO_KR_NEURAL2_A,
    displayName: "Neural2 A",
    languageCode: VoiceLanguage.KO_KR,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.KO_KR_NEURAL2_B,
    displayName: "Neural2 B",
    languageCode: VoiceLanguage.KO_KR,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.KO_KR_NEURAL2_C,
    displayName: "Neural2 C",
    languageCode: VoiceLanguage.KO_KR,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.KO_KR_STANDARD_A,
    displayName: "Standard A",
    languageCode: VoiceLanguage.KO_KR,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.KO_KR_STANDARD_B,
    displayName: "Standard B",
    languageCode: VoiceLanguage.KO_KR,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.KO_KR_STANDARD_C,
    displayName: "Standard C",
    languageCode: VoiceLanguage.KO_KR,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.KO_KR_STANDARD_D,
    displayName: "Standard D",
    languageCode: VoiceLanguage.KO_KR,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.KO_KR_WAVENET_A,
    displayName: "Wavenet A",
    languageCode: VoiceLanguage.KO_KR,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.KO_KR_WAVENET_B,
    displayName: "Wavenet B",
    languageCode: VoiceLanguage.KO_KR,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.KO_KR_WAVENET_C,
    displayName: "Wavenet C",
    languageCode: VoiceLanguage.KO_KR,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.KO_KR_WAVENET_D,
    displayName: "Wavenet D",
    languageCode: VoiceLanguage.KO_KR,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.LT_LT_STANDARD_A,
    displayName: "Standard A",
    languageCode: VoiceLanguage.LT_LT,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.LV_LV_STANDARD_A,
    displayName: "Standard A",
    languageCode: VoiceLanguage.LV_LV,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.ML_IN_STANDARD_A,
    displayName: "Standard A",
    languageCode: VoiceLanguage.ML_IN,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.ML_IN_STANDARD_B,
    displayName: "Standard B",
    languageCode: VoiceLanguage.ML_IN,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.ML_IN_STANDARD_C,
    displayName: "Standard C",
    languageCode: VoiceLanguage.ML_IN,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.ML_IN_STANDARD_D,
    displayName: "Standard D",
    languageCode: VoiceLanguage.ML_IN,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.ML_IN_WAVENET_A,
    displayName: "Wavenet A",
    languageCode: VoiceLanguage.ML_IN,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.ML_IN_WAVENET_B,
    displayName: "Wavenet B",
    languageCode: VoiceLanguage.ML_IN,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.ML_IN_WAVENET_C,
    displayName: "Wavenet C",
    languageCode: VoiceLanguage.ML_IN,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.ML_IN_WAVENET_D,
    displayName: "Wavenet D",
    languageCode: VoiceLanguage.ML_IN,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.MR_IN_STANDARD_A,
    displayName: "Standard A",
    languageCode: VoiceLanguage.MR_IN,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.MR_IN_STANDARD_B,
    displayName: "Standard B",
    languageCode: VoiceLanguage.MR_IN,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.MR_IN_STANDARD_C,
    displayName: "Standard C",
    languageCode: VoiceLanguage.MR_IN,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.MR_IN_WAVENET_A,
    displayName: "Wavenet A",
    languageCode: VoiceLanguage.MR_IN,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.MR_IN_WAVENET_B,
    displayName: "Wavenet B",
    languageCode: VoiceLanguage.MR_IN,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.MR_IN_WAVENET_C,
    displayName: "Wavenet C",
    languageCode: VoiceLanguage.MR_IN,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.MS_MY_STANDARD_A,
    displayName: "Standard A",
    languageCode: VoiceLanguage.MS_MY,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.MS_MY_STANDARD_B,
    displayName: "Standard B",
    languageCode: VoiceLanguage.MS_MY,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.MS_MY_STANDARD_C,
    displayName: "Standard C",
    languageCode: VoiceLanguage.MS_MY,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.MS_MY_STANDARD_D,
    displayName: "Standard D",
    languageCode: VoiceLanguage.MS_MY,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.MS_MY_WAVENET_A,
    displayName: "Wavenet A",
    languageCode: VoiceLanguage.MS_MY,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.MS_MY_WAVENET_B,
    displayName: "Wavenet B",
    languageCode: VoiceLanguage.MS_MY,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.MS_MY_WAVENET_C,
    displayName: "Wavenet C",
    languageCode: VoiceLanguage.MS_MY,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.MS_MY_WAVENET_D,
    displayName: "Wavenet D",
    languageCode: VoiceLanguage.MS_MY,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.NB_NO_STANDARD_A,
    displayName: "Standard A",
    languageCode: VoiceLanguage.NB_NO,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.NB_NO_STANDARD_B,
    displayName: "Standard B",
    languageCode: VoiceLanguage.NB_NO,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.NB_NO_STANDARD_C,
    displayName: "Standard C",
    languageCode: VoiceLanguage.NB_NO,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.NB_NO_STANDARD_D,
    displayName: "Standard D",
    languageCode: VoiceLanguage.NB_NO,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.NB_NO_STANDARD_E,
    displayName: "Standard E",
    languageCode: VoiceLanguage.NB_NO,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.NB_NO_WAVENET_A,
    displayName: "Wavenet A",
    languageCode: VoiceLanguage.NB_NO,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.NB_NO_WAVENET_B,
    displayName: "Wavenet B",
    languageCode: VoiceLanguage.NB_NO,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.NB_NO_WAVENET_C,
    displayName: "Wavenet C",
    languageCode: VoiceLanguage.NB_NO,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.NB_NO_WAVENET_D,
    displayName: "Wavenet D",
    languageCode: VoiceLanguage.NB_NO,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.NB_NO_WAVENET_E,
    displayName: "Wavenet E",
    languageCode: VoiceLanguage.NB_NO,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.NL_BE_STANDARD_A,
    displayName: "Standard A",
    languageCode: VoiceLanguage.NL_BE,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.NL_BE_STANDARD_B,
    displayName: "Standard B",
    languageCode: VoiceLanguage.NL_BE,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.NL_BE_WAVENET_A,
    displayName: "Wavenet A",
    languageCode: VoiceLanguage.NL_BE,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.NL_BE_WAVENET_B,
    displayName: "Wavenet B",
    languageCode: VoiceLanguage.NL_BE,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.NL_NL_STANDARD_A,
    displayName: "Standard A",
    languageCode: VoiceLanguage.NL_NL,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.NL_NL_STANDARD_B,
    displayName: "Standard B",
    languageCode: VoiceLanguage.NL_NL,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.NL_NL_STANDARD_C,
    displayName: "Standard C",
    languageCode: VoiceLanguage.NL_NL,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.NL_NL_STANDARD_D,
    displayName: "Standard D",
    languageCode: VoiceLanguage.NL_NL,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.NL_NL_STANDARD_E,
    displayName: "Standard E",
    languageCode: VoiceLanguage.NL_NL,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.NL_NL_WAVENET_A,
    displayName: "Wavenet A",
    languageCode: VoiceLanguage.NL_NL,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.NL_NL_WAVENET_B,
    displayName: "Wavenet B",
    languageCode: VoiceLanguage.NL_NL,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.NL_NL_WAVENET_C,
    displayName: "Wavenet C",
    languageCode: VoiceLanguage.NL_NL,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.NL_NL_WAVENET_D,
    displayName: "Wavenet D",
    languageCode: VoiceLanguage.NL_NL,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.NL_NL_WAVENET_E,
    displayName: "Wavenet E",
    languageCode: VoiceLanguage.NL_NL,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.PA_IN_STANDARD_A,
    displayName: "Standard A",
    languageCode: VoiceLanguage.PA_IN,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.PA_IN_STANDARD_B,
    displayName: "Standard B",
    languageCode: VoiceLanguage.PA_IN,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.PA_IN_STANDARD_C,
    displayName: "Standard C",
    languageCode: VoiceLanguage.PA_IN,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.PA_IN_STANDARD_D,
    displayName: "Standard D",
    languageCode: VoiceLanguage.PA_IN,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.PA_IN_WAVENET_A,
    displayName: "Wavenet A",
    languageCode: VoiceLanguage.PA_IN,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.PA_IN_WAVENET_B,
    displayName: "Wavenet B",
    languageCode: VoiceLanguage.PA_IN,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.PA_IN_WAVENET_C,
    displayName: "Wavenet C",
    languageCode: VoiceLanguage.PA_IN,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.PA_IN_WAVENET_D,
    displayName: "Wavenet D",
    languageCode: VoiceLanguage.PA_IN,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.PL_PL_STANDARD_A,
    displayName: "Standard A",
    languageCode: VoiceLanguage.PL_PL,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.PL_PL_STANDARD_B,
    displayName: "Standard B",
    languageCode: VoiceLanguage.PL_PL,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.PL_PL_STANDARD_C,
    displayName: "Standard C",
    languageCode: VoiceLanguage.PL_PL,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.PL_PL_STANDARD_D,
    displayName: "Standard D",
    languageCode: VoiceLanguage.PL_PL,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.PL_PL_STANDARD_E,
    displayName: "Standard E",
    languageCode: VoiceLanguage.PL_PL,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.PL_PL_WAVENET_A,
    displayName: "Wavenet A",
    languageCode: VoiceLanguage.PL_PL,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.PL_PL_WAVENET_B,
    displayName: "Wavenet B",
    languageCode: VoiceLanguage.PL_PL,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.PL_PL_WAVENET_C,
    displayName: "Wavenet C",
    languageCode: VoiceLanguage.PL_PL,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.PL_PL_WAVENET_D,
    displayName: "Wavenet D",
    languageCode: VoiceLanguage.PL_PL,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.PL_PL_WAVENET_E,
    displayName: "Wavenet E",
    languageCode: VoiceLanguage.PL_PL,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.PT_BR_NEURAL2_A,
    displayName: "Neural2 A",
    languageCode: VoiceLanguage.PT_BR,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.PT_BR_NEURAL2_B,
    displayName: "Neural2 B",
    languageCode: VoiceLanguage.PT_BR,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.PT_BR_NEURAL2_C,
    displayName: "Neural2 C",
    languageCode: VoiceLanguage.PT_BR,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.PT_BR_STANDARD_A,
    displayName: "Standard A",
    languageCode: VoiceLanguage.PT_BR,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.PT_BR_STANDARD_B,
    displayName: "Standard B",
    languageCode: VoiceLanguage.PT_BR,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.PT_BR_STANDARD_C,
    displayName: "Standard C",
    languageCode: VoiceLanguage.PT_BR,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.PT_BR_WAVENET_A,
    displayName: "Wavenet A",
    languageCode: VoiceLanguage.PT_BR,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.PT_BR_WAVENET_B,
    displayName: "Wavenet B",
    languageCode: VoiceLanguage.PT_BR,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.PT_BR_WAVENET_C,
    displayName: "Wavenet C",
    languageCode: VoiceLanguage.PT_BR,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.PT_PT_STANDARD_A,
    displayName: "Standard A",
    languageCode: VoiceLanguage.PT_PT,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.PT_PT_STANDARD_B,
    displayName: "Standard B",
    languageCode: VoiceLanguage.PT_PT,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.PT_PT_STANDARD_C,
    displayName: "Standard C",
    languageCode: VoiceLanguage.PT_PT,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.PT_PT_STANDARD_D,
    displayName: "Standard D",
    languageCode: VoiceLanguage.PT_PT,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.PT_PT_WAVENET_A,
    displayName: "Wavenet A",
    languageCode: VoiceLanguage.PT_PT,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.PT_PT_WAVENET_B,
    displayName: "Wavenet B",
    languageCode: VoiceLanguage.PT_PT,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.PT_PT_WAVENET_C,
    displayName: "Wavenet C",
    languageCode: VoiceLanguage.PT_PT,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.PT_PT_WAVENET_D,
    displayName: "Wavenet D",
    languageCode: VoiceLanguage.PT_PT,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.RO_RO_STANDARD_A,
    displayName: "Standard A",
    languageCode: VoiceLanguage.RO_RO,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.RO_RO_WAVENET_A,
    displayName: "Wavenet A",
    languageCode: VoiceLanguage.RO_RO,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.RU_RU_STANDARD_A,
    displayName: "Standard A",
    languageCode: VoiceLanguage.RU_RU,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.RU_RU_STANDARD_B,
    displayName: "Standard B",
    languageCode: VoiceLanguage.RU_RU,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.RU_RU_STANDARD_C,
    displayName: "Standard C",
    languageCode: VoiceLanguage.RU_RU,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.RU_RU_STANDARD_D,
    displayName: "Standard D",
    languageCode: VoiceLanguage.RU_RU,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.RU_RU_STANDARD_E,
    displayName: "Standard E",
    languageCode: VoiceLanguage.RU_RU,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.RU_RU_WAVENET_A,
    displayName: "Wavenet A",
    languageCode: VoiceLanguage.RU_RU,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.RU_RU_WAVENET_B,
    displayName: "Wavenet B",
    languageCode: VoiceLanguage.RU_RU,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.RU_RU_WAVENET_C,
    displayName: "Wavenet C",
    languageCode: VoiceLanguage.RU_RU,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.RU_RU_WAVENET_D,
    displayName: "Wavenet D",
    languageCode: VoiceLanguage.RU_RU,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.RU_RU_WAVENET_E,
    displayName: "Wavenet E",
    languageCode: VoiceLanguage.RU_RU,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.SK_SK_STANDARD_A,
    displayName: "Standard A",
    languageCode: VoiceLanguage.SK_SK,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.SK_SK_WAVENET_A,
    displayName: "Wavenet A",
    languageCode: VoiceLanguage.SK_SK,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.SR_RS_STANDARD_A,
    displayName: "Standard A",
    languageCode: VoiceLanguage.SR_RS,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.SV_SE_STANDARD_A,
    displayName: "Standard A",
    languageCode: VoiceLanguage.SV_SE,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.SV_SE_STANDARD_B,
    displayName: "Standard B",
    languageCode: VoiceLanguage.SV_SE,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.SV_SE_STANDARD_C,
    displayName: "Standard C",
    languageCode: VoiceLanguage.SV_SE,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.SV_SE_STANDARD_D,
    displayName: "Standard D",
    languageCode: VoiceLanguage.SV_SE,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.SV_SE_STANDARD_E,
    displayName: "Standard E",
    languageCode: VoiceLanguage.SV_SE,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.SV_SE_WAVENET_A,
    displayName: "Wavenet A",
    languageCode: VoiceLanguage.SV_SE,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.SV_SE_WAVENET_B,
    displayName: "Wavenet B",
    languageCode: VoiceLanguage.SV_SE,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.SV_SE_WAVENET_C,
    displayName: "Wavenet C",
    languageCode: VoiceLanguage.SV_SE,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.SV_SE_WAVENET_D,
    displayName: "Wavenet D",
    languageCode: VoiceLanguage.SV_SE,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.SV_SE_WAVENET_E,
    displayName: "Wavenet E",
    languageCode: VoiceLanguage.SV_SE,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.TA_IN_STANDARD_A,
    displayName: "Standard A",
    languageCode: VoiceLanguage.TA_IN,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.TA_IN_STANDARD_B,
    displayName: "Standard B",
    languageCode: VoiceLanguage.TA_IN,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.TA_IN_STANDARD_C,
    displayName: "Standard C",
    languageCode: VoiceLanguage.TA_IN,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.TA_IN_STANDARD_D,
    displayName: "Standard D",
    languageCode: VoiceLanguage.TA_IN,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.TA_IN_WAVENET_A,
    displayName: "Wavenet A",
    languageCode: VoiceLanguage.TA_IN,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.TA_IN_WAVENET_B,
    displayName: "Wavenet B",
    languageCode: VoiceLanguage.TA_IN,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.TA_IN_WAVENET_C,
    displayName: "Wavenet C",
    languageCode: VoiceLanguage.TA_IN,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.TA_IN_WAVENET_D,
    displayName: "Wavenet D",
    languageCode: VoiceLanguage.TA_IN,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.TE_IN_STANDARD_A,
    displayName: "Standard A",
    languageCode: VoiceLanguage.TE_IN,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.TE_IN_STANDARD_B,
    displayName: "Standard B",
    languageCode: VoiceLanguage.TE_IN,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.TH_TH_NEURAL2_C,
    displayName: "Neural2 C",
    languageCode: VoiceLanguage.TH_TH,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.TH_TH_STANDARD_A,
    displayName: "Standard A",
    languageCode: VoiceLanguage.TH_TH,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.TR_TR_STANDARD_A,
    displayName: "Standard A",
    languageCode: VoiceLanguage.TR_TR,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.TR_TR_STANDARD_B,
    displayName: "Standard B",
    languageCode: VoiceLanguage.TR_TR,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.TR_TR_STANDARD_C,
    displayName: "Standard C",
    languageCode: VoiceLanguage.TR_TR,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.TR_TR_STANDARD_D,
    displayName: "Standard D",
    languageCode: VoiceLanguage.TR_TR,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.TR_TR_STANDARD_E,
    displayName: "Standard E",
    languageCode: VoiceLanguage.TR_TR,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.TR_TR_WAVENET_A,
    displayName: "Wavenet A",
    languageCode: VoiceLanguage.TR_TR,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.TR_TR_WAVENET_B,
    displayName: "Wavenet B",
    languageCode: VoiceLanguage.TR_TR,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.TR_TR_WAVENET_C,
    displayName: "Wavenet C",
    languageCode: VoiceLanguage.TR_TR,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.TR_TR_WAVENET_D,
    displayName: "Wavenet D",
    languageCode: VoiceLanguage.TR_TR,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.TR_TR_WAVENET_E,
    displayName: "Wavenet E",
    languageCode: VoiceLanguage.TR_TR,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.UK_UA_STANDARD_A,
    displayName: "Standard A",
    languageCode: VoiceLanguage.UK_UA,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.UK_UA_WAVENET_A,
    displayName: "Wavenet A",
    languageCode: VoiceLanguage.UK_UA,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.UR_IN_STANDARD_A,
    displayName: "Standard A",
    languageCode: VoiceLanguage.UR_IN,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.UR_IN_STANDARD_B,
    displayName: "Standard B",
    languageCode: VoiceLanguage.UR_IN,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.UR_IN_WAVENET_A,
    displayName: "Wavenet A",
    languageCode: VoiceLanguage.UR_IN,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.UR_IN_WAVENET_B,
    displayName: "Wavenet B",
    languageCode: VoiceLanguage.UR_IN,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.VI_VN_NEURAL2_A,
    displayName: "Neural2 A",
    languageCode: VoiceLanguage.VI_VN,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.VI_VN_NEURAL2_D,
    displayName: "Neural2 D",
    languageCode: VoiceLanguage.VI_VN,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.VI_VN_STANDARD_A,
    displayName: "Standard A",
    languageCode: VoiceLanguage.VI_VN,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.VI_VN_STANDARD_B,
    displayName: "Standard B",
    languageCode: VoiceLanguage.VI_VN,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.VI_VN_STANDARD_C,
    displayName: "Standard C",
    languageCode: VoiceLanguage.VI_VN,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.VI_VN_STANDARD_D,
    displayName: "Standard D",
    languageCode: VoiceLanguage.VI_VN,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.VI_VN_WAVENET_A,
    displayName: "Wavenet A",
    languageCode: VoiceLanguage.VI_VN,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.VI_VN_WAVENET_B,
    displayName: "Wavenet B",
    languageCode: VoiceLanguage.VI_VN,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.VI_VN_WAVENET_C,
    displayName: "Wavenet C",
    languageCode: VoiceLanguage.VI_VN,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.VI_VN_WAVENET_D,
    displayName: "Wavenet D",
    languageCode: VoiceLanguage.VI_VN,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.YUE_HK_STANDARD_A,
    displayName: "Standard A",
    languageCode: VoiceLanguage.YUE_HK,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.YUE_HK_STANDARD_B,
    displayName: "Standard B",
    languageCode: VoiceLanguage.YUE_HK,
    gender: VoiceGender.MALE
  },
  {
    name: GoogleVoice.YUE_HK_STANDARD_C,
    displayName: "Standard C",
    languageCode: VoiceLanguage.YUE_HK,
    gender: VoiceGender.FEMALE
  },
  {
    name: GoogleVoice.YUE_HK_STANDARD_D,
    displayName: "Standard D",
    languageCode: VoiceLanguage.YUE_HK,
    gender: VoiceGender.MALE
  }
];

export { GoogleVoice, GoogleVoiceDetails };
