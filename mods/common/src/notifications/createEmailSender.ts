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
import { getLogger } from "@fonoster/logger";
import { createTransport } from "nodemailer";

const logger = getLogger({ service: "common", filePath: __filename });

type EmailSenderConfig = {
  sender: string;
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
};

type EmailParams = {
  to: string;
  subject: string;
  html: string;
};

function createEmailSender(config: EmailSenderConfig) {
  const { sender, host, port, secure, auth } = config;
  const transporter = createTransport({
    host,
    port,
    secure,
    auth
  });

  return async function sendEmail(params: EmailParams): Promise<void> {
    const { to, subject, html } = params;

    const info = await transporter.sendMail({
      from: sender,
      to,
      subject,
      html
    });

    logger.verbose(`message sent: ${info.messageId}`);
  };
}

export { createEmailSender, EmailSenderConfig, EmailParams };
