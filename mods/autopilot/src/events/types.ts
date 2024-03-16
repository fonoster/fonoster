/*
 * Copyright (C) 2023 by Fonoster Inc (https://fonoster.com)
 * http://github.com/fonoster/rox
 *
 * This file is part of Rox AI
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
export enum CLIENT_EVENTS {
  RECOGNIZING = "RECOGNIZING",
  ANSWERED = "ANSWERED",
  RECOGNIZING_FINISHED = "RECOGNIZING_FINISHED",
  INTENT = "INTENT",
  HANGUP = "HANGUP"
}

export interface EventEmitter {
  send(payload?: ClientEvent): void;
}

export interface Intent {
  icon?: string;
  title: string;
  description: string;
  transcript: string;
}

export interface ClientEvent {
  eventName: CLIENT_EVENTS;
  intent?: Intent;
}
