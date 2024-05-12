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
import {
  ApplicationData,
  CreateApplicationRequest,
  UpdateApplicationRequest
} from "../types";

function convertToApplicationData(
  request: CreateApplicationRequest | UpdateApplicationRequest
) {
  const result = {
    ref: (request as UpdateApplicationRequest).ref, // Only for UpdateApplicationRequest
    name: request.name,
    type: request.type,
    appUrl: request.appUrl
  } as ApplicationData;

  const createProperty = (property) => {
    return property
      ? {
          create: {
            productRef: property.productRef,
            secretRef: property.secretRef,
            config: property.config ? struct.decode(property.config) : null
          }
        }
      : undefined;
  };

  if (request.textToSpeech) {
    result.textToSpeech = createProperty(request.textToSpeech);
  }

  if (request.speechToText) {
    result.speechToText = createProperty(request.speechToText);
  }

  if (request.conversation) {
    result.conversation = createProperty(request.conversation);
  }

  return result;
}

export { convertToApplicationData };
