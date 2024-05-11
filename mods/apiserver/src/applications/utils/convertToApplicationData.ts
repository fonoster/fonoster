/*
 * Copyright (C) 2024 by Fonoster Inc (https://fonoster.com)
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
import { struct } from "pb-util";
import { CreateApplicationRequest, UpdateApplicationRequest } from "../types";

function convertToApplicationData(
  request: CreateApplicationRequest | UpdateApplicationRequest
) {
  return {
    ref: (request as UpdateApplicationRequest).ref,
    name: request.name,
    type: request.type,
    appUrl: request.appUrl,
    textToSpeech: {
      create: {
        productRef: request.textToSpeech?.productRef,
        config: struct.decode(request.textToSpeech?.config)
      }
    },
    speechToText: {
      create: {
        productRef: request.speechToText?.productRef,
        config: struct.decode(request.speechToText?.config)
      }
    },
    conversation: {
      create: {
        productRef: request.conversation?.productRef,
        config: struct.decode(request.conversation?.config)
      }
    }
  };
}

export { convertToApplicationData };
