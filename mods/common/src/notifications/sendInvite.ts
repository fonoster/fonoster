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
import { createInviteBody } from "./createInviteBody";
import { createInviteToken } from "./createInviteToken";
import { sendEmail } from "./sender";
import { APP_URL, SMTP_SENDER } from "../envs";

type SendInviteParams = {
  recipient: string;
  oneTimePassword: string;
  groupId: string;
  groupName: string;
};

type SendInvite = (params: SendInviteParams) => Promise<void>;

async function sendInvite(request: SendInviteParams) {
  const { recipient, oneTimePassword, groupId, groupName } = request;

  const token = await createInviteToken({
    groupId,
    email: recipient
  });

  await sendEmail({
    from: SMTP_SENDER,
    to: recipient,
    subject: "Invite to join a Fonoster workspace",
    html: createInviteBody({
      groupName,
      oneTimePassword,
      inviteUrl: `${APP_URL}/accept-invite?token=${token}`
    })
  });
}

export { sendInvite, SendInvite, SendInviteParams };
