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
import { Transporter } from "nodemailer";

const logger = getLogger({ service: "common", filePath: __filename });

type EmailOptions = {
  to: string;
  from: string;
  subject: string;
  html: string;
};

function createEmailSender(transporter: Transporter) {
  return async function sendEmail(options: EmailOptions): Promise<void> {
    const info = await transporter.sendMail({
      from: options.from,
      to: options.to,
      subject: options.subject,
      html: options.html
    });

    logger.verbose(`message sent: ${info.messageId}`);
  };
}

export { createEmailSender, EmailOptions };
