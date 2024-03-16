/*
 * Copyright (C) 2023 by Fonoster Inc (https://fonoster.com)
 * http://github.com/fonoster/rox
 *
 * This file is part of Rox AI
 *
 * Licensed under the MIT License (the "License")
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
import { EventsClient } from "./events/emitter";
import { ClientEvent } from "./events/types";

export const getEnvOrDefault = (envName: string, def: number) =>
  process.env[envName] ? parseInt(process.env[envName] || "") : def;

export const getEnvOrBool = (envName: string) =>
  process.env[envName]
    ? (process.env[envName] || "false").toLowerCase() === "true"
    : false;

export const removeEmpty = (obj) => {
  const newObj = {};
  Object.keys(obj).forEach((key) => {
    if (obj[key] === Object(obj[key])) newObj[key] = removeEmpty(obj[key]);
    else if (obj[key] !== undefined) newObj[key] = obj[key];
  });
  return newObj;
};

export const sendClientEvent = (
  eventsClient: EventsClient | null,
  event: ClientEvent
) => {
  if (eventsClient) {
    eventsClient.send(event);
  }
};
