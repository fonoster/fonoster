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
import { objectToQString } from "../utils";
import { Verb } from "../verb";
import { MuteOptions } from "./types";

export default class UnmuteVerb extends Verb {
  async run(opts: MuteOptions = { direction: "both" }): Promise<void> {
    await super.delete(
      `channels/${this.request.sessionId}/mute`,
      objectToQString(opts)
    );
  }
}

export { MuteOptions };
