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
import { EmailParams } from "@fonoster/common";
import { createInviteBody } from "./createInviteBody";
import { InviteParams } from "./types";

async function sendInvite(
  sendEmail: (params: EmailParams) => Promise<void>,
  request: InviteParams
) {
  const {
    recipient,
    inviteUrl,
    oneTimePassword,
    isExistingUser,
    workspaceName,
    templateDir
  } = request;

  await sendEmail({
    to: recipient,
    subject: "Invitation to join a Fonoster workspace",
    html: createInviteBody({
      templateDir,
      isExistingUser,
      workspaceName,
      oneTimePassword: isExistingUser ? undefined : oneTimePassword,
      inviteUrl
    })
  });
}

export { sendInvite };
