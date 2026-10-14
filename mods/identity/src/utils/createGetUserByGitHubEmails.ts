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
import { Prisma } from "../db";
import { createGetUserByEmail } from "./createGetUserByEmail";

/**
 * Finds the user for a GitHub account by any of its verified emails, primary
 * first. Fonoster 0.27 matched GitHub's public profile email, which isn't
 * always the primary one, so those users would otherwise get a second account.
 */
function createGetUserByGitHubEmails(prisma: Prisma) {
  const getUserByEmail = createGetUserByEmail(prisma);

  return async function getUserByGitHubEmails(emails: string[]) {
    for (const email of emails) {
      const user = await getUserByEmail(email);
      if (user) return user;
    }
    return null;
  };
}

export { createGetUserByGitHubEmails };
