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
// What is left of the apiserver's speech engines after the rebuild (cleanbreak CB-B4): the
// config and credential schemas that application validation still checks. Speech runs in the
// appbridge now (add-provider-registry).
enum DeepgramModel {
  NOVA_3 = "nova-3",
  NOVA_2 = "nova-2",
  NOVA_2_PHONECALL = "nova-2-phonecall",
  NOVA_2_CONVERSATIONALAI = "nova-2-conversationalai"
}

// Deepgram's code-switching mode: transcribes speech that mixes languages. Nova-3 and Nova-2.
const DEEPGRAM_MULTILINGUAL = "multi";

const MULTILINGUAL_MODELS = [DeepgramModel.NOVA_3, DeepgramModel.NOVA_2];

export { DEEPGRAM_MULTILINGUAL, DeepgramModel, MULTILINGUAL_MODELS };
