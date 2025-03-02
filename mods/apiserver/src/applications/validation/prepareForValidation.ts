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
import {
  Application,
  CreateApplicationRequest,
  UpdateApplicationRequest
} from "@fonoster/types";
import { ApplicationType } from "@prisma/client";
import { struct } from "pb-util";

function prepareForValidation(
  request: CreateApplicationRequest | UpdateApplicationRequest
) {
  const type = (request.type as ApplicationType) || ApplicationType.EXTERNAL;

  const result = {
    ref: (request as UpdateApplicationRequest).ref, // Only for UpdateApplicationRequest
    name: request.name,
    type,
    endpoint: request.endpoint
  } as Application;

  const createProperty = (property) => {
    return property
      ? {
          productRef: property.productRef,
          credentials: property.credentials
            ? struct.decode(property.credentials)
            : undefined,
          config: property.config ? struct.decode(property.config) : null
        }
      : undefined;
  };

  if (request.textToSpeech) {
    result.textToSpeech = createProperty(request.textToSpeech);
  }

  if (request.speechToText) {
    result.speechToText = createProperty(request.speechToText);
  }

  if (request.intelligence) {
    result.intelligence = createProperty(request.intelligence);
  }

  return result;
}

export { prepareForValidation };
