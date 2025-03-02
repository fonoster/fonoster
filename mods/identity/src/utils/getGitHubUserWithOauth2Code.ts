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
const GITHUB_API_URL = "https://github.com/login/oauth/access_token";
const GITHUB_USER_API_URL = "https://api.github.com/user";

async function getGitHubUserWithOauth2Code(params: {
  clientId: string;
  clientSecret: string;
  code: string;
}) {
  const { clientId, clientSecret, code } = params;
  const tokenResponse = await fetch(GITHUB_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code
    })
  });

  const tokenData = await tokenResponse.json();
  const accessToken = tokenData?.access_token;

  const userResponse = await fetch(GITHUB_USER_API_URL, {
    headers: {
      Authorization: `token ${accessToken}`
    }
  });

  return userResponse.json();
}

export { getGitHubUserWithOauth2Code };
