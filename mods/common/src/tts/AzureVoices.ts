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

enum AzureVoice {
  AF_ZA_ADRI_NEURAL = "af-ZA-AdriNeural",
  AF_ZA_WILLEM_NEURAL = "af-ZA-WillemNeural",
  AM_ET_MEKDES_NEURAL = "am-ET-MekdesNeural",
  AM_ET_AMEHA_NEURAL = "am-ET-AmehaNeural",
  AR_AE_FATIMA_NEURAL = "ar-AE-FatimaNeural",
  AR_AE_HAMDAN_NEURAL = "ar-AE-HamdanNeural",
  AR_BH_LAILA_NEURAL = "ar-BH-LailaNeural",
  AR_BH_ALI_NEURAL = "ar-BH-AliNeural",
  AR_DZ_AMINA_NEURAL = "ar-DZ-AminaNeural",
  AR_DZ_ISMAEL_NEURAL = "ar-DZ-IsmaelNeural",
  AR_EG_SALMA_NEURAL = "ar-EG-SalmaNeural",
  AR_EG_SHAKIR_NEURAL = "ar-EG-ShakirNeural",
  AR_IQ_RANA_NEURAL = "ar-IQ-RanaNeural",
  AR_IQ_BASSEL_NEURAL = "ar-IQ-BasselNeural",
  AR_JO_SANA_NEURAL = "ar-JO-SanaNeural",
  AR_JO_TAIM_NEURAL = "ar-JO-TaimNeural",
  AR_KW_NOURA_NEURAL = "ar-KW-NouraNeural",
  AR_KW_FAHED_NEURAL = "ar-KW-FahedNeural",
  AR_LB_LAYLA_NEURAL = "ar-LB-LaylaNeural",
  AR_LB_RAMI_NEURAL = "ar-LB-RamiNeural",
  AR_LY_IMAN_NEURAL = "ar-LY-ImanNeural",
  AR_LY_OMAR_NEURAL = "ar-LY-OmarNeural",
  AR_MA_MOUNA_NEURAL = "ar-MA-MounaNeural",
  AR_MA_JAMAL_NEURAL = "ar-MA-JamalNeural",
  AR_OM_AYSHA_NEURAL = "ar-OM-AyshaNeural",
  AR_OM_ABDULLAH_NEURAL = "ar-OM-AbdullahNeural",
  AR_QA_AMAL_NEURAL = "ar-QA-AmalNeural",
  AR_QA_MOAZ_NEURAL = "ar-QA-MoazNeural",
  AR_SA_ZARIYAH_NEURAL = "ar-SA-ZariyahNeural",
  AR_SA_HAMED_NEURAL = "ar-SA-HamedNeural",
  AR_SY_AMANY_NEURAL = "ar-SY-AmanyNeural",
  AR_SY_LAITH_NEURAL = "ar-SY-LaithNeural",
  AR_TN_REEM_NEURAL = "ar-TN-ReemNeural",
  AR_TN_HEDI_NEURAL = "ar-TN-HediNeural",
  AR_YE_MARYAM_NEURAL = "ar-YE-MaryamNeural",
  AR_YE_SALEH_NEURAL = "ar-YE-SalehNeural",
  AS_IN_PRIYOM_NEURAL = "as-IN-PriyomNeural",
  AS_IN_YASHICA_NEURAL = "as-IN-YashicaNeural",
  AZ_AZ_BANU_NEURAL = "az-AZ-BanuNeural",
  AZ_AZ_BABEK_NEURAL = "az-AZ-BabekNeural",
  BG_BG_KALINA_NEURAL = "bg-BG-KalinaNeural",
  BG_BG_BORISLAV_NEURAL = "bg-BG-BorislavNeural",
  BN_BD_NABANITA_NEURAL = "bn-BD-NabanitaNeural",
  BN_BD_PRADEEP_NEURAL = "bn-BD-PradeepNeural",
  BN_IN_TANISHAA_NEURAL = "bn-IN-TanishaaNeural",
  BN_IN_BASHKAR_NEURAL = "bn-IN-BashkarNeural",
  BS_BA_VESNA_NEURAL = "bs-BA-VesnaNeural",
  BS_BA_GORAN_NEURAL = "bs-BA-GoranNeural",
  CA_ES_JOANA_NEURAL = "ca-ES-JoanaNeural",
  CA_ES_ENRIC_NEURAL = "ca-ES-EnricNeural",
  CA_ES_ALBA_NEURAL = "ca-ES-AlbaNeural",
  CS_CZ_VLASTA_NEURAL = "cs-CZ-VlastaNeural",
  CS_CZ_ANTONIN_NEURAL = "cs-CZ-AntoninNeural",
  CY_GB_NIA_NEURAL = "cy-GB-NiaNeural",
  CY_GB_ALED_NEURAL = "cy-GB-AledNeural",
  DA_DK_CHRISTEL_NEURAL = "da-DK-ChristelNeural",
  DA_DK_JEPPE_NEURAL = "da-DK-JeppeNeural",
  DE_AT_INGRID_NEURAL = "de-AT-IngridNeural",
  DE_AT_JONAS_NEURAL = "de-AT-JonasNeural",
  DE_CH_LENI_NEURAL = "de-CH-LeniNeural",
  DE_CH_JAN_NEURAL = "de-CH-JanNeural",
  DE_DE_KATJA_NEURAL = "de-DE-KatjaNeural",
  DE_DE_CONRAD_NEURAL = "de-DE-ConradNeural",
  DE_DE_AMALA_NEURAL = "de-DE-AmalaNeural",
  DE_DE_BERND_NEURAL = "de-DE-BerndNeural",
  DE_DE_CHRISTOPH_NEURAL = "de-DE-ChristophNeural",
  DE_DE_ELKE_NEURAL = "de-DE-ElkeNeural",
  DE_DE_FLORIANMULTILINGUAL_NEURAL = "de-DE-FlorianMultilingualNeural",
  DE_DE_GISELA_NEURAL = "de-DE-GiselaNeural",
  DE_DE_KASPER_NEURAL = "de-DE-KasperNeural",
  DE_DE_KILLIAN_NEURAL = "de-DE-KillianNeural",
  DE_DE_KLARISSA_NEURAL = "de-DE-KlarissaNeural",
  DE_DE_KLAUS_NEURAL = "de-DE-KlausNeural",
  DE_DE_LOUISA_NEURAL = "de-DE-LouisaNeural",
  DE_DE_MAJA_NEURAL = "de-DE-MajaNeural",
  DE_DE_RALF_NEURAL = "de-DE-RalfNeural",
  DE_DE_SERAPHINAMULTILINGUAL_NEURAL = "de-DE-SeraphinaMultilingualNeural",
  DE_DE_TANJA_NEURAL = "de-DE-TanjaNeural",
  EL_GR_ATHINA_NEURAL = "el-GR-AthinaNeural",
  EL_GR_NESTORAS_NEURAL = "el-GR-NestorasNeural",
  EN_AU_NATASHA_NEURAL = "en-AU-NatashaNeural",
  EN_AU_WILLIAM_NEURAL = "en-AU-WilliamNeural",
  EN_AU_ANNETTE_NEURAL = "en-AU-AnnetteNeural",
  EN_AU_CARLY_NEURAL = "en-AU-CarlyNeural",
  EN_AU_DARREN_NEURAL = "en-AU-DarrenNeural",
  EN_AU_DUNCAN_NEURAL = "en-AU-DuncanNeural",
  EN_AU_ELSIE_NEURAL = "en-AU-ElsieNeural",
  EN_AU_FREYA_NEURAL = "en-AU-FreyaNeural",
  EN_AU_JOANNE_NEURAL = "en-AU-JoanneNeural",
  EN_AU_KEN_NEURAL = "en-AU-KenNeural",
  EN_AU_KIM_NEURAL = "en-AU-KimNeural",
  EN_AU_NEIL_NEURAL = "en-AU-NeilNeural",
  EN_AU_TIM_NEURAL = "en-AU-TimNeural",
  EN_AU_TINA_NEURAL = "en-AU-TinaNeural",
  EN_CA_CLARA_NEURAL = "en-CA-ClaraNeural",
  EN_CA_LIAM_NEURAL = "en-CA-LiamNeural",
  EN_GB_SONIA_NEURAL = "en-GB-SoniaNeural",
  EN_GB_RYAN_NEURAL = "en-GB-RyanNeural",
  EN_GB_LIBBY_NEURAL = "en-GB-LibbyNeural",
  EN_GB_ABBI_NEURAL = "en-GB-AbbiNeural",
  EN_GB_ADAMULTILINGUAL_NEURAL = "en-GB-AdaMultilingualNeural",
  EN_GB_ALFIE_NEURAL = "en-GB-AlfieNeural",
  EN_GB_BELLA_NEURAL = "en-GB-BellaNeural",
  EN_GB_ELLIOT_NEURAL = "en-GB-ElliotNeural",
  EN_GB_ETHAN_NEURAL = "en-GB-EthanNeural",
  EN_GB_HOLLIE_NEURAL = "en-GB-HollieNeural",
  EN_GB_MAISIE_NEURAL = "en-GB-MaisieNeural",
  EN_GB_NOAH_NEURAL = "en-GB-NoahNeural",
  EN_GB_OLIVER_NEURAL = "en-GB-OliverNeural",
  EN_GB_OLIVIA_NEURAL = "en-GB-OliviaNeural",
  EN_GB_THOMAS_NEURAL = "en-GB-ThomasNeural",
  EN_GB_OLLIEMULTILINGUAL_NEURAL = "en-GB-OllieMultilingualNeural",
  EN_GB_MIA_NEURAL = "en-GB-MiaNeural",
  EN_HK_YAN_NEURAL = "en-HK-YanNeural",
  EN_HK_SAM_NEURAL = "en-HK-SamNeural",
  EN_IE_EMILY_NEURAL = "en-IE-EmilyNeural",
  EN_IE_CONNOR_NEURAL = "en-IE-ConnorNeural",
  EN_IN_NEERJA_NEURAL = "en-IN-NeerjaNeural",
  EN_IN_PRABHAT_NEURAL = "en-IN-PrabhatNeural",
  EN_IN_AARAV_NEURAL = "en-IN-AaravNeural",
  EN_IN_AASHI_NEURAL = "en-IN-AashiNeural",
  EN_IN_ANANYA_NEURAL = "en-IN-AnanyaNeural",
  EN_IN_KAVYA_NEURAL = "en-IN-KavyaNeural",
  EN_IN_KUNAL_NEURAL = "en-IN-KunalNeural",
  EN_IN_REHAAN_NEURAL = "en-IN-RehaanNeural",
  EN_KE_ASILIA_NEURAL = "en-KE-AsiliaNeural",
  EN_KE_CHILEMBA_NEURAL = "en-KE-ChilembaNeural",
  EN_NG_EZINNE_NEURAL = "en-NG-EzinneNeural",
  EN_NG_ABEO_NEURAL = "en-NG-AbeoNeural",
  EN_NZ_MOLLY_NEURAL = "en-NZ-MollyNeural",
  EN_NZ_MITCHELL_NEURAL = "en-NZ-MitchellNeural",
  EN_PH_ROSA_NEURAL = "en-PH-RosaNeural",
  EN_PH_JAMES_NEURAL = "en-PH-JamesNeural",
  EN_SG_LUNA_NEURAL = "en-SG-LunaNeural",
  EN_SG_WAYNE_NEURAL = "en-SG-WayneNeural",
  EN_TZ_IMANI_NEURAL = "en-TZ-ImaniNeural",
  EN_TZ_ELIMU_NEURAL = "en-TZ-ElimuNeural",
  EN_US_AVAMULTILINGUAL_NEURAL = "en-US-AvaMultilingualNeural",
  EN_US_ANDREWMULTILINGUAL_NEURAL = "en-US-AndrewMultilingualNeural",
  EN_US_EMMAMULTILINGUAL_NEURAL = "en-US-EmmaMultilingualNeural",
  EN_US_BRIANMULTILINGUAL_NEURAL = "en-US-BrianMultilingualNeural",
  EN_US_AVA_NEURAL = "en-US-AvaNeural",
  EN_US_ANDREW_NEURAL = "en-US-AndrewNeural",
  EN_US_EMMA_NEURAL = "en-US-EmmaNeural",
  EN_US_BRIAN_NEURAL = "en-US-BrianNeural",
  EN_US_JENNY_NEURAL = "en-US-JennyNeural",
  EN_US_GUY_NEURAL = "en-US-GuyNeural",
  EN_US_ARIA_NEURAL = "en-US-AriaNeural",
  EN_US_DAVIS_NEURAL = "en-US-DavisNeural",
  EN_US_JANE_NEURAL = "en-US-JaneNeural",
  EN_US_JASON_NEURAL = "en-US-JasonNeural",
  EN_US_SARA_NEURAL = "en-US-SaraNeural",
  EN_US_TONY_NEURAL = "en-US-TonyNeural",
  EN_US_NANCY_NEURAL = "en-US-NancyNeural",
  EN_US_AMBER_NEURAL = "en-US-AmberNeural",
  EN_US_ANA_NEURAL = "en-US-AnaNeural",
  EN_US_ASHLEY_NEURAL = "en-US-AshleyNeural",
  EN_US_BRANDON_NEURAL = "en-US-BrandonNeural",
  EN_US_CHRISTOPHER_NEURAL = "en-US-ChristopherNeural",
  EN_US_CORA_NEURAL = "en-US-CoraNeural",
  EN_US_ELIZABETH_NEURAL = "en-US-ElizabethNeural",
  EN_US_ERIC_NEURAL = "en-US-EricNeural",
  EN_US_JACOB_NEURAL = "en-US-JacobNeural",
  EN_US_JENNYMULTILINGUAL_NEURAL = "en-US-JennyMultilingualNeural",
  EN_US_MICHELLE_NEURAL = "en-US-MichelleNeural",
  EN_US_MONICA_NEURAL = "en-US-MonicaNeural",
  EN_US_ROGER_NEURAL = "en-US-RogerNeural",
  EN_US_RYANMULTILINGUAL_NEURAL = "en-US-RyanMultilingualNeural",
  EN_US_STEFFAN_NEURAL = "en-US-SteffanNeural",
  EN_US_AIGENERATE1_NEURAL = "en-US-AIGenerate1Neural",
  EN_US_AIGENERATE2_NEURAL = "en-US-AIGenerate2Neural",
  EN_US_BLUE_NEURAL = "en-US-BlueNeural",
  EN_US_KAI_NEURAL = "en-US-KaiNeural",
  EN_US_LUNA_NEURAL = "en-US-LunaNeural",
  EN_ZA_LEAH_NEURAL = "en-ZA-LeahNeural",
  EN_ZA_LUKE_NEURAL = "en-ZA-LukeNeural",
  ES_AR_ELENA_NEURAL = "es-AR-ElenaNeural",
  ES_AR_TOMAS_NEURAL = "es-AR-TomasNeural",
  ES_BO_SOFIA_NEURAL = "es-BO-SofiaNeural",
  ES_BO_MARCELO_NEURAL = "es-BO-MarceloNeural",
  ES_CL_CATALINA_NEURAL = "es-CL-CatalinaNeural",
  ES_CL_LORENZO_NEURAL = "es-CL-LorenzoNeural",
  ES_CO_SALOME_NEURAL = "es-CO-SalomeNeural",
  ES_CO_GONZALO_NEURAL = "es-CO-GonzaloNeural",
  ES_CR_MARIA_NEURAL = "es-CR-MariaNeural",
  ES_CR_JUAN_NEURAL = "es-CR-JuanNeural",
  ES_CU_BELKYS_NEURAL = "es-CU-BelkysNeural",
  ES_CU_MANUEL_NEURAL = "es-CU-ManuelNeural",
  ES_DO_RAMONA_NEURAL = "es-DO-RamonaNeural",
  ES_DO_EMILIO_NEURAL = "es-DO-EmilioNeural",
  ES_EC_ANDREA_NEURAL = "es-EC-AndreaNeural",
  ES_EC_LUIS_NEURAL = "es-EC-LuisNeural",
  ES_ES_ELVIRA_NEURAL = "es-ES-ElviraNeural",
  ES_ES_ALVARO_NEURAL = "es-ES-AlvaroNeural",
  ES_ES_ABRIL_NEURAL = "es-ES-AbrilNeural",
  ES_ES_ARNAU_NEURAL = "es-ES-ArnauNeural",
  ES_ES_DARIO_NEURAL = "es-ES-DarioNeural",
  ES_ES_ELIAS_NEURAL = "es-ES-EliasNeural",
  ES_ES_ESTRELLA_NEURAL = "es-ES-EstrellaNeural",
  ES_ES_IRENE_NEURAL = "es-ES-IreneNeural",
  ES_ES_LAIA_NEURAL = "es-ES-LaiaNeural",
  ES_ES_LIA_NEURAL = "es-ES-LiaNeural",
  ES_ES_NIL_NEURAL = "es-ES-NilNeural",
  ES_ES_SAUL_NEURAL = "es-ES-SaulNeural",
  ES_ES_TEO_NEURAL = "es-ES-TeoNeural",
  ES_ES_TRIANA_NEURAL = "es-ES-TrianaNeural",
  ES_ES_VERA_NEURAL = "es-ES-VeraNeural",
  ES_ES_XIMENA_NEURAL = "es-ES-XimenaNeural",
  ES_ES_ARABELLAMULTILINGUAL_NEURAL = "es-ES-ArabellaMultilingualNeural",
  ES_ES_ISIDORAMULTILINGUAL_NEURAL = "es-ES-IsidoraMultilingualNeural",
  ES_GQ_TERESA_NEURAL = "es-GQ-TeresaNeural",
  ES_GQ_JAVIER_NEURAL = "es-GQ-JavierNeural",
  ES_GT_MARTA_NEURAL = "es-GT-MartaNeural",
  ES_GT_ANDRES_NEURAL = "es-GT-AndresNeural",
  ES_HN_KARLA_NEURAL = "es-HN-KarlaNeural",
  ES_HN_CARLOS_NEURAL = "es-HN-CarlosNeural",
  ES_MX_DALIA_NEURAL = "es-MX-DaliaNeural",
  ES_MX_JORGE_NEURAL = "es-MX-JorgeNeural",
  ES_MX_BEATRIZ_NEURAL = "es-MX-BeatrizNeural",
  ES_MX_CANDELA_NEURAL = "es-MX-CandelaNeural",
  ES_MX_CARLOTA_NEURAL = "es-MX-CarlotaNeural",
  ES_MX_CECILIO_NEURAL = "es-MX-CecilioNeural",
  ES_MX_GERARDO_NEURAL = "es-MX-GerardoNeural",
  ES_MX_LARISSA_NEURAL = "es-MX-LarissaNeural",
  ES_MX_LIBERTO_NEURAL = "es-MX-LibertoNeural",
  ES_MX_LUCIANO_NEURAL = "es-MX-LucianoNeural",
  ES_MX_MARINA_NEURAL = "es-MX-MarinaNeural",
  ES_MX_NURIA_NEURAL = "es-MX-NuriaNeural",
  ES_MX_PELAYO_NEURAL = "es-MX-PelayoNeural",
  ES_MX_RENATA_NEURAL = "es-MX-RenataNeural",
  ES_MX_YAGO_NEURAL = "es-MX-YagoNeural",
  ES_NI_YOLANDA_NEURAL = "es-NI-YolandaNeural",
  ES_NI_FEDERICO_NEURAL = "es-NI-FedericoNeural",
  ES_PA_MARGARITA_NEURAL = "es-PA-MargaritaNeural",
  ES_PA_ROBERTO_NEURAL = "es-PA-RobertoNeural",
  ES_PE_CAMILA_NEURAL = "es-PE-CamilaNeural",
  ES_PE_ALEX_NEURAL = "es-PE-AlexNeural",
  ES_PR_KARINA_NEURAL = "es-PR-KarinaNeural",
  ES_PR_VICTOR_NEURAL = "es-PR-VictorNeural",
  ES_PY_TANIA_NEURAL = "es-PY-TaniaNeural",
  ES_PY_MARIO_NEURAL = "es-PY-MarioNeural",
  ES_SV_LORENA_NEURAL = "es-SV-LorenaNeural",
  ES_SV_RODRIGO_NEURAL = "es-SV-RodrigoNeural",
  ES_US_PALOMA_NEURAL = "es-US-PalomaNeural",
  ES_US_ALONSO_NEURAL = "es-US-AlonsoNeural",
  ES_UY_VALENTINA_NEURAL = "es-UY-ValentinaNeural",
  ES_UY_MATEO_NEURAL = "es-UY-MateoNeural",
  ES_VE_PAOLA_NEURAL = "es-VE-PaolaNeural",
  ES_VE_SEBASTIAN_NEURAL = "es-VE-SebastianNeural",
  ET_EE_ANU_NEURAL = "et-EE-AnuNeural",
  ET_EE_KERT_NEURAL = "et-EE-KertNeural",
  EU_ES_AINHOA_NEURAL = "eu-ES-AinhoaNeural",
  EU_ES_ANDER_NEURAL = "eu-ES-AnderNeural",
  FA_IR_DILARA_NEURAL = "fa-IR-DilaraNeural",
  FA_IR_FARID_NEURAL = "fa-IR-FaridNeural",
  FI_FI_SELMA_NEURAL = "fi-FI-SelmaNeural",
  FI_FI_HARRI_NEURAL = "fi-FI-HarriNeural",
  FI_FI_NOORA_NEURAL = "fi-FI-NooraNeural",
  FIL_PH_BLESSICA_NEURAL = "fil-PH-BlessicaNeural",
  FIL_PH_ANGELO_NEURAL = "fil-PH-AngeloNeural",
  FR_BE_CHARLINE_NEURAL = "fr-BE-CharlineNeural",
  FR_BE_GERARD_NEURAL = "fr-BE-GerardNeural",
  FR_CA_SYLVIE_NEURAL = "fr-CA-SylvieNeural",
  FR_CA_JEAN_NEURAL = "fr-CA-JeanNeural",
  FR_CA_ANTOINE_NEURAL = "fr-CA-AntoineNeural",
  FR_CA_THIERRY_NEURAL = "fr-CA-ThierryNeural",
  FR_CH_ARIANE_NEURAL = "fr-CH-ArianeNeural",
  FR_CH_FABRICE_NEURAL = "fr-CH-FabriceNeural",
  FR_FR_DENISE_NEURAL = "fr-FR-DeniseNeural",
  FR_FR_HENRI_NEURAL = "fr-FR-HenriNeural",
  FR_FR_ALAIN_NEURAL = "fr-FR-AlainNeural",
  FR_FR_BRIGITTE_NEURAL = "fr-FR-BrigitteNeural",
  FR_FR_CELESTE_NEURAL = "fr-FR-CelesteNeural",
  FR_FR_CLAUDE_NEURAL = "fr-FR-ClaudeNeural",
  FR_FR_CORALIE_NEURAL = "fr-FR-CoralieNeural",
  FR_FR_ELOISE_NEURAL = "fr-FR-EloiseNeural",
  FR_FR_JACQUELINE_NEURAL = "fr-FR-JacquelineNeural",
  FR_FR_JEROME_NEURAL = "fr-FR-JeromeNeural",
  FR_FR_JOSEPHINE_NEURAL = "fr-FR-JosephineNeural",
  FR_FR_MAURICE_NEURAL = "fr-FR-MauriceNeural",
  FR_FR_REMYMULTILINGUAL_NEURAL = "fr-FR-RemyMultilingualNeural",
  FR_FR_VIVIENNEMULTILINGUAL_NEURAL = "fr-FR-VivienneMultilingualNeural",
  FR_FR_YVES_NEURAL = "fr-FR-YvesNeural",
  FR_FR_YVETTE_NEURAL = "fr-FR-YvetteNeural",
  GA_IE_ORLA_NEURAL = "ga-IE-OrlaNeural",
  GA_IE_COLM_NEURAL = "ga-IE-ColmNeural",
  GL_ES_SABELA_NEURAL = "gl-ES-SabelaNeural",
  GL_ES_ROI_NEURAL = "gl-ES-RoiNeural",
  GU_IN_DHWANI_NEURAL = "gu-IN-DhwaniNeural",
  GU_IN_NIRANJAN_NEURAL = "gu-IN-NiranjanNeural",
  HE_IL_HILA_NEURAL = "he-IL-HilaNeural",
  HE_IL_AVRI_NEURAL = "he-IL-AvriNeural",
  HI_IN_SWARA_NEURAL = "hi-IN-SwaraNeural",
  HI_IN_MADHUR_NEURAL = "hi-IN-MadhurNeural",
  HI_IN_AARAV_NEURAL = "hi-IN-AaravNeural",
  HI_IN_ANANYA_NEURAL = "hi-IN-AnanyaNeural",
  HI_IN_KAVYA_NEURAL = "hi-IN-KavyaNeural",
  HI_IN_KUNAL_NEURAL = "hi-IN-KunalNeural",
  HI_IN_REHAAN_NEURAL = "hi-IN-RehaanNeural",
  HR_HR_GABRIJELA_NEURAL = "hr-HR-GabrijelaNeural",
  HR_HR_SRECKO_NEURAL = "hr-HR-SreckoNeural",
  HU_HU_NOEMI_NEURAL = "hu-HU-NoemiNeural",
  HU_HU_TAMAS_NEURAL = "hu-HU-TamasNeural",
  HY_AM_ANAHIT_NEURAL = "hy-AM-AnahitNeural",
  HY_AM_HAYK_NEURAL = "hy-AM-HaykNeural",
  ID_ID_GADIS_NEURAL = "id-ID-GadisNeural",
  ID_ID_ARDI_NEURAL = "id-ID-ArdiNeural",
  IS_IS_GUDRUN_NEURAL = "is-IS-GudrunNeural",
  IS_IS_GUNNAR_NEURAL = "is-IS-GunnarNeural",
  IT_IT_ELSA_NEURAL = "it-IT-ElsaNeural",
  IT_IT_ISABELLA_NEURAL = "it-IT-IsabellaNeural",
  IT_IT_DIEGO_NEURAL = "it-IT-DiegoNeural",
  IT_IT_BENIGNO_NEURAL = "it-IT-BenignoNeural",
  IT_IT_CALIMERO_NEURAL = "it-IT-CalimeroNeural",
  IT_IT_CATALDO_NEURAL = "it-IT-CataldoNeural",
  IT_IT_FABIOLA_NEURAL = "it-IT-FabiolaNeural",
  IT_IT_FIAMMA_NEURAL = "it-IT-FiammaNeural",
  IT_IT_GIANNI_NEURAL = "it-IT-GianniNeural",
  IT_IT_GIUSEPPE_NEURAL = "it-IT-GiuseppeNeural",
  IT_IT_IMELDA_NEURAL = "it-IT-ImeldaNeural",
  IT_IT_IRMA_NEURAL = "it-IT-IrmaNeural",
  IT_IT_LISANDRO_NEURAL = "it-IT-LisandroNeural",
  IT_IT_PALMIRA_NEURAL = "it-IT-PalmiraNeural",
  IT_IT_PIERINA_NEURAL = "it-IT-PierinaNeural",
  IT_IT_RINALDO_NEURAL = "it-IT-RinaldoNeural",
  IT_IT_ALESSIOMULTILINGUAL_NEURAL = "it-IT-AlessioMultilingualNeural",
  IT_IT_ISABELLAMULTILINGUAL_NEURAL = "it-IT-IsabellaMultilingualNeural",
  IT_IT_MARCELLOMULTILINGUAL_NEURAL = "it-IT-MarcelloMultilingualNeural",
  JA_JP_NANAMI_NEURAL = "ja-JP-NanamiNeural",
  JA_JP_KEITA_NEURAL = "ja-JP-KeitaNeural",
  JA_JP_AOI_NEURAL = "ja-JP-AoiNeural",
  JA_JP_DAICHI_NEURAL = "ja-JP-DaichiNeural",
  JA_JP_MAYU_NEURAL = "ja-JP-MayuNeural",
  JA_JP_NAOKI_NEURAL = "ja-JP-NaokiNeural",
  JA_JP_SHIORI_NEURAL = "ja-JP-ShioriNeural",
  JA_JP_MASARUMULTILINGUAL_NEURAL = "ja-JP-MasaruMultilingualNeural",
  JV_ID_SITI_NEURAL = "jv-ID-SitiNeural",
  JV_ID_DIMAS_NEURAL = "jv-ID-DimasNeural",
  KA_GE_EKA_NEURAL = "ka-GE-EkaNeural",
  KA_GE_GIORGI_NEURAL = "ka-GE-GiorgiNeural",
  KK_KZ_AIGUL_NEURAL = "kk-KZ-AigulNeural",
  KK_KZ_DAULET_NEURAL = "kk-KZ-DauletNeural",
  KM_KH_SREYMOM_NEURAL = "km-KH-SreymomNeural",
  KM_KH_PISETH_NEURAL = "km-KH-PisethNeural",
  KN_IN_SAPNA_NEURAL = "kn-IN-SapnaNeural",
  KN_IN_GAGAN_NEURAL = "kn-IN-GaganNeural",
  KO_KR_SUNHI_NEURAL = "ko-KR-SunHiNeural",
  KO_KR_INJOON_NEURAL = "ko-KR-InJoonNeural",
  KO_KR_BONGJIN_NEURAL = "ko-KR-BongJinNeural",
  KO_KR_GOOKMIN_NEURAL = "ko-KR-GookMinNeural",
  KO_KR_HYUNSU_NEURAL = "ko-KR-HyunsuNeural",
  KO_KR_JIMIN_NEURAL = "ko-KR-JiMinNeural",
  KO_KR_SEOHYEON_NEURAL = "ko-KR-SeoHyeonNeural",
  KO_KR_SOONBOK_NEURAL = "ko-KR-SoonBokNeural",
  KO_KR_YUJIN_NEURAL = "ko-KR-YuJinNeural",
  LO_LA_KEOMANY_NEURAL = "lo-LA-KeomanyNeural",
  LO_LA_CHANTHAVONG_NEURAL = "lo-LA-ChanthavongNeural",
  LT_LT_ONA_NEURAL = "lt-LT-OnaNeural",
  LT_LT_LEONAS_NEURAL = "lt-LT-LeonasNeural",
  LV_LV_EVERITA_NEURAL = "lv-LV-EveritaNeural",
  LV_LV_NILS_NEURAL = "lv-LV-NilsNeural",
  MK_MK_MARIJA_NEURAL = "mk-MK-MarijaNeural",
  MK_MK_ALEKSANDAR_NEURAL = "mk-MK-AleksandarNeural",
  ML_IN_SOBHANA_NEURAL = "ml-IN-SobhanaNeural",
  ML_IN_MIDHUN_NEURAL = "ml-IN-MidhunNeural",
  MN_MN_YESUI_NEURAL = "mn-MN-YesuiNeural",
  MN_MN_BATAA_NEURAL = "mn-MN-BataaNeural",
  MR_IN_AAROHI_NEURAL = "mr-IN-AarohiNeural",
  MR_IN_MANOHAR_NEURAL = "mr-IN-ManoharNeural",
  MS_MY_YASMIN_NEURAL = "ms-MY-YasminNeural",
  MS_MY_OSMAN_NEURAL = "ms-MY-OsmanNeural",
  MT_MT_GRACE_NEURAL = "mt-MT-GraceNeural",
  MT_MT_JOSEPH_NEURAL = "mt-MT-JosephNeural",
  MY_MM_NILAR_NEURAL = "my-MM-NilarNeural",
  MY_MM_THIHA_NEURAL = "my-MM-ThihaNeural",
  NB_NO_PERNILLE_NEURAL = "nb-NO-PernilleNeural",
  NB_NO_FINN_NEURAL = "nb-NO-FinnNeural",
  NB_NO_ISELIN_NEURAL = "nb-NO-IselinNeural",
  NE_NP_HEMKALA_NEURAL = "ne-NP-HemkalaNeural",
  NE_NP_SAGAR_NEURAL = "ne-NP-SagarNeural",
  NL_BE_DENA_NEURAL = "nl-BE-DenaNeural",
  NL_BE_ARNAUD_NEURAL = "nl-BE-ArnaudNeural",
  NL_NL_FENNA_NEURAL = "nl-NL-FennaNeural",
  NL_NL_MAARTEN_NEURAL = "nl-NL-MaartenNeural",
  NL_NL_COLETTE_NEURAL = "nl-NL-ColetteNeural",
  OR_IN_SUBHASINI_NEURAL = "or-IN-SubhasiniNeural",
  OR_IN_SUKANT_NEURAL = "or-IN-SukantNeural",
  PA_IN_OJAS_NEURAL = "pa-IN-OjasNeural",
  PA_IN_VAANI_NEURAL = "pa-IN-VaaniNeural",
  PL_PL_AGNIESZKA_NEURAL = "pl-PL-AgnieszkaNeural",
  PL_PL_MAREK_NEURAL = "pl-PL-MarekNeural",
  PL_PL_ZOFIA_NEURAL = "pl-PL-ZofiaNeural",
  PS_AF_LATIFA_NEURAL = "ps-AF-LatifaNeural",
  PS_AF_GULNAWAZ_NEURAL = "ps-AF-GulNawazNeural",
  PT_BR_FRANCISCA_NEURAL = "pt-BR-FranciscaNeural",
  PT_BR_ANTONIO_NEURAL = "pt-BR-AntonioNeural",
  PT_BR_BRENDA_NEURAL = "pt-BR-BrendaNeural",
  PT_BR_DONATO_NEURAL = "pt-BR-DonatoNeural",
  PT_BR_ELZA_NEURAL = "pt-BR-ElzaNeural",
  PT_BR_FABIO_NEURAL = "pt-BR-FabioNeural",
  PT_BR_GIOVANNA_NEURAL = "pt-BR-GiovannaNeural",
  PT_BR_HUMBERTO_NEURAL = "pt-BR-HumbertoNeural",
  PT_BR_JULIO_NEURAL = "pt-BR-JulioNeural",
  PT_BR_LEILA_NEURAL = "pt-BR-LeilaNeural",
  PT_BR_LETICIA_NEURAL = "pt-BR-LeticiaNeural",
  PT_BR_MANUELA_NEURAL = "pt-BR-ManuelaNeural",
  PT_BR_NICOLAU_NEURAL = "pt-BR-NicolauNeural",
  PT_BR_THALITAMULTILINGUAL_NEURAL = "pt-BR-ThalitaMultilingualNeural",
  PT_BR_THALITA_NEURAL = "pt-BR-ThalitaNeural",
  PT_BR_VALERIO_NEURAL = "pt-BR-ValerioNeural",
  PT_BR_YARA_NEURAL = "pt-BR-YaraNeural",
  PT_PT_RAQUEL_NEURAL = "pt-PT-RaquelNeural",
  PT_PT_DUARTE_NEURAL = "pt-PT-DuarteNeural",
  PT_PT_FERNANDA_NEURAL = "pt-PT-FernandaNeural",
  RO_RO_ALINA_NEURAL = "ro-RO-AlinaNeural",
  RO_RO_EMIL_NEURAL = "ro-RO-EmilNeural",
  RU_RU_SVETLANA_NEURAL = "ru-RU-SvetlanaNeural",
  RU_RU_DMITRY_NEURAL = "ru-RU-DmitryNeural",
  RU_RU_DARIYA_NEURAL = "ru-RU-DariyaNeural",
  SI_LK_THILINI_NEURAL = "si-LK-ThiliniNeural",
  SI_LK_SAMEERA_NEURAL = "si-LK-SameeraNeural",
  SK_SK_VIKTORIA_NEURAL = "sk-SK-ViktoriaNeural",
  SK_SK_LUKAS_NEURAL = "sk-SK-LukasNeural",
  SL_SI_PETRA_NEURAL = "sl-SI-PetraNeural",
  SL_SI_ROK_NEURAL = "sl-SI-RokNeural",
  SO_SO_UBAX_NEURAL = "so-SO-UbaxNeural",
  SO_SO_MUUSE_NEURAL = "so-SO-MuuseNeural",
  SQ_AL_ANILA_NEURAL = "sq-AL-AnilaNeural",
  SQ_AL_ILIR_NEURAL = "sq-AL-IlirNeural",
  SR_LATN_RS_NICHOLAS_NEURAL = "sr-Latn-RS-NicholasNeural",
  SR_LATN_RS_SOPHIE_NEURAL = "sr-Latn-RS-SophieNeural",
  SR_RS_SOPHIE_NEURAL = "sr-RS-SophieNeural",
  SR_RS_NICHOLAS_NEURAL = "sr-RS-NicholasNeural",
  SU_ID_TUTI_NEURAL = "su-ID-TutiNeural",
  SU_ID_JAJANG_NEURAL = "su-ID-JajangNeural",
  SV_SE_SOFIE_NEURAL = "sv-SE-SofieNeural",
  SV_SE_MATTIAS_NEURAL = "sv-SE-MattiasNeural",
  SV_SE_HILLEVI_NEURAL = "sv-SE-HilleviNeural",
  SW_KE_ZURI_NEURAL = "sw-KE-ZuriNeural",
  SW_KE_RAFIKI_NEURAL = "sw-KE-RafikiNeural",
  SW_TZ_REHEMA_NEURAL = "sw-TZ-RehemaNeural",
  SW_TZ_DAUDI_NEURAL = "sw-TZ-DaudiNeural",
  TA_IN_PALLAVI_NEURAL = "ta-IN-PallaviNeural",
  TA_IN_VALLUVAR_NEURAL = "ta-IN-ValluvarNeural",
  TA_LK_SARANYA_NEURAL = "ta-LK-SaranyaNeural",
  TA_LK_KUMAR_NEURAL = "ta-LK-KumarNeural",
  TA_MY_KANI_NEURAL = "ta-MY-KaniNeural",
  TA_MY_SURYA_NEURAL = "ta-MY-SuryaNeural",
  TA_SG_VENBA_NEURAL = "ta-SG-VenbaNeural",
  TA_SG_ANBU_NEURAL = "ta-SG-AnbuNeural",
  TE_IN_SHRUTI_NEURAL = "te-IN-ShrutiNeural",
  TE_IN_MOHAN_NEURAL = "te-IN-MohanNeural",
  TH_TH_PREMWADEE_NEURAL = "th-TH-PremwadeeNeural",
  TH_TH_NIWAT_NEURAL = "th-TH-NiwatNeural",
  TH_TH_ACHARA_NEURAL = "th-TH-AcharaNeural",
  TR_TR_EMEL_NEURAL = "tr-TR-EmelNeural",
  TR_TR_AHMET_NEURAL = "tr-TR-AhmetNeural",
  UK_UA_POLINA_NEURAL = "uk-UA-PolinaNeural",
  UK_UA_OSTAP_NEURAL = "uk-UA-OstapNeural",
  UR_IN_GUL_NEURAL = "ur-IN-GulNeural",
  UR_IN_SALMAN_NEURAL = "ur-IN-SalmanNeural",
  UR_PK_UZMA_NEURAL = "ur-PK-UzmaNeural",
  UR_PK_ASAD_NEURAL = "ur-PK-AsadNeural",
  UZ_UZ_MADINA_NEURAL = "uz-UZ-MadinaNeural",
  UZ_UZ_SARDOR_NEURAL = "uz-UZ-SardorNeural",
  VI_VN_HOAIMY_NEURAL = "vi-VN-HoaiMyNeural",
  VI_VN_NAMMINH_NEURAL = "vi-VN-NamMinhNeural",
  WUU_CN_XIAOTONG_NEURAL = "wuu-CN-XiaotongNeural",
  WUU_CN_YUNZHE_NEURAL = "wuu-CN-YunzheNeural",
  YUE_CN_XIAOMIN_NEURAL = "yue-CN-XiaoMinNeural",
  YUE_CN_YUNSONG_NEURAL = "yue-CN-YunSongNeural",
  ZH_CN_XIAOXIAO_NEURAL = "zh-CN-XiaoxiaoNeural",
  ZH_CN_YUNXI_NEURAL = "zh-CN-YunxiNeural",
  ZH_CN_YUNJIAN_NEURAL = "zh-CN-YunjianNeural",
  ZH_CN_XIAOYI_NEURAL = "zh-CN-XiaoyiNeural",
  ZH_CN_YUNYANG_NEURAL = "zh-CN-YunyangNeural",
  ZH_CN_XIAOCHEN_NEURAL = "zh-CN-XiaochenNeural",
  ZH_CN_XIAOCHENMULTILINGUAL_NEURAL = "zh-CN-XiaochenMultilingualNeural",
  ZH_CN_XIAOHAN_NEURAL = "zh-CN-XiaohanNeural",
  ZH_CN_XIAOMENG_NEURAL = "zh-CN-XiaomengNeural",
  ZH_CN_XIAOMO_NEURAL = "zh-CN-XiaomoNeural",
  ZH_CN_XIAOQIU_NEURAL = "zh-CN-XiaoqiuNeural",
  ZH_CN_XIAOROU_NEURAL = "zh-CN-XiaorouNeural",
  ZH_CN_XIAORUI_NEURAL = "zh-CN-XiaoruiNeural",
  ZH_CN_XIAOSHUANG_NEURAL = "zh-CN-XiaoshuangNeural",
  ZH_CN_XIAOXIAODIALECTS_NEURAL = "zh-CN-XiaoxiaoDialectsNeural",
  ZH_CN_XIAOXIAOMULTILINGUAL_NEURAL = "zh-CN-XiaoxiaoMultilingualNeural",
  ZH_CN_XIAOYAN_NEURAL = "zh-CN-XiaoyanNeural",
  ZH_CN_XIAOYOU_NEURAL = "zh-CN-XiaoyouNeural",
  ZH_CN_XIAOYUMULTILINGUAL_NEURAL = "zh-CN-XiaoyuMultilingualNeural",
  ZH_CN_XIAOZHEN_NEURAL = "zh-CN-XiaozhenNeural",
  ZH_CN_YUNFENG_NEURAL = "zh-CN-YunfengNeural",
  ZH_CN_YUNHAO_NEURAL = "zh-CN-YunhaoNeural",
  ZH_CN_YUNJIE_NEURAL = "zh-CN-YunjieNeural",
  ZH_CN_YUNXIA_NEURAL = "zh-CN-YunxiaNeural",
  ZH_CN_YUNYE_NEURAL = "zh-CN-YunyeNeural",
  ZH_CN_YUNYIMULTILINGUAL_NEURAL = "zh-CN-YunyiMultilingualNeural",
  ZH_CN_YUNZE_NEURAL = "zh-CN-YunzeNeural",
  ZH_CN_GUANGXI_YUNQI_NEURAL = "zh-CN-guangxi-YunqiNeural",
  ZH_CN_HENAN_YUNDENG_NEURAL = "zh-CN-henan-YundengNeural",
  ZH_CN_LIAONING_XIAOBEI_NEURAL = "zh-CN-liaoning-XiaobeiNeural",
  ZH_CN_LIAONING_YUNBIAO_NEURAL = "zh-CN-liaoning-YunbiaoNeural",
  ZH_CN_SHAANXI_XIAONI_NEURAL = "zh-CN-shaanxi-XiaoniNeural",
  ZH_CN_SHANDONG_YUNXIANG_NEURAL = "zh-CN-shandong-YunxiangNeural",
  ZH_CN_SICHUAN_YUNXI_NEURAL = "zh-CN-sichuan-YunxiNeural",
  ZH_HK_HIUMAAN_NEURAL = "zh-HK-HiuMaanNeural",
  ZH_HK_WANLUNG_NEURAL = "zh-HK-WanLungNeural",
  ZH_HK_HIUGAAI_NEURAL = "zh-HK-HiuGaaiNeural",
  ZH_TW_HSIAOCHEN_NEURAL = "zh-TW-HsiaoChenNeural",
  ZH_TW_YUNJHE_NEURAL = "zh-TW-YunJheNeural",
  ZH_TW_HSIAOYU_NEURAL = "zh-TW-HsiaoYuNeural",
  ZU_ZA_THANDO_NEURAL = "zu-ZA-ThandoNeural",
  ZU_ZA_THEMBA_NEURAL = "zu-ZA-ThembaNeural"
}

const AzureVoiceDetails = [
  [
    {
      name: AzureVoice.AF_ZA_ADRI_NEURAL,
      displayName: "Adri",
      languageCode: VoiceLanguage.AF_ZA,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.AF_ZA_WILLEM_NEURAL,
      displayName: "Willem",
      languageCode: VoiceLanguage.AF_ZA,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.AM_ET_MEKDES_NEURAL,
      displayName: "Mekdes",
      languageCode: VoiceLanguage.AM_ET,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.AM_ET_AMEHA_NEURAL,
      displayName: "Ameha",
      languageCode: VoiceLanguage.AM_ET,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.AR_AE_FATIMA_NEURAL,
      displayName: "Fatima",
      languageCode: VoiceLanguage.AR_AE,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.AR_AE_HAMDAN_NEURAL,
      displayName: "Hamdan",
      languageCode: VoiceLanguage.AR_AE,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.AR_BH_LAILA_NEURAL,
      displayName: "Laila",
      languageCode: VoiceLanguage.AR_BH,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.AR_BH_ALI_NEURAL,
      displayName: "Ali",
      languageCode: VoiceLanguage.AR_BH,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.AR_DZ_AMINA_NEURAL,
      displayName: "Amina",
      languageCode: VoiceLanguage.AR_DZ,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.AR_DZ_ISMAEL_NEURAL,
      displayName: "Ismael",
      languageCode: VoiceLanguage.AR_DZ,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.AR_EG_SALMA_NEURAL,
      displayName: "Salma",
      languageCode: VoiceLanguage.AR_EG,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.AR_EG_SHAKIR_NEURAL,
      displayName: "Shakir",
      languageCode: VoiceLanguage.AR_EG,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.AR_IQ_RANA_NEURAL,
      displayName: "Rana",
      languageCode: VoiceLanguage.AR_IQ,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.AR_IQ_BASSEL_NEURAL,
      displayName: "Bassel",
      languageCode: VoiceLanguage.AR_IQ,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.AR_JO_SANA_NEURAL,
      displayName: "Sana",
      languageCode: VoiceLanguage.AR_JO,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.AR_JO_TAIM_NEURAL,
      displayName: "Taim",
      languageCode: VoiceLanguage.AR_JO,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.AR_KW_NOURA_NEURAL,
      displayName: "Noura",
      languageCode: VoiceLanguage.AR_KW,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.AR_KW_FAHED_NEURAL,
      displayName: "Fahed",
      languageCode: VoiceLanguage.AR_KW,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.AR_LB_LAYLA_NEURAL,
      displayName: "Layla",
      languageCode: VoiceLanguage.AR_LB,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.AR_LB_RAMI_NEURAL,
      displayName: "Rami",
      languageCode: VoiceLanguage.AR_LB,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.AR_LY_IMAN_NEURAL,
      displayName: "Iman",
      languageCode: VoiceLanguage.AR_LY,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.AR_LY_OMAR_NEURAL,
      displayName: "Omar",
      languageCode: VoiceLanguage.AR_LY,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.AR_MA_MOUNA_NEURAL,
      displayName: "Mouna",
      languageCode: VoiceLanguage.AR_MA,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.AR_MA_JAMAL_NEURAL,
      displayName: "Jamal",
      languageCode: VoiceLanguage.AR_MA,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.AR_OM_AYSHA_NEURAL,
      displayName: "Aysha",
      languageCode: VoiceLanguage.AR_OM,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.AR_OM_ABDULLAH_NEURAL,
      displayName: "Abdullah",
      languageCode: VoiceLanguage.AR_OM,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.AR_QA_AMAL_NEURAL,
      displayName: "Amal",
      languageCode: VoiceLanguage.AR_QA,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.AR_QA_MOAZ_NEURAL,
      displayName: "Moaz",
      languageCode: VoiceLanguage.AR_QA,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.AR_SA_ZARIYAH_NEURAL,
      displayName: "Zariyah",
      languageCode: VoiceLanguage.AR_SA,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.AR_SA_HAMED_NEURAL,
      displayName: "Hamed",
      languageCode: VoiceLanguage.AR_SA,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.AR_SY_AMANY_NEURAL,
      displayName: "Amany",
      languageCode: VoiceLanguage.AR_SY,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.AR_SY_LAITH_NEURAL,
      displayName: "Laith",
      languageCode: VoiceLanguage.AR_SY,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.AR_TN_REEM_NEURAL,
      displayName: "Reem",
      languageCode: VoiceLanguage.AR_TN,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.AR_TN_HEDI_NEURAL,
      displayName: "Hedi",
      languageCode: VoiceLanguage.AR_TN,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.AR_YE_MARYAM_NEURAL,
      displayName: "Maryam",
      languageCode: VoiceLanguage.AR_YE,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.AR_YE_SALEH_NEURAL,
      displayName: "Saleh",
      languageCode: VoiceLanguage.AR_YE,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.AS_IN_PRIYOM_NEURAL,
      displayName: "Priyom",
      languageCode: VoiceLanguage.AS_IN,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.AS_IN_YASHICA_NEURAL,
      displayName: "Yashica",
      languageCode: VoiceLanguage.AS_IN,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.AZ_AZ_BANU_NEURAL,
      displayName: "Banu",
      languageCode: VoiceLanguage.AZ_AZ,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.AZ_AZ_BABEK_NEURAL,
      displayName: "Babek",
      languageCode: VoiceLanguage.AZ_AZ,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.BG_BG_KALINA_NEURAL,
      displayName: "Kalina",
      languageCode: VoiceLanguage.BG_BG,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.BG_BG_BORISLAV_NEURAL,
      displayName: "Borislav",
      languageCode: VoiceLanguage.BG_BG,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.BN_BD_NABANITA_NEURAL,
      displayName: "Nabanita",
      languageCode: VoiceLanguage.BN_BD,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.BN_BD_PRADEEP_NEURAL,
      displayName: "Pradeep",
      languageCode: VoiceLanguage.BN_BD,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.BN_IN_TANISHAA_NEURAL,
      displayName: "Tanishaa",
      languageCode: VoiceLanguage.BN_IN,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.BN_IN_BASHKAR_NEURAL,
      displayName: "Bashkar",
      languageCode: VoiceLanguage.BN_IN,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.BS_BA_VESNA_NEURAL,
      displayName: "Vesna",
      languageCode: VoiceLanguage.BS_BA,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.BS_BA_GORAN_NEURAL,
      displayName: "Goran",
      languageCode: VoiceLanguage.BS_BA,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.CA_ES_JOANA_NEURAL,
      displayName: "Joana",
      languageCode: VoiceLanguage.CA_ES,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.CA_ES_ENRIC_NEURAL,
      displayName: "Enric",
      languageCode: VoiceLanguage.CA_ES,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.CA_ES_ALBA_NEURAL,
      displayName: "Alba",
      languageCode: VoiceLanguage.CA_ES,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.CS_CZ_VLASTA_NEURAL,
      displayName: "Vlasta",
      languageCode: VoiceLanguage.CS_CZ,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.CS_CZ_ANTONIN_NEURAL,
      displayName: "Antonin",
      languageCode: VoiceLanguage.CS_CZ,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.CY_GB_NIA_NEURAL,
      displayName: "Nia",
      languageCode: VoiceLanguage.CY_GB,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.CY_GB_ALED_NEURAL,
      displayName: "Aled",
      languageCode: VoiceLanguage.CY_GB,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.DA_DK_CHRISTEL_NEURAL,
      displayName: "Christel",
      languageCode: VoiceLanguage.DA_DK,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.DA_DK_JEPPE_NEURAL,
      displayName: "Jeppe",
      languageCode: VoiceLanguage.DA_DK,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.DE_AT_INGRID_NEURAL,
      displayName: "Ingrid",
      languageCode: VoiceLanguage.DE_AT,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.DE_AT_JONAS_NEURAL,
      displayName: "Jonas",
      languageCode: VoiceLanguage.DE_AT,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.DE_CH_LENI_NEURAL,
      displayName: "Leni",
      languageCode: VoiceLanguage.DE_CH,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.DE_CH_JAN_NEURAL,
      displayName: "Jan",
      languageCode: VoiceLanguage.DE_CH,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.DE_DE_KATJA_NEURAL,
      displayName: "Katja",
      languageCode: VoiceLanguage.DE_DE,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.DE_DE_CONRAD_NEURAL,
      displayName: "Conrad",
      languageCode: VoiceLanguage.DE_DE,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.DE_DE_AMALA_NEURAL,
      displayName: "Amala",
      languageCode: VoiceLanguage.DE_DE,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.DE_DE_BERND_NEURAL,
      displayName: "Bernd",
      languageCode: VoiceLanguage.DE_DE,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.DE_DE_CHRISTOPH_NEURAL,
      displayName: "Christoph",
      languageCode: VoiceLanguage.DE_DE,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.DE_DE_ELKE_NEURAL,
      displayName: "Elke",
      languageCode: VoiceLanguage.DE_DE,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.DE_DE_FLORIANMULTILINGUAL_NEURAL,
      displayName: "Florian Multilingual",
      languageCode: VoiceLanguage.DE_DE,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.DE_DE_GISELA_NEURAL,
      displayName: "Gisela",
      languageCode: VoiceLanguage.DE_DE,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.DE_DE_KASPER_NEURAL,
      displayName: "Kasper",
      languageCode: VoiceLanguage.DE_DE,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.DE_DE_KILLIAN_NEURAL,
      displayName: "Killian",
      languageCode: VoiceLanguage.DE_DE,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.DE_DE_KLARISSA_NEURAL,
      displayName: "Klarissa",
      languageCode: VoiceLanguage.DE_DE,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.DE_DE_KLAUS_NEURAL,
      displayName: "Klaus",
      languageCode: VoiceLanguage.DE_DE,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.DE_DE_LOUISA_NEURAL,
      displayName: "Louisa",
      languageCode: VoiceLanguage.DE_DE,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.DE_DE_MAJA_NEURAL,
      displayName: "Maja",
      languageCode: VoiceLanguage.DE_DE,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.DE_DE_RALF_NEURAL,
      displayName: "Ralf",
      languageCode: VoiceLanguage.DE_DE,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.DE_DE_SERAPHINAMULTILINGUAL_NEURAL,
      displayName: "Seraphina Multilingual",
      languageCode: VoiceLanguage.DE_DE,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.DE_DE_TANJA_NEURAL,
      displayName: "Tanja",
      languageCode: VoiceLanguage.DE_DE,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.EL_GR_ATHINA_NEURAL,
      displayName: "Athina",
      languageCode: VoiceLanguage.EL_GR,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.EL_GR_NESTORAS_NEURAL,
      displayName: "Nestoras",
      languageCode: VoiceLanguage.EL_GR,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.EN_AU_NATASHA_NEURAL,
      displayName: "Natasha",
      languageCode: VoiceLanguage.EN_AU,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.EN_AU_WILLIAM_NEURAL,
      displayName: "William",
      languageCode: VoiceLanguage.EN_AU,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.EN_AU_ANNETTE_NEURAL,
      displayName: "Annette",
      languageCode: VoiceLanguage.EN_AU,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.EN_AU_CARLY_NEURAL,
      displayName: "Carly",
      languageCode: VoiceLanguage.EN_AU,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.EN_AU_DARREN_NEURAL,
      displayName: "Darren",
      languageCode: VoiceLanguage.EN_AU,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.EN_AU_DUNCAN_NEURAL,
      displayName: "Duncan",
      languageCode: VoiceLanguage.EN_AU,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.EN_AU_ELSIE_NEURAL,
      displayName: "Elsie",
      languageCode: VoiceLanguage.EN_AU,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.EN_AU_FREYA_NEURAL,
      displayName: "Freya",
      languageCode: VoiceLanguage.EN_AU,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.EN_AU_JOANNE_NEURAL,
      displayName: "Joanne",
      languageCode: VoiceLanguage.EN_AU,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.EN_AU_KEN_NEURAL,
      displayName: "Ken",
      languageCode: VoiceLanguage.EN_AU,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.EN_AU_KIM_NEURAL,
      displayName: "Kim",
      languageCode: VoiceLanguage.EN_AU,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.EN_AU_NEIL_NEURAL,
      displayName: "Neil",
      languageCode: VoiceLanguage.EN_AU,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.EN_AU_TIM_NEURAL,
      displayName: "Tim",
      languageCode: VoiceLanguage.EN_AU,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.EN_AU_TINA_NEURAL,
      displayName: "Tina",
      languageCode: VoiceLanguage.EN_AU,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.EN_CA_CLARA_NEURAL,
      displayName: "Clara",
      languageCode: VoiceLanguage.EN_CA,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.EN_CA_LIAM_NEURAL,
      displayName: "Liam",
      languageCode: VoiceLanguage.EN_CA,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.EN_GB_SONIA_NEURAL,
      displayName: "Sonia",
      languageCode: VoiceLanguage.EN_GB,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.EN_GB_RYAN_NEURAL,
      displayName: "Ryan",
      languageCode: VoiceLanguage.EN_GB,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.EN_GB_LIBBY_NEURAL,
      displayName: "Libby",
      languageCode: VoiceLanguage.EN_GB,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.EN_GB_ABBI_NEURAL,
      displayName: "Abbi",
      languageCode: VoiceLanguage.EN_GB,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.EN_GB_ADAMULTILINGUAL_NEURAL,
      displayName: "Ada Multilingual",
      languageCode: VoiceLanguage.EN_GB,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.EN_GB_ALFIE_NEURAL,
      displayName: "Alfie",
      languageCode: VoiceLanguage.EN_GB,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.EN_GB_BELLA_NEURAL,
      displayName: "Bella",
      languageCode: VoiceLanguage.EN_GB,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.EN_GB_ELLIOT_NEURAL,
      displayName: "Elliot",
      languageCode: VoiceLanguage.EN_GB,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.EN_GB_ETHAN_NEURAL,
      displayName: "Ethan",
      languageCode: VoiceLanguage.EN_GB,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.EN_GB_HOLLIE_NEURAL,
      displayName: "Hollie",
      languageCode: VoiceLanguage.EN_GB,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.EN_GB_MAISIE_NEURAL,
      displayName: "Maisie",
      languageCode: VoiceLanguage.EN_GB,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.EN_GB_NOAH_NEURAL,
      displayName: "Noah",
      languageCode: VoiceLanguage.EN_GB,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.EN_GB_OLIVER_NEURAL,
      displayName: "Oliver",
      languageCode: VoiceLanguage.EN_GB,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.EN_GB_OLIVIA_NEURAL,
      displayName: "Olivia",
      languageCode: VoiceLanguage.EN_GB,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.EN_GB_THOMAS_NEURAL,
      displayName: "Thomas",
      languageCode: VoiceLanguage.EN_GB,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.EN_GB_OLLIEMULTILINGUAL_NEURAL,
      displayName: "Ollie Multilingual",
      languageCode: VoiceLanguage.EN_GB,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.EN_GB_MIA_NEURAL,
      displayName: "Mia",
      languageCode: VoiceLanguage.EN_GB,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.EN_HK_YAN_NEURAL,
      displayName: "Yan",
      languageCode: VoiceLanguage.EN_HK,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.EN_HK_SAM_NEURAL,
      displayName: "Sam",
      languageCode: VoiceLanguage.EN_HK,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.EN_IE_EMILY_NEURAL,
      displayName: "Emily",
      languageCode: VoiceLanguage.EN_IE,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.EN_IE_CONNOR_NEURAL,
      displayName: "Connor",
      languageCode: VoiceLanguage.EN_IE,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.EN_IN_NEERJA_NEURAL,
      displayName: "Neerja",
      languageCode: VoiceLanguage.EN_IN,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.EN_IN_PRABHAT_NEURAL,
      displayName: "Prabhat",
      languageCode: VoiceLanguage.EN_IN,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.EN_IN_AARAV_NEURAL,
      displayName: "Aarav",
      languageCode: VoiceLanguage.EN_IN,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.EN_IN_AASHI_NEURAL,
      displayName: "Aashi",
      languageCode: VoiceLanguage.EN_IN,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.EN_IN_ANANYA_NEURAL,
      displayName: "Ananya",
      languageCode: VoiceLanguage.EN_IN,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.EN_IN_KAVYA_NEURAL,
      displayName: "Kavya",
      languageCode: VoiceLanguage.EN_IN,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.EN_IN_KUNAL_NEURAL,
      displayName: "Kunal",
      languageCode: VoiceLanguage.EN_IN,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.EN_IN_REHAAN_NEURAL,
      displayName: "Rehaan",
      languageCode: VoiceLanguage.EN_IN,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.EN_KE_ASILIA_NEURAL,
      displayName: "Asilia",
      languageCode: VoiceLanguage.EN_KE,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.EN_KE_CHILEMBA_NEURAL,
      displayName: "Chilemba",
      languageCode: VoiceLanguage.EN_KE,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.EN_NG_EZINNE_NEURAL,
      displayName: "Ezinne",
      languageCode: VoiceLanguage.EN_NG,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.EN_NG_ABEO_NEURAL,
      displayName: "Abeo",
      languageCode: VoiceLanguage.EN_NG,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.EN_NZ_MOLLY_NEURAL,
      displayName: "Molly",
      languageCode: VoiceLanguage.EN_NZ,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.EN_NZ_MITCHELL_NEURAL,
      displayName: "Mitchell",
      languageCode: VoiceLanguage.EN_NZ,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.EN_PH_ROSA_NEURAL,
      displayName: "Rosa",
      languageCode: VoiceLanguage.EN_PH,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.EN_PH_JAMES_NEURAL,
      displayName: "James",
      languageCode: VoiceLanguage.EN_PH,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.EN_SG_LUNA_NEURAL,
      displayName: "Luna",
      languageCode: VoiceLanguage.EN_SG,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.EN_SG_WAYNE_NEURAL,
      displayName: "Wayne",
      languageCode: VoiceLanguage.EN_SG,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.EN_TZ_IMANI_NEURAL,
      displayName: "Imani",
      languageCode: VoiceLanguage.EN_TZ,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.EN_TZ_ELIMU_NEURAL,
      displayName: "Elimu",
      languageCode: VoiceLanguage.EN_TZ,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.EN_US_AVAMULTILINGUAL_NEURAL,
      displayName: "Ava Multilingual",
      languageCode: VoiceLanguage.EN_US,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.EN_US_ANDREWMULTILINGUAL_NEURAL,
      displayName: "Andrew Multilingual",
      languageCode: VoiceLanguage.EN_US,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.EN_US_EMMAMULTILINGUAL_NEURAL,
      displayName: "Emma Multilingual",
      languageCode: VoiceLanguage.EN_US,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.EN_US_BRIANMULTILINGUAL_NEURAL,
      displayName: "Brian Multilingual",
      languageCode: VoiceLanguage.EN_US,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.EN_US_AVA_NEURAL,
      displayName: "Ava",
      languageCode: VoiceLanguage.EN_US,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.EN_US_ANDREW_NEURAL,
      displayName: "Andrew",
      languageCode: VoiceLanguage.EN_US,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.EN_US_EMMA_NEURAL,
      displayName: "Emma",
      languageCode: VoiceLanguage.EN_US,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.EN_US_BRIAN_NEURAL,
      displayName: "Brian",
      languageCode: VoiceLanguage.EN_US,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.EN_US_JENNY_NEURAL,
      displayName: "Jenny",
      languageCode: VoiceLanguage.EN_US,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.EN_US_GUY_NEURAL,
      displayName: "Guy",
      languageCode: VoiceLanguage.EN_US,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.EN_US_ARIA_NEURAL,
      displayName: "Aria",
      languageCode: VoiceLanguage.EN_US,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.EN_US_DAVIS_NEURAL,
      displayName: "Davis",
      languageCode: VoiceLanguage.EN_US,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.EN_US_JANE_NEURAL,
      displayName: "Jane",
      languageCode: VoiceLanguage.EN_US,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.EN_US_JASON_NEURAL,
      displayName: "Jason",
      languageCode: VoiceLanguage.EN_US,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.EN_US_SARA_NEURAL,
      displayName: "Sara",
      languageCode: VoiceLanguage.EN_US,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.EN_US_TONY_NEURAL,
      displayName: "Tony",
      languageCode: VoiceLanguage.EN_US,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.EN_US_NANCY_NEURAL,
      displayName: "Nancy",
      languageCode: VoiceLanguage.EN_US,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.EN_US_AMBER_NEURAL,
      displayName: "Amber",
      languageCode: VoiceLanguage.EN_US,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.EN_US_ANA_NEURAL,
      displayName: "Ana",
      languageCode: VoiceLanguage.EN_US,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.EN_US_ASHLEY_NEURAL,
      displayName: "Ashley",
      languageCode: VoiceLanguage.EN_US,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.EN_US_BRANDON_NEURAL,
      displayName: "Brandon",
      languageCode: VoiceLanguage.EN_US,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.EN_US_CHRISTOPHER_NEURAL,
      displayName: "Christopher",
      languageCode: VoiceLanguage.EN_US,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.EN_US_CORA_NEURAL,
      displayName: "Cora",
      languageCode: VoiceLanguage.EN_US,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.EN_US_ELIZABETH_NEURAL,
      displayName: "Elizabeth",
      languageCode: VoiceLanguage.EN_US,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.EN_US_ERIC_NEURAL,
      displayName: "Eric",
      languageCode: VoiceLanguage.EN_US,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.EN_US_JACOB_NEURAL,
      displayName: "Jacob",
      languageCode: VoiceLanguage.EN_US,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.EN_US_JENNYMULTILINGUAL_NEURAL,
      displayName: "Jenny Multilingual",
      languageCode: VoiceLanguage.EN_US,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.EN_US_MICHELLE_NEURAL,
      displayName: "Michelle",
      languageCode: VoiceLanguage.EN_US,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.EN_US_MONICA_NEURAL,
      displayName: "Monica",
      languageCode: VoiceLanguage.EN_US,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.EN_US_ROGER_NEURAL,
      displayName: "Roger",
      languageCode: VoiceLanguage.EN_US,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.EN_US_RYANMULTILINGUAL_NEURAL,
      displayName: "Ryan Multilingual",
      languageCode: VoiceLanguage.EN_US,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.EN_US_STEFFAN_NEURAL,
      displayName: "Steffan",
      languageCode: VoiceLanguage.EN_US,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.EN_US_AIGENERATE1_NEURAL,
      displayName: "AIGenerate1",
      languageCode: VoiceLanguage.EN_US,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.EN_US_AIGENERATE2_NEURAL,
      displayName: "AIGenerate2",
      languageCode: VoiceLanguage.EN_US,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.EN_US_BLUE_NEURAL,
      displayName: "Blue",
      languageCode: VoiceLanguage.EN_US,
      gender: VoiceGender.NEUTRAL
    },
    {
      name: AzureVoice.EN_US_KAI_NEURAL,
      displayName: "Kai",
      languageCode: VoiceLanguage.EN_US,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.EN_US_LUNA_NEURAL,
      displayName: "Luna",
      languageCode: VoiceLanguage.EN_US,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.EN_ZA_LEAH_NEURAL,
      displayName: "Leah",
      languageCode: VoiceLanguage.EN_ZA,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.EN_ZA_LUKE_NEURAL,
      displayName: "Luke",
      languageCode: VoiceLanguage.EN_ZA,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.ES_AR_ELENA_NEURAL,
      displayName: "Elena",
      languageCode: VoiceLanguage.ES_AR,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.ES_AR_TOMAS_NEURAL,
      displayName: "Tomas",
      languageCode: VoiceLanguage.ES_AR,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.ES_BO_SOFIA_NEURAL,
      displayName: "Sofia",
      languageCode: VoiceLanguage.ES_BO,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.ES_BO_MARCELO_NEURAL,
      displayName: "Marcelo",
      languageCode: VoiceLanguage.ES_BO,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.ES_CL_CATALINA_NEURAL,
      displayName: "Catalina",
      languageCode: VoiceLanguage.ES_CL,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.ES_CL_LORENZO_NEURAL,
      displayName: "Lorenzo",
      languageCode: VoiceLanguage.ES_CL,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.ES_CO_SALOME_NEURAL,
      displayName: "Salome",
      languageCode: VoiceLanguage.ES_CO,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.ES_CO_GONZALO_NEURAL,
      displayName: "Gonzalo",
      languageCode: VoiceLanguage.ES_CO,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.ES_CR_MARIA_NEURAL,
      displayName: "Maria",
      languageCode: VoiceLanguage.ES_CR,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.ES_CR_JUAN_NEURAL,
      displayName: "Juan",
      languageCode: VoiceLanguage.ES_CR,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.ES_CU_BELKYS_NEURAL,
      displayName: "Belkys",
      languageCode: VoiceLanguage.ES_CU,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.ES_CU_MANUEL_NEURAL,
      displayName: "Manuel",
      languageCode: VoiceLanguage.ES_CU,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.ES_DO_RAMONA_NEURAL,
      displayName: "Ramona",
      languageCode: VoiceLanguage.ES_DO,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.ES_DO_EMILIO_NEURAL,
      displayName: "Emilio",
      languageCode: VoiceLanguage.ES_DO,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.ES_EC_ANDREA_NEURAL,
      displayName: "Andrea",
      languageCode: VoiceLanguage.ES_EC,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.ES_EC_LUIS_NEURAL,
      displayName: "Luis",
      languageCode: VoiceLanguage.ES_EC,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.ES_ES_ELVIRA_NEURAL,
      displayName: "Elvira",
      languageCode: VoiceLanguage.ES_ES,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.ES_ES_ALVARO_NEURAL,
      displayName: "Alvaro",
      languageCode: VoiceLanguage.ES_ES,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.ES_ES_ABRIL_NEURAL,
      displayName: "Abril",
      languageCode: VoiceLanguage.ES_ES,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.ES_ES_ARNAU_NEURAL,
      displayName: "Arnau",
      languageCode: VoiceLanguage.ES_ES,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.ES_ES_DARIO_NEURAL,
      displayName: "Dario",
      languageCode: VoiceLanguage.ES_ES,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.ES_ES_ELIAS_NEURAL,
      displayName: "Elias",
      languageCode: VoiceLanguage.ES_ES,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.ES_ES_ESTRELLA_NEURAL,
      displayName: "Estrella",
      languageCode: VoiceLanguage.ES_ES,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.ES_ES_IRENE_NEURAL,
      displayName: "Irene",
      languageCode: VoiceLanguage.ES_ES,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.ES_ES_LAIA_NEURAL,
      displayName: "Laia",
      languageCode: VoiceLanguage.ES_ES,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.ES_ES_LIA_NEURAL,
      displayName: "Lia",
      languageCode: VoiceLanguage.ES_ES,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.ES_ES_NIL_NEURAL,
      displayName: "Nil",
      languageCode: VoiceLanguage.ES_ES,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.ES_ES_SAUL_NEURAL,
      displayName: "Saul",
      languageCode: VoiceLanguage.ES_ES,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.ES_ES_TEO_NEURAL,
      displayName: "Teo",
      languageCode: VoiceLanguage.ES_ES,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.ES_ES_TRIANA_NEURAL,
      displayName: "Triana",
      languageCode: VoiceLanguage.ES_ES,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.ES_ES_VERA_NEURAL,
      displayName: "Vera",
      languageCode: VoiceLanguage.ES_ES,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.ES_ES_XIMENA_NEURAL,
      displayName: "Ximena",
      languageCode: VoiceLanguage.ES_ES,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.ES_ES_ARABELLAMULTILINGUAL_NEURAL,
      displayName: "Arabella Multilingual",
      languageCode: VoiceLanguage.ES_ES,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.ES_ES_ISIDORAMULTILINGUAL_NEURAL,
      displayName: "Isidora Multilingual",
      languageCode: VoiceLanguage.ES_ES,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.ES_GQ_TERESA_NEURAL,
      displayName: "Teresa",
      languageCode: VoiceLanguage.ES_GQ,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.ES_GQ_JAVIER_NEURAL,
      displayName: "Javier",
      languageCode: VoiceLanguage.ES_GQ,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.ES_GT_MARTA_NEURAL,
      displayName: "Marta",
      languageCode: VoiceLanguage.ES_GT,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.ES_GT_ANDRES_NEURAL,
      displayName: "Andres",
      languageCode: VoiceLanguage.ES_GT,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.ES_HN_KARLA_NEURAL,
      displayName: "Karla",
      languageCode: VoiceLanguage.ES_HN,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.ES_HN_CARLOS_NEURAL,
      displayName: "Carlos",
      languageCode: VoiceLanguage.ES_HN,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.ES_MX_DALIA_NEURAL,
      displayName: "Dalia",
      languageCode: VoiceLanguage.ES_MX,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.ES_MX_JORGE_NEURAL,
      displayName: "Jorge",
      languageCode: VoiceLanguage.ES_MX,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.ES_MX_BEATRIZ_NEURAL,
      displayName: "Beatriz",
      languageCode: VoiceLanguage.ES_MX,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.ES_MX_CANDELA_NEURAL,
      displayName: "Candela",
      languageCode: VoiceLanguage.ES_MX,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.ES_MX_CARLOTA_NEURAL,
      displayName: "Carlota",
      languageCode: VoiceLanguage.ES_MX,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.ES_MX_CECILIO_NEURAL,
      displayName: "Cecilio",
      languageCode: VoiceLanguage.ES_MX,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.ES_MX_GERARDO_NEURAL,
      displayName: "Gerardo",
      languageCode: VoiceLanguage.ES_MX,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.ES_MX_LARISSA_NEURAL,
      displayName: "Larissa",
      languageCode: VoiceLanguage.ES_MX,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.ES_MX_LIBERTO_NEURAL,
      displayName: "Liberto",
      languageCode: VoiceLanguage.ES_MX,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.ES_MX_LUCIANO_NEURAL,
      displayName: "Luciano",
      languageCode: VoiceLanguage.ES_MX,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.ES_MX_MARINA_NEURAL,
      displayName: "Marina",
      languageCode: VoiceLanguage.ES_MX,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.ES_MX_NURIA_NEURAL,
      displayName: "Nuria",
      languageCode: VoiceLanguage.ES_MX,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.ES_MX_PELAYO_NEURAL,
      displayName: "Pelayo",
      languageCode: VoiceLanguage.ES_MX,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.ES_MX_RENATA_NEURAL,
      displayName: "Renata",
      languageCode: VoiceLanguage.ES_MX,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.ES_MX_YAGO_NEURAL,
      displayName: "Yago",
      languageCode: VoiceLanguage.ES_MX,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.ES_NI_YOLANDA_NEURAL,
      displayName: "Yolanda",
      languageCode: VoiceLanguage.ES_NI,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.ES_NI_FEDERICO_NEURAL,
      displayName: "Federico",
      languageCode: VoiceLanguage.ES_NI,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.ES_PA_MARGARITA_NEURAL,
      displayName: "Margarita",
      languageCode: VoiceLanguage.ES_PA,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.ES_PA_ROBERTO_NEURAL,
      displayName: "Roberto",
      languageCode: VoiceLanguage.ES_PA,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.ES_PE_CAMILA_NEURAL,
      displayName: "Camila",
      languageCode: VoiceLanguage.ES_PE,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.ES_PE_ALEX_NEURAL,
      displayName: "Alex",
      languageCode: VoiceLanguage.ES_PE,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.ES_PR_KARINA_NEURAL,
      displayName: "Karina",
      languageCode: VoiceLanguage.ES_PR,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.ES_PR_VICTOR_NEURAL,
      displayName: "Victor",
      languageCode: VoiceLanguage.ES_PR,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.ES_PY_TANIA_NEURAL,
      displayName: "Tania",
      languageCode: VoiceLanguage.ES_PY,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.ES_PY_MARIO_NEURAL,
      displayName: "Mario",
      languageCode: VoiceLanguage.ES_PY,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.ES_SV_LORENA_NEURAL,
      displayName: "Lorena",
      languageCode: VoiceLanguage.ES_SV,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.ES_SV_RODRIGO_NEURAL,
      displayName: "Rodrigo",
      languageCode: VoiceLanguage.ES_SV,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.ES_US_PALOMA_NEURAL,
      displayName: "Paloma",
      languageCode: VoiceLanguage.ES_US,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.ES_US_ALONSO_NEURAL,
      displayName: "Alonso",
      languageCode: VoiceLanguage.ES_US,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.ES_UY_VALENTINA_NEURAL,
      displayName: "Valentina",
      languageCode: VoiceLanguage.ES_UY,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.ES_UY_MATEO_NEURAL,
      displayName: "Mateo",
      languageCode: VoiceLanguage.ES_UY,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.ES_VE_PAOLA_NEURAL,
      displayName: "Paola",
      languageCode: VoiceLanguage.ES_VE,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.ES_VE_SEBASTIAN_NEURAL,
      displayName: "Sebastian",
      languageCode: VoiceLanguage.ES_VE,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.ET_EE_ANU_NEURAL,
      displayName: "Anu",
      languageCode: VoiceLanguage.ET_EE,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.ET_EE_KERT_NEURAL,
      displayName: "Kert",
      languageCode: VoiceLanguage.ET_EE,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.EU_ES_AINHOA_NEURAL,
      displayName: "Ainhoa",
      languageCode: VoiceLanguage.EU_ES,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.EU_ES_ANDER_NEURAL,
      displayName: "Ander",
      languageCode: VoiceLanguage.EU_ES,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.FA_IR_DILARA_NEURAL,
      displayName: "Dilara",
      languageCode: VoiceLanguage.FA_IR,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.FA_IR_FARID_NEURAL,
      displayName: "Farid",
      languageCode: VoiceLanguage.FA_IR,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.FI_FI_SELMA_NEURAL,
      displayName: "Selma",
      languageCode: VoiceLanguage.FI_FI,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.FI_FI_HARRI_NEURAL,
      displayName: "Harri",
      languageCode: VoiceLanguage.FI_FI,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.FI_FI_NOORA_NEURAL,
      displayName: "Noora",
      languageCode: VoiceLanguage.FI_FI,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.FIL_PH_BLESSICA_NEURAL,
      displayName: "Blessica",
      languageCode: VoiceLanguage.FIL_PH,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.FIL_PH_ANGELO_NEURAL,
      displayName: "Angelo",
      languageCode: VoiceLanguage.FIL_PH,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.FR_BE_CHARLINE_NEURAL,
      displayName: "Charline",
      languageCode: VoiceLanguage.FR_BE,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.FR_BE_GERARD_NEURAL,
      displayName: "Gerard",
      languageCode: VoiceLanguage.FR_BE,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.FR_CA_SYLVIE_NEURAL,
      displayName: "Sylvie",
      languageCode: VoiceLanguage.FR_CA,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.FR_CA_JEAN_NEURAL,
      displayName: "Jean",
      languageCode: VoiceLanguage.FR_CA,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.FR_CA_ANTOINE_NEURAL,
      displayName: "Antoine",
      languageCode: VoiceLanguage.FR_CA,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.FR_CA_THIERRY_NEURAL,
      displayName: "Thierry",
      languageCode: VoiceLanguage.FR_CA,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.FR_CH_ARIANE_NEURAL,
      displayName: "Ariane",
      languageCode: VoiceLanguage.FR_CH,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.FR_CH_FABRICE_NEURAL,
      displayName: "Fabrice",
      languageCode: VoiceLanguage.FR_CH,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.FR_FR_DENISE_NEURAL,
      displayName: "Denise",
      languageCode: VoiceLanguage.FR_FR,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.FR_FR_HENRI_NEURAL,
      displayName: "Henri",
      languageCode: VoiceLanguage.FR_FR,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.FR_FR_ALAIN_NEURAL,
      displayName: "Alain",
      languageCode: VoiceLanguage.FR_FR,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.FR_FR_BRIGITTE_NEURAL,
      displayName: "Brigitte",
      languageCode: VoiceLanguage.FR_FR,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.FR_FR_CELESTE_NEURAL,
      displayName: "Celeste",
      languageCode: VoiceLanguage.FR_FR,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.FR_FR_CLAUDE_NEURAL,
      displayName: "Claude",
      languageCode: VoiceLanguage.FR_FR,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.FR_FR_CORALIE_NEURAL,
      displayName: "Coralie",
      languageCode: VoiceLanguage.FR_FR,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.FR_FR_ELOISE_NEURAL,
      displayName: "Eloise",
      languageCode: VoiceLanguage.FR_FR,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.FR_FR_JACQUELINE_NEURAL,
      displayName: "Jacqueline",
      languageCode: VoiceLanguage.FR_FR,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.FR_FR_JEROME_NEURAL,
      displayName: "Jerome",
      languageCode: VoiceLanguage.FR_FR,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.FR_FR_JOSEPHINE_NEURAL,
      displayName: "Josephine",
      languageCode: VoiceLanguage.FR_FR,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.FR_FR_MAURICE_NEURAL,
      displayName: "Maurice",
      languageCode: VoiceLanguage.FR_FR,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.FR_FR_REMYMULTILINGUAL_NEURAL,
      displayName: "Remy Multilingual",
      languageCode: VoiceLanguage.FR_FR,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.FR_FR_VIVIENNEMULTILINGUAL_NEURAL,
      displayName: "Vivienne Multilingual",
      languageCode: VoiceLanguage.FR_FR,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.FR_FR_YVES_NEURAL,
      displayName: "Yves",
      languageCode: VoiceLanguage.FR_FR,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.FR_FR_YVETTE_NEURAL,
      displayName: "Yvette",
      languageCode: VoiceLanguage.FR_FR,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.GA_IE_ORLA_NEURAL,
      displayName: "Orla",
      languageCode: VoiceLanguage.GA_IE,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.GA_IE_COLM_NEURAL,
      displayName: "Colm",
      languageCode: VoiceLanguage.GA_IE,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.GL_ES_SABELA_NEURAL,
      displayName: "Sabela",
      languageCode: VoiceLanguage.GL_ES,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.GL_ES_ROI_NEURAL,
      displayName: "Roi",
      languageCode: VoiceLanguage.GL_ES,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.GU_IN_DHWANI_NEURAL,
      displayName: "Dhwani",
      languageCode: VoiceLanguage.GU_IN,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.GU_IN_NIRANJAN_NEURAL,
      displayName: "Niranjan",
      languageCode: VoiceLanguage.GU_IN,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.HE_IL_HILA_NEURAL,
      displayName: "Hila",
      languageCode: VoiceLanguage.HE_IL,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.HE_IL_AVRI_NEURAL,
      displayName: "Avri",
      languageCode: VoiceLanguage.HE_IL,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.HI_IN_SWARA_NEURAL,
      displayName: "Swara",
      languageCode: VoiceLanguage.HI_IN,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.HI_IN_MADHUR_NEURAL,
      displayName: "Madhur",
      languageCode: VoiceLanguage.HI_IN,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.HI_IN_AARAV_NEURAL,
      displayName: "Aarav",
      languageCode: VoiceLanguage.HI_IN,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.HI_IN_ANANYA_NEURAL,
      displayName: "Ananya",
      languageCode: VoiceLanguage.HI_IN,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.HI_IN_KAVYA_NEURAL,
      displayName: "Kavya",
      languageCode: VoiceLanguage.HI_IN,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.HI_IN_KUNAL_NEURAL,
      displayName: "Kunal",
      languageCode: VoiceLanguage.HI_IN,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.HI_IN_REHAAN_NEURAL,
      displayName: "Rehaan",
      languageCode: VoiceLanguage.HI_IN,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.HR_HR_GABRIJELA_NEURAL,
      displayName: "Gabrijela",
      languageCode: VoiceLanguage.HR_HR,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.HR_HR_SRECKO_NEURAL,
      displayName: "Srecko",
      languageCode: VoiceLanguage.HR_HR,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.HU_HU_NOEMI_NEURAL,
      displayName: "Noemi",
      languageCode: VoiceLanguage.HU_HU,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.HU_HU_TAMAS_NEURAL,
      displayName: "Tamas",
      languageCode: VoiceLanguage.HU_HU,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.HY_AM_ANAHIT_NEURAL,
      displayName: "Anahit",
      languageCode: VoiceLanguage.HY_AM,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.HY_AM_HAYK_NEURAL,
      displayName: "Hayk",
      languageCode: VoiceLanguage.HY_AM,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.ID_ID_GADIS_NEURAL,
      displayName: "Gadis",
      languageCode: VoiceLanguage.ID_ID,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.ID_ID_ARDI_NEURAL,
      displayName: "Ardi",
      languageCode: VoiceLanguage.ID_ID,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.IS_IS_GUDRUN_NEURAL,
      displayName: "Gudrun",
      languageCode: VoiceLanguage.IS_IS,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.IS_IS_GUNNAR_NEURAL,
      displayName: "Gunnar",
      languageCode: VoiceLanguage.IS_IS,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.IT_IT_ELSA_NEURAL,
      displayName: "Elsa",
      languageCode: VoiceLanguage.IT_IT,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.IT_IT_ISABELLA_NEURAL,
      displayName: "Isabella",
      languageCode: VoiceLanguage.IT_IT,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.IT_IT_DIEGO_NEURAL,
      displayName: "Diego",
      languageCode: VoiceLanguage.IT_IT,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.IT_IT_BENIGNO_NEURAL,
      displayName: "Benigno",
      languageCode: VoiceLanguage.IT_IT,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.IT_IT_CALIMERO_NEURAL,
      displayName: "Calimero",
      languageCode: VoiceLanguage.IT_IT,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.IT_IT_CATALDO_NEURAL,
      displayName: "Cataldo",
      languageCode: VoiceLanguage.IT_IT,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.IT_IT_FABIOLA_NEURAL,
      displayName: "Fabiola",
      languageCode: VoiceLanguage.IT_IT,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.IT_IT_FIAMMA_NEURAL,
      displayName: "Fiamma",
      languageCode: VoiceLanguage.IT_IT,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.IT_IT_GIANNI_NEURAL,
      displayName: "Gianni",
      languageCode: VoiceLanguage.IT_IT,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.IT_IT_GIUSEPPE_NEURAL,
      displayName: "Giuseppe",
      languageCode: VoiceLanguage.IT_IT,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.IT_IT_IMELDA_NEURAL,
      displayName: "Imelda",
      languageCode: VoiceLanguage.IT_IT,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.IT_IT_IRMA_NEURAL,
      displayName: "Irma",
      languageCode: VoiceLanguage.IT_IT,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.IT_IT_LISANDRO_NEURAL,
      displayName: "Lisandro",
      languageCode: VoiceLanguage.IT_IT,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.IT_IT_PALMIRA_NEURAL,
      displayName: "Palmira",
      languageCode: VoiceLanguage.IT_IT,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.IT_IT_PIERINA_NEURAL,
      displayName: "Pierina",
      languageCode: VoiceLanguage.IT_IT,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.IT_IT_RINALDO_NEURAL,
      displayName: "Rinaldo",
      languageCode: VoiceLanguage.IT_IT,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.IT_IT_ALESSIOMULTILINGUAL_NEURAL,
      displayName: "Alessio Multilingual",
      languageCode: VoiceLanguage.IT_IT,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.IT_IT_ISABELLAMULTILINGUAL_NEURAL,
      displayName: "Isabella Multilingual",
      languageCode: VoiceLanguage.IT_IT,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.IT_IT_MARCELLOMULTILINGUAL_NEURAL,
      displayName: "Marcello Multilingual",
      languageCode: VoiceLanguage.IT_IT,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.JA_JP_NANAMI_NEURAL,
      displayName: "Nanami",
      languageCode: VoiceLanguage.JA_JP,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.JA_JP_KEITA_NEURAL,
      displayName: "Keita",
      languageCode: VoiceLanguage.JA_JP,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.JA_JP_AOI_NEURAL,
      displayName: "Aoi",
      languageCode: VoiceLanguage.JA_JP,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.JA_JP_DAICHI_NEURAL,
      displayName: "Daichi",
      languageCode: VoiceLanguage.JA_JP,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.JA_JP_MAYU_NEURAL,
      displayName: "Mayu",
      languageCode: VoiceLanguage.JA_JP,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.JA_JP_NAOKI_NEURAL,
      displayName: "Naoki",
      languageCode: VoiceLanguage.JA_JP,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.JA_JP_SHIORI_NEURAL,
      displayName: "Shiori",
      languageCode: VoiceLanguage.JA_JP,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.JA_JP_MASARUMULTILINGUAL_NEURAL,
      displayName: "Masaru Multilingual",
      languageCode: VoiceLanguage.JA_JP,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.JV_ID_SITI_NEURAL,
      displayName: "Siti",
      languageCode: VoiceLanguage.JV_ID,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.JV_ID_DIMAS_NEURAL,
      displayName: "Dimas",
      languageCode: VoiceLanguage.JV_ID,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.KA_GE_EKA_NEURAL,
      displayName: "Eka",
      languageCode: VoiceLanguage.KA_GE,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.KA_GE_GIORGI_NEURAL,
      displayName: "Giorgi",
      languageCode: VoiceLanguage.KA_GE,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.KK_KZ_AIGUL_NEURAL,
      displayName: "Aigul",
      languageCode: VoiceLanguage.KK_KZ,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.KK_KZ_DAULET_NEURAL,
      displayName: "Daulet",
      languageCode: VoiceLanguage.KK_KZ,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.KM_KH_SREYMOM_NEURAL,
      displayName: "Sreymom",
      languageCode: VoiceLanguage.KM_KH,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.KM_KH_PISETH_NEURAL,
      displayName: "Piseth",
      languageCode: VoiceLanguage.KM_KH,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.KN_IN_SAPNA_NEURAL,
      displayName: "Sapna",
      languageCode: VoiceLanguage.KN_IN,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.KN_IN_GAGAN_NEURAL,
      displayName: "Gagan",
      languageCode: VoiceLanguage.KN_IN,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.KO_KR_SUNHI_NEURAL,
      displayName: "Sun-Hi",
      languageCode: VoiceLanguage.KO_KR,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.KO_KR_INJOON_NEURAL,
      displayName: "InJoon",
      languageCode: VoiceLanguage.KO_KR,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.KO_KR_BONGJIN_NEURAL,
      displayName: "BongJin",
      languageCode: VoiceLanguage.KO_KR,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.KO_KR_GOOKMIN_NEURAL,
      displayName: "GookMin",
      languageCode: VoiceLanguage.KO_KR,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.KO_KR_HYUNSU_NEURAL,
      displayName: "Hyunsu",
      languageCode: VoiceLanguage.KO_KR,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.KO_KR_JIMIN_NEURAL,
      displayName: "JiMin",
      languageCode: VoiceLanguage.KO_KR,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.KO_KR_SEOHYEON_NEURAL,
      displayName: "SeoHyeon",
      languageCode: VoiceLanguage.KO_KR,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.KO_KR_SOONBOK_NEURAL,
      displayName: "SoonBok",
      languageCode: VoiceLanguage.KO_KR,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.KO_KR_YUJIN_NEURAL,
      displayName: "YuJin",
      languageCode: VoiceLanguage.KO_KR,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.LO_LA_KEOMANY_NEURAL,
      displayName: "Keomany",
      languageCode: VoiceLanguage.LO_LA,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.LO_LA_CHANTHAVONG_NEURAL,
      displayName: "Chanthavong",
      languageCode: VoiceLanguage.LO_LA,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.LT_LT_ONA_NEURAL,
      displayName: "Ona",
      languageCode: VoiceLanguage.LT_LT,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.LT_LT_LEONAS_NEURAL,
      displayName: "Leonas",
      languageCode: VoiceLanguage.LT_LT,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.LV_LV_EVERITA_NEURAL,
      displayName: "Everita",
      languageCode: VoiceLanguage.LV_LV,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.LV_LV_NILS_NEURAL,
      displayName: "Nils",
      languageCode: VoiceLanguage.LV_LV,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.MK_MK_MARIJA_NEURAL,
      displayName: "Marija",
      languageCode: VoiceLanguage.MK_MK,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.MK_MK_ALEKSANDAR_NEURAL,
      displayName: "Aleksandar",
      languageCode: VoiceLanguage.MK_MK,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.ML_IN_SOBHANA_NEURAL,
      displayName: "Sobhana",
      languageCode: VoiceLanguage.ML_IN,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.ML_IN_MIDHUN_NEURAL,
      displayName: "Midhun",
      languageCode: VoiceLanguage.ML_IN,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.MN_MN_YESUI_NEURAL,
      displayName: "Yesui",
      languageCode: VoiceLanguage.MN_MN,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.MN_MN_BATAA_NEURAL,
      displayName: "Bataa",
      languageCode: VoiceLanguage.MN_MN,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.MR_IN_AAROHI_NEURAL,
      displayName: "Aarohi",
      languageCode: VoiceLanguage.MR_IN,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.MR_IN_MANOHAR_NEURAL,
      displayName: "Manohar",
      languageCode: VoiceLanguage.MR_IN,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.MS_MY_YASMIN_NEURAL,
      displayName: "Yasmin",
      languageCode: VoiceLanguage.MS_MY,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.MS_MY_OSMAN_NEURAL,
      displayName: "Osman",
      languageCode: VoiceLanguage.MS_MY,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.MT_MT_GRACE_NEURAL,
      displayName: "Grace",
      languageCode: VoiceLanguage.MT_MT,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.MT_MT_JOSEPH_NEURAL,
      displayName: "Joseph",
      languageCode: VoiceLanguage.MT_MT,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.MY_MM_NILAR_NEURAL,
      displayName: "Nilar",
      languageCode: VoiceLanguage.MY_MM,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.MY_MM_THIHA_NEURAL,
      displayName: "Thiha",
      languageCode: VoiceLanguage.MY_MM,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.NB_NO_PERNILLE_NEURAL,
      displayName: "Pernille",
      languageCode: VoiceLanguage.NB_NO,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.NB_NO_FINN_NEURAL,
      displayName: "Finn",
      languageCode: VoiceLanguage.NB_NO,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.NB_NO_ISELIN_NEURAL,
      displayName: "Iselin",
      languageCode: VoiceLanguage.NB_NO,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.NE_NP_HEMKALA_NEURAL,
      displayName: "Hemkala",
      languageCode: VoiceLanguage.NE_NP,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.NE_NP_SAGAR_NEURAL,
      displayName: "Sagar",
      languageCode: VoiceLanguage.NE_NP,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.NL_BE_DENA_NEURAL,
      displayName: "Dena",
      languageCode: VoiceLanguage.NL_BE,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.NL_BE_ARNAUD_NEURAL,
      displayName: "Arnaud",
      languageCode: VoiceLanguage.NL_BE,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.NL_NL_FENNA_NEURAL,
      displayName: "Fenna",
      languageCode: VoiceLanguage.NL_NL,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.NL_NL_MAARTEN_NEURAL,
      displayName: "Maarten",
      languageCode: VoiceLanguage.NL_NL,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.NL_NL_COLETTE_NEURAL,
      displayName: "Colette",
      languageCode: VoiceLanguage.NL_NL,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.OR_IN_SUBHASINI_NEURAL,
      displayName: "Subhasini",
      languageCode: VoiceLanguage.OR_IN,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.OR_IN_SUKANT_NEURAL,
      displayName: "Sukant",
      languageCode: VoiceLanguage.OR_IN,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.PA_IN_OJAS_NEURAL,
      displayName: "Ojas",
      languageCode: VoiceLanguage.PA_IN,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.PA_IN_VAANI_NEURAL,
      displayName: "Vaani",
      languageCode: VoiceLanguage.PA_IN,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.PL_PL_AGNIESZKA_NEURAL,
      displayName: "Agnieszka",
      languageCode: VoiceLanguage.PL_PL,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.PL_PL_MAREK_NEURAL,
      displayName: "Marek",
      languageCode: VoiceLanguage.PL_PL,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.PL_PL_ZOFIA_NEURAL,
      displayName: "Zofia",
      languageCode: VoiceLanguage.PL_PL,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.PS_AF_LATIFA_NEURAL,
      displayName: "Latifa",
      languageCode: VoiceLanguage.PS_AF,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.PS_AF_GULNAWAZ_NEURAL,
      displayName: "Gul Nawaz",
      languageCode: VoiceLanguage.PS_AF,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.PT_BR_FRANCISCA_NEURAL,
      displayName: "Francisca",
      languageCode: VoiceLanguage.PT_BR,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.PT_BR_ANTONIO_NEURAL,
      displayName: "Antonio",
      languageCode: VoiceLanguage.PT_BR,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.PT_BR_BRENDA_NEURAL,
      displayName: "Brenda",
      languageCode: VoiceLanguage.PT_BR,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.PT_BR_DONATO_NEURAL,
      displayName: "Donato",
      languageCode: VoiceLanguage.PT_BR,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.PT_BR_ELZA_NEURAL,
      displayName: "Elza",
      languageCode: VoiceLanguage.PT_BR,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.PT_BR_FABIO_NEURAL,
      displayName: "Fabio",
      languageCode: VoiceLanguage.PT_BR,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.PT_BR_GIOVANNA_NEURAL,
      displayName: "Giovanna",
      languageCode: VoiceLanguage.PT_BR,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.PT_BR_HUMBERTO_NEURAL,
      displayName: "Humberto",
      languageCode: VoiceLanguage.PT_BR,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.PT_BR_JULIO_NEURAL,
      displayName: "Julio",
      languageCode: VoiceLanguage.PT_BR,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.PT_BR_LEILA_NEURAL,
      displayName: "Leila",
      languageCode: VoiceLanguage.PT_BR,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.PT_BR_LETICIA_NEURAL,
      displayName: "Leticia",
      languageCode: VoiceLanguage.PT_BR,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.PT_BR_MANUELA_NEURAL,
      displayName: "Manuela",
      languageCode: VoiceLanguage.PT_BR,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.PT_BR_NICOLAU_NEURAL,
      displayName: "Nicolau",
      languageCode: VoiceLanguage.PT_BR,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.PT_BR_THALITAMULTILINGUAL_NEURAL,
      displayName: "Thalita Multilingual",
      languageCode: VoiceLanguage.PT_BR,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.PT_BR_THALITA_NEURAL,
      displayName: "Thalita",
      languageCode: VoiceLanguage.PT_BR,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.PT_BR_VALERIO_NEURAL,
      displayName: "Valerio",
      languageCode: VoiceLanguage.PT_BR,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.PT_BR_YARA_NEURAL,
      displayName: "Yara",
      languageCode: VoiceLanguage.PT_BR,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.PT_PT_RAQUEL_NEURAL,
      displayName: "Raquel",
      languageCode: VoiceLanguage.PT_PT,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.PT_PT_DUARTE_NEURAL,
      displayName: "Duarte",
      languageCode: VoiceLanguage.PT_PT,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.PT_PT_FERNANDA_NEURAL,
      displayName: "Fernanda",
      languageCode: VoiceLanguage.PT_PT,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.RO_RO_ALINA_NEURAL,
      displayName: "Alina",
      languageCode: VoiceLanguage.RO_RO,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.RO_RO_EMIL_NEURAL,
      displayName: "Emil",
      languageCode: VoiceLanguage.RO_RO,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.RU_RU_SVETLANA_NEURAL,
      displayName: "Svetlana",
      languageCode: VoiceLanguage.RU_RU,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.RU_RU_DMITRY_NEURAL,
      displayName: "Dmitry",
      languageCode: VoiceLanguage.RU_RU,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.RU_RU_DARIYA_NEURAL,
      displayName: "Dariya",
      languageCode: VoiceLanguage.RU_RU,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.SI_LK_THILINI_NEURAL,
      displayName: "Thilini",
      languageCode: VoiceLanguage.SI_LK,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.SI_LK_SAMEERA_NEURAL,
      displayName: "Sameera",
      languageCode: VoiceLanguage.SI_LK,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.SK_SK_VIKTORIA_NEURAL,
      displayName: "Viktoria",
      languageCode: VoiceLanguage.SK_SK,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.SK_SK_LUKAS_NEURAL,
      displayName: "Lukas",
      languageCode: VoiceLanguage.SK_SK,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.SL_SI_PETRA_NEURAL,
      displayName: "Petra",
      languageCode: VoiceLanguage.SL_SI,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.SL_SI_ROK_NEURAL,
      displayName: "Rok",
      languageCode: VoiceLanguage.SL_SI,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.SO_SO_UBAX_NEURAL,
      displayName: "Ubax",
      languageCode: VoiceLanguage.SO_SO,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.SO_SO_MUUSE_NEURAL,
      displayName: "Muuse",
      languageCode: VoiceLanguage.SO_SO,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.SQ_AL_ANILA_NEURAL,
      displayName: "Anila",
      languageCode: VoiceLanguage.SQ_AL,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.SQ_AL_ILIR_NEURAL,
      displayName: "Ilir",
      languageCode: VoiceLanguage.SQ_AL,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.SR_LATN_RS_NICHOLAS_NEURAL,
      displayName: "Nicholas",
      languageCode: VoiceLanguage.SR_LATN_RS,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.SR_LATN_RS_SOPHIE_NEURAL,
      displayName: "Sophie",
      languageCode: VoiceLanguage.SR_LATN_RS,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.SR_RS_SOPHIE_NEURAL,
      displayName: "Sophie",
      languageCode: VoiceLanguage.SR_RS,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.SR_RS_NICHOLAS_NEURAL,
      displayName: "Nicholas",
      languageCode: VoiceLanguage.SR_RS,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.SU_ID_TUTI_NEURAL,
      displayName: "Tuti",
      languageCode: VoiceLanguage.SU_ID,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.SU_ID_JAJANG_NEURAL,
      displayName: "Jajang",
      languageCode: VoiceLanguage.SU_ID,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.SV_SE_SOFIE_NEURAL,
      displayName: "Sofie",
      languageCode: VoiceLanguage.SV_SE,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.SV_SE_MATTIAS_NEURAL,
      displayName: "Mattias",
      languageCode: VoiceLanguage.SV_SE,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.SV_SE_HILLEVI_NEURAL,
      displayName: "Hillevi",
      languageCode: VoiceLanguage.SV_SE,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.SW_KE_ZURI_NEURAL,
      displayName: "Zuri",
      languageCode: VoiceLanguage.SW_KE,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.SW_KE_RAFIKI_NEURAL,
      displayName: "Rafiki",
      languageCode: VoiceLanguage.SW_KE,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.SW_TZ_REHEMA_NEURAL,
      displayName: "Rehema",
      languageCode: VoiceLanguage.SW_TZ,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.SW_TZ_DAUDI_NEURAL,
      displayName: "Daudi",
      languageCode: VoiceLanguage.SW_TZ,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.TA_IN_PALLAVI_NEURAL,
      displayName: "Pallavi",
      languageCode: VoiceLanguage.TA_IN,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.TA_IN_VALLUVAR_NEURAL,
      displayName: "Valluvar",
      languageCode: VoiceLanguage.TA_IN,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.TA_LK_SARANYA_NEURAL,
      displayName: "Saranya",
      languageCode: VoiceLanguage.TA_LK,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.TA_LK_KUMAR_NEURAL,
      displayName: "Kumar",
      languageCode: VoiceLanguage.TA_LK,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.TA_MY_KANI_NEURAL,
      displayName: "Kani",
      languageCode: VoiceLanguage.TA_MY,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.TA_MY_SURYA_NEURAL,
      displayName: "Surya",
      languageCode: VoiceLanguage.TA_MY,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.TA_SG_VENBA_NEURAL,
      displayName: "Venba",
      languageCode: VoiceLanguage.TA_SG,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.TA_SG_ANBU_NEURAL,
      displayName: "Anbu",
      languageCode: VoiceLanguage.TA_SG,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.TE_IN_SHRUTI_NEURAL,
      displayName: "Shruti",
      languageCode: VoiceLanguage.TE_IN,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.TE_IN_MOHAN_NEURAL,
      displayName: "Mohan",
      languageCode: VoiceLanguage.TE_IN,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.TH_TH_PREMWADEE_NEURAL,
      displayName: "Premwadee",
      languageCode: VoiceLanguage.TH_TH,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.TH_TH_NIWAT_NEURAL,
      displayName: "Niwat",
      languageCode: VoiceLanguage.TH_TH,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.TH_TH_ACHARA_NEURAL,
      displayName: "Achara",
      languageCode: VoiceLanguage.TH_TH,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.TR_TR_EMEL_NEURAL,
      displayName: "Emel",
      languageCode: VoiceLanguage.TR_TR,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.TR_TR_AHMET_NEURAL,
      displayName: "Ahmet",
      languageCode: VoiceLanguage.TR_TR,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.UK_UA_POLINA_NEURAL,
      displayName: "Polina",
      languageCode: VoiceLanguage.UK_UA,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.UK_UA_OSTAP_NEURAL,
      displayName: "Ostap",
      languageCode: VoiceLanguage.UK_UA,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.UR_IN_GUL_NEURAL,
      displayName: "Gul",
      languageCode: VoiceLanguage.UR_IN,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.UR_IN_SALMAN_NEURAL,
      displayName: "Salman",
      languageCode: VoiceLanguage.UR_IN,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.UR_PK_UZMA_NEURAL,
      displayName: "Uzma",
      languageCode: VoiceLanguage.UR_PK,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.UR_PK_ASAD_NEURAL,
      displayName: "Asad",
      languageCode: VoiceLanguage.UR_PK,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.UZ_UZ_MADINA_NEURAL,
      displayName: "Madina",
      languageCode: VoiceLanguage.UZ_UZ,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.UZ_UZ_SARDOR_NEURAL,
      displayName: "Sardor",
      languageCode: VoiceLanguage.UZ_UZ,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.VI_VN_HOAIMY_NEURAL,
      displayName: "HoaiMy",
      languageCode: VoiceLanguage.VI_VN,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.VI_VN_NAMMINH_NEURAL,
      displayName: "NamMinh",
      languageCode: VoiceLanguage.VI_VN,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.WUU_CN_XIAOTONG_NEURAL,
      displayName: "Xiaotong",
      languageCode: VoiceLanguage.WUU_CN,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.WUU_CN_YUNZHE_NEURAL,
      displayName: "Yunzhe",
      languageCode: VoiceLanguage.WUU_CN,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.YUE_CN_XIAOMIN_NEURAL,
      displayName: "XiaoMin",
      languageCode: VoiceLanguage.YUE_CN,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.YUE_CN_YUNSONG_NEURAL,
      displayName: "YunSong",
      languageCode: VoiceLanguage.YUE_CN,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.ZH_CN_XIAOXIAO_NEURAL,
      displayName: "Xiaoxiao",
      languageCode: VoiceLanguage.ZH_CN,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.ZH_CN_YUNXI_NEURAL,
      displayName: "Yunxi",
      languageCode: VoiceLanguage.ZH_CN,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.ZH_CN_YUNJIAN_NEURAL,
      displayName: "Yunjian",
      languageCode: VoiceLanguage.ZH_CN,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.ZH_CN_XIAOYI_NEURAL,
      displayName: "Xiaoyi",
      languageCode: VoiceLanguage.ZH_CN,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.ZH_CN_YUNYANG_NEURAL,
      displayName: "Yunyang",
      languageCode: VoiceLanguage.ZH_CN,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.ZH_CN_XIAOCHEN_NEURAL,
      displayName: "Xiaochen",
      languageCode: VoiceLanguage.ZH_CN,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.ZH_CN_XIAOCHENMULTILINGUAL_NEURAL,
      displayName: "Xiaochen Multilingual",
      languageCode: VoiceLanguage.ZH_CN,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.ZH_CN_XIAOHAN_NEURAL,
      displayName: "Xiaohan",
      languageCode: VoiceLanguage.ZH_CN,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.ZH_CN_XIAOMENG_NEURAL,
      displayName: "Xiaomeng",
      languageCode: VoiceLanguage.ZH_CN,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.ZH_CN_XIAOMO_NEURAL,
      displayName: "Xiaomo",
      languageCode: VoiceLanguage.ZH_CN,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.ZH_CN_XIAOQIU_NEURAL,
      displayName: "Xiaoqiu",
      languageCode: VoiceLanguage.ZH_CN,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.ZH_CN_XIAOROU_NEURAL,
      displayName: "Xiaorou",
      languageCode: VoiceLanguage.ZH_CN,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.ZH_CN_XIAORUI_NEURAL,
      displayName: "Xiaorui",
      languageCode: VoiceLanguage.ZH_CN,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.ZH_CN_XIAOSHUANG_NEURAL,
      displayName: "Xiaoshuang",
      languageCode: VoiceLanguage.ZH_CN,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.ZH_CN_XIAOXIAODIALECTS_NEURAL,
      displayName: "Xiaoxiao Dialects",
      languageCode: VoiceLanguage.ZH_CN,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.ZH_CN_XIAOXIAOMULTILINGUAL_NEURAL,
      displayName: "Xiaoxiao Multilingual",
      languageCode: VoiceLanguage.ZH_CN,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.ZH_CN_XIAOYAN_NEURAL,
      displayName: "Xiaoyan",
      languageCode: VoiceLanguage.ZH_CN,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.ZH_CN_XIAOYOU_NEURAL,
      displayName: "Xiaoyou",
      languageCode: VoiceLanguage.ZH_CN,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.ZH_CN_XIAOYUMULTILINGUAL_NEURAL,
      displayName: "Xiaoyu Multilingual",
      languageCode: VoiceLanguage.ZH_CN,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.ZH_CN_XIAOZHEN_NEURAL,
      displayName: "Xiaozhen",
      languageCode: VoiceLanguage.ZH_CN,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.ZH_CN_YUNFENG_NEURAL,
      displayName: "Yunfeng",
      languageCode: VoiceLanguage.ZH_CN,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.ZH_CN_YUNHAO_NEURAL,
      displayName: "Yunhao",
      languageCode: VoiceLanguage.ZH_CN,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.ZH_CN_YUNJIE_NEURAL,
      displayName: "Yunjie",
      languageCode: VoiceLanguage.ZH_CN,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.ZH_CN_YUNXIA_NEURAL,
      displayName: "Yunxia",
      languageCode: VoiceLanguage.ZH_CN,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.ZH_CN_YUNYE_NEURAL,
      displayName: "Yunye",
      languageCode: VoiceLanguage.ZH_CN,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.ZH_CN_YUNYIMULTILINGUAL_NEURAL,
      displayName: "Yunyi Multilingual",
      languageCode: VoiceLanguage.ZH_CN,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.ZH_CN_YUNZE_NEURAL,
      displayName: "Yunze",
      languageCode: VoiceLanguage.ZH_CN,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.ZH_CN_GUANGXI_YUNQI_NEURAL,
      displayName: "Yunqi",
      languageCode: VoiceLanguage.ZH_CN_GUANGXI,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.ZH_CN_HENAN_YUNDENG_NEURAL,
      displayName: "Yundeng",
      languageCode: VoiceLanguage.ZH_CN_HENAN,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.ZH_CN_LIAONING_XIAOBEI_NEURAL,
      displayName: "Xiaobei",
      languageCode: VoiceLanguage.ZH_CN_LIAONING,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.ZH_CN_LIAONING_YUNBIAO_NEURAL,
      displayName: "Yunbiao",
      languageCode: VoiceLanguage.ZH_CN_LIAONING,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.ZH_CN_SHAANXI_XIAONI_NEURAL,
      displayName: "Xiaoni",
      languageCode: VoiceLanguage.ZH_CN_SHAANXI,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.ZH_CN_SHANDONG_YUNXIANG_NEURAL,
      displayName: "Yunxiang",
      languageCode: VoiceLanguage.ZH_CN_SHANDONG,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.ZH_CN_SICHUAN_YUNXI_NEURAL,
      displayName: "Yunxi",
      languageCode: VoiceLanguage.ZH_CN_SICHUAN,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.ZH_HK_HIUMAAN_NEURAL,
      displayName: "HiuMaan",
      languageCode: VoiceLanguage.ZH_HK,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.ZH_HK_WANLUNG_NEURAL,
      displayName: "WanLung",
      languageCode: VoiceLanguage.ZH_HK,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.ZH_HK_HIUGAAI_NEURAL,
      displayName: "HiuGaai",
      languageCode: VoiceLanguage.ZH_HK,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.ZH_TW_HSIAOCHEN_NEURAL,
      displayName: "HsiaoChen",
      languageCode: VoiceLanguage.ZH_TW,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.ZH_TW_YUNJHE_NEURAL,
      displayName: "YunJhe",
      languageCode: VoiceLanguage.ZH_TW,
      gender: VoiceGender.MALE
    },
    {
      name: AzureVoice.ZH_TW_HSIAOYU_NEURAL,
      displayName: "HsiaoYu",
      languageCode: VoiceLanguage.ZH_TW,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.ZU_ZA_THANDO_NEURAL,
      displayName: "Thando",
      languageCode: VoiceLanguage.ZU_ZA,
      gender: VoiceGender.FEMALE
    },
    {
      name: AzureVoice.ZU_ZA_THEMBA_NEURAL,
      displayName: "Themba",
      languageCode: VoiceLanguage.ZU_ZA,
      gender: VoiceGender.MALE
    }
  ]
];

export { AzureVoice, AzureVoiceDetails };
