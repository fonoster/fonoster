/*
 * Copyright (C) 2021 by Fonoster Inc (https://fonoster.com)
 * http://github.com/fonoster/fonos
 *
 * This file is part of Project Fonos
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
import {FonosError} from "@fonos/errors";
import phone from "phone";
import {EndpointInfo} from "../client/types";

export default async function (
  request: CallRequest,
  channel: any,
  endpointInfo: EndpointInfo
): Promise<CallResponse> {
  if (phone(request.getFrom()).length === 0)
    throw new FonosError("invalid e164 number");
  if (phone(request.getTo()).length === 0)
    throw new FonosError("invalid e164 number");
  if (!request.getApp()) throw new FonosError("invalid app reference");

  const response = new CallResponse();
  response.setFrom(phone(request.getFrom())[0]);
  response.setTo(phone(request.getTo())[0]);
  response.setApp(request.getApp());
  response.setDuration(0);

  // Removing the "+" sign
  const from = response.getFrom().substring(1, response.getFrom().length);
  const to = response.getTo().substring(1, response.getTo().length);

  await channel.originate({
    context: endpointInfo.context,
    extension: endpointInfo.extension,
    endpoint: `PJSIP/${endpointInfo.trunk}/sip:${to}@${endpointInfo.domain}`,
    variables: {DID_INFO: `${phone(from)[0]}`}
  });

  return response;
}
