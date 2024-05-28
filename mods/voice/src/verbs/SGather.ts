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
import { z } from "zod";
import { GatherSource } from "./Gather";
import { Verb, VerbRequest } from "./Verb";

type SGatherOptions = {
  source: GatherSource;
};

type SGatherStream = {
  on: (event: "transcript" | "dtmf", cb: (data: string) => void) => void;
  close: () => void;
};

type SGatherRequest = VerbRequest & SGatherOptions;

class SGather extends Verb<SGatherRequest> {
  getValidationSchema(): z.Schema {
    return z.object({
      source: z
        .enum([
          GatherSource.SPEECH,
          GatherSource.DTMF,
          GatherSource.SPEECH_AND_DTMF
        ])
        .optional()
    });
  }
}

export { SGather, SGatherRequest, SGatherStream, SGatherOptions };
