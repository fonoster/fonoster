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
import { TwilioCredentials } from "@fonoster/types";
import { createTwilioClient } from "./createTwilioClient";
import { runStep } from "./runStep";
import {
  RemoveOtherTwilioSipCredentialsParams,
  TwilioLinkOptions
} from "./types";

/** Deletes every credential in `CL-<label>` except `keepUsername` (after a credential rotation). */
async function removeOtherTwilioSipCredentials(
  credentials: TwilioCredentials,
  params: RemoveOtherTwilioSipCredentialsParams,
  options: TwilioLinkOptions = {}
): Promise<void> {
  const client = createTwilioClient(credentials, options);
  const { label, keepUsername } = params;

  const lists = await runStep("sip.credentialLists.list", () =>
    client.sip.credentialLists.list()
  );

  const list = lists.find((l) => l.friendlyName === `CL-${label}`);

  if (!list) {
    return;
  }

  const sipCredentials = await runStep(
    "sip.credentialLists.credentials.list",
    () => client.sip.credentialLists(list.sid).credentials.list()
  );

  for (const credential of sipCredentials) {
    if (credential.username !== keepUsername) {
      await runStep("sip.credentialLists.credentials.remove", () =>
        client.sip
          .credentialLists(list.sid)
          .credentials(credential.sid)
          .remove()
      );
    }
  }
}

export { removeOtherTwilioSipCredentials };
