/*
 * Copyright (C) 2022 by Fonoster Inc (https://fonoster.com)
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
import { CallRequest, CallResponse } from "./protos/callmanager_pb";
import { nanoid } from "nanoid";
import { EndpointInfo } from "../client/types";
import {
  assertCompatibleParameters,
  assertIsE164,
  assertWebhookIsURL
} from "./assertions";

export default async function (
  request: CallRequest,
  channel: any,
  endpointInfo: EndpointInfo
): Promise<CallResponse> {
  assertCompatibleParameters(request);
  if (!request.getIgnoreE164Validation())
    assertIsE164(request.getFrom(), "from");
  if (!request.getIgnoreE164Validation()) assertIsE164(request.getFrom(), "to");
  if (request.getWebhook()) assertWebhookIsURL(request.getWebhook());

  const response = new CallResponse();
  response.setRef(nanoid());

  await channel.originate({
    context: endpointInfo.context,
    extension: endpointInfo.extension,
    endpoint: `PJSIP/${endpointInfo.trunk}/sip:${request.getTo()}@${
      endpointInfo.domain
    }`,
    variables: {
      DID_INFO: request.getFrom(),
      REF: response.getRef(),
      METADATA: request.getMetadata(),
      WEBHOOK: request.getWebhook(),
      APP_REF: request.getAppRef()
    }
  });

  return response;
}
