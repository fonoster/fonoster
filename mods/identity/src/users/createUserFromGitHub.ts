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
import {
  AccessKeyIdType,
  generateAccessKeyId
} from "../utils/generateAccessKeyId";
import { GitHubUser } from "../utils/getGitHubUserWithOauth2Code";

/** Creates a user from a GitHub profile; GitHub users have no password. */
function createUserFromGitHub(prisma: Prisma) {
  return async (githubUser: GitHubUser & { email: string }) =>
    prisma.user.create({
      data: {
        name: (githubUser.name || githubUser.email).slice(0, 60),
        email: githubUser.email,
        accessKeyId: generateAccessKeyId(AccessKeyIdType.USER),
        emailVerified: true,
        avatar: githubUser.avatar_url
      }
    });
}

export { createUserFromGitHub };
