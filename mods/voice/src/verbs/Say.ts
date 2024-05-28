/*
 * Copyright (C) 2024 by Fonoster Inc (https://fonoster.com)
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
import { Struct } from "pb-util";
import { z } from "zod";
import { Verb, VerbRequest } from "./Verb";

type TTSOptions = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

type SayRequest = VerbRequest & {
  text: string;
  playbackRef?: string;
  ttsOptions?: Struct;
};

type SayResponse = {
  playbackRef: string;
};

type SayOptions = {
  playbackRef?: string;
  ttsOptions?: TTSOptions;
};

class Say extends Verb<SayRequest> {
  getValidationSchema(): z.Schema {
    return z.object({
      text: z.string().min(1),
      playbackRef: z.string().optional()
    });
  }
}

export { Say, SayRequest, SayResponse, SayOptions, TTSOptions };
