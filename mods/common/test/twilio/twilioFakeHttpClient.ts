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
import RequestClient from "twilio/lib/base/RequestClient";
import { TwilioFake } from "./createTwilioFake";

/** The thin adapter: a twilio-node RequestClient that answers from the fake. */
function twilioFakeHttpClient(fake: TwilioFake): RequestClient {
  return {
    async request(opts: RequestClient.RequestOptions) {
      const response = fake.handle({
        method: String(opts.method),
        uri: opts.uri,
        username: opts.username,
        password: opts.password,
        params: opts.params as Record<string, unknown> | undefined,
        data: opts.data as Record<string, unknown> | undefined
      });
      return { ...response, headers: {} };
    }
  } as unknown as RequestClient;
}

export { twilioFakeHttpClient };
