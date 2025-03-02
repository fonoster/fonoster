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
  Messages,
  PlaybackControlAction,
  PlaybackControlRequest
} from "@fonoster/common";
import { z } from "zod";
import { Verb } from "./Verb";

class PlaybackControl extends Verb<PlaybackControlRequest> {
  getValidationSchema(): z.Schema {
    return z.object({
      playbackRef: z.string().uuid({ message: Messages.VALID_UUID }),
      action: z.nativeEnum(PlaybackControlAction, {
        message: "Invalid playback control action"
      })
    });
  }
}

export { PlaybackControl };
