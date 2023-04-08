/*
 * Copyright (C) 2023 by Fonoster Inc (https://fonoster.com)
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
export interface IAppsClient {
  createApp(request: CreateAppRequest): Promise<CreateAppResponse>;
  getApp(ref: string): Promise<GetAppResponse>;
  updateApp(request: UpdateAppRequest): Promise<UpdateAppResponse>;
  listApps(request: ListAppsRequest): Promise<ListAppsResponse>;
  deleteApp(ref: string): Promise<DeleteAppResponse>;
}

export type SpeechConfig = GoogleSpeechConfig;
export type IntentsEngineConfig = DialogflowES | DialoflowCX;

export interface GoogleSpeechConfig {
  secretName: string;
  voice: string;
  languageCode: string;
}

export interface DialogflowES {
  projectId: string;
  secretName: string;
  welcomeIntentId?: string;
  emulateTelephonyPlatform?: boolean;
}

export interface DialoflowCX {
  projectId: string;
  agent: string;
  location: string;
  secretName: string;
  welcomeIntentId: string;
  emulateTelephonyPlatform: boolean;
}

export interface TransferConfig {
  media?: string;
  mediaBusy?: string;
  mediaNoAnswer?: string;
  message?: string;
  messageBusy?: string;
  messageNoAnswer?: string;
}

export interface App {
  ref: string;
  name: string;
  initialDtmf?: string;
  activationIntentId?: string;
  activationTimeout?: number;
  interactionTimeout?: number;
  enableEvents?: boolean;
  transferConfig?: TransferConfig;
  speechConfig: SpeechConfig;
  intentsEngineConfig: IntentsEngineConfig;
}

export interface CreateAppRequest {
  name: string;
  initialDtmf?: string;
  activationIntentId?: string;
  activationTimeout?: number;
  interactionTimeout?: number;
  enableEvents?: boolean;
  transferConfig?: TransferConfig;
  speechConfig: SpeechConfig;
  intentsEngineConfig: IntentsEngineConfig;
}

export interface CreateAppResponse {
  ref: string;
  name: string;
  initialDtmf?: string;
  activationIntentId?: string;
  activationTimeout: number;
  interactionTimeout: number;
  enableEvents: boolean;
  transferConfig?: TransferConfig;
  speechConfig: SpeechConfig;
  intentsEngineConfig: IntentsEngineConfig;
  createTime: string;
  updateTime: string;
}

export interface UpdateAppRequest {
  ref: string;
  name?: string;
  initialDtmf?: string;
  activationIntentId?: string;
  activationTimeout?: number;
  interactionTimeout?: number;
  enableEvents?: boolean;
  transferConfig?: TransferConfig;
  speechConfig?: SpeechConfig;
  intentsEngineConfig?: IntentsEngineConfig;
}

export interface UpdateAppResponse {
  ref: string;
}

export interface GetAppResponse {
  ref: string;
  name: string;
  initialDtmf?: string;
  activationIntentId?: string;
  activationTimeout: number;
  interactionTimeout: number;
  enableEvents: boolean;
  transferConfig?: TransferConfig;
  speechConfig: SpeechConfig;
  intentsEngineConfig: IntentsEngineConfig;
  createTime: string;
  updateTime: string;
}

export interface ListAppsRequest {
  pageSize?: number;
  pageToken?: string;
  view?: number;
}

export interface ListAppsResponse {
  nextPageToken: string;
  apps: App[];
}

export interface DeleteAppResponse {
  ref: string;
}
