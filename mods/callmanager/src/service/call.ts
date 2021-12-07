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
import {CallRequest, CallResponse} from "./protos/callmanager_pb";
import {nanoid} from "nanoid";
import {FonosterError} from "@fonoster/errors";
import phone from "phone";
import {EndpointInfo} from "../client/types";

export default async function (
  request: CallRequest,
  channel: any,
  endpointInfo: EndpointInfo
): Promise<CallResponse> {
  if (
    !request.getIgnoreE164Validation() &&
    phone(request.getFrom()).length === 0
  ) {
    throw new FonosterError("invalid e164 number");
  }

  if (
    !request.getIgnoreE164Validation() &&
    phone(request.getTo()).length === 0
  ) {
    throw new FonosterError("invalid e164 number");
  }

  const response = new CallResponse();
  response.setRef(nanoid());

  const variables = !request.getWebhook()
    ? {
        DID_INFO: request.getFrom(),
        REF: response.getRef(),
        METADATA: request.getMetadata()
      }
    : {
        DID_INFO: request.getFrom(),
        WEBHOOK: request.getWebhook(),
        REF: response.getRef(),
        METADATA: request.getMetadata()
      };

  await channel.originate({
    context: endpointInfo.context,
    extension: endpointInfo.extension,
    endpoint: `PJSIP/${endpointInfo.trunk}/sip:${request.getTo()}@${
      endpointInfo.domain
    }`,
    variables
  });

  return response;
}
