import { CreateNumberRequest, UpdateNumberRequest } from "./protos/numbers_pb";

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
export const getWebhook = (
  request: CreateNumberRequest | UpdateNumberRequest
) =>
  request.getIngressInfo()?.getAppRef() &&
  !request.getIngressInfo()?.getWebhook()
    ? process.env.VOICE_URL
    : request.getIngressInfo().getWebhook().trim();

export const getAppRef = (request: CreateNumberRequest | UpdateNumberRequest) =>
  request.getIngressInfo()?.getAppRef()
    ? request.getIngressInfo()?.getAppRef()
    : null;
