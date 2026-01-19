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
  DialRecordDirection,
  RecordFormat,
  STASIS_APP_NAME
} from "@fonoster/common";
import { Client } from "ari-client";

async function recordChannel(
  ari: Client,
  direction: DialRecordDirection.IN | DialRecordDirection.OUT,
  mediaSessionRef: string
) {
  const spy = direction.toLowerCase();

  const channel = await ari.channels.snoopChannel({
    app: STASIS_APP_NAME,
    channelId: mediaSessionRef,
    spy
  });

  return ari.channels.record({
    channelId: channel.id,
    format: RecordFormat.WAV,
    name: `${mediaSessionRef}_${spy}`
  });
}

export { recordChannel };
