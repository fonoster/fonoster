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
const GITHUB_EMAILS_API_URL = "https://api.github.com/user/emails";

type GitHubEmail = { email: string; primary: boolean; verified: boolean };

type GitHubUser = {
  name?: string;
  login?: string;
  avatar_url?: string;
  /** The primary verified address, or undefined when there is none. */
  email?: string;
};

/**
 * Trades an OAuth code for the GitHub user. The email is the account's
 * primary *verified* address from /user/emails, never the public profile
 * email, which the user can set to anything.
 */
async function getGitHubUserWithOauth2Code(params: {
  clientId: string;
  clientSecret: string;
  code: string;
}): Promise<GitHubUser> {
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

  if (!accessToken) {
    return {};
  }

  const headers = {
    Authorization: `token ${accessToken}`,
    Accept: "application/vnd.github+json"
  };

  const [userResponse, emailsResponse] = await Promise.all([
    fetch(GITHUB_USER_API_URL, { headers }),
    fetch(GITHUB_EMAILS_API_URL, { headers })
  ]);

  const user = await userResponse.json();
  const emails: GitHubEmail[] = emailsResponse.ok
    ? await emailsResponse.json()
    : [];
  const primary = Array.isArray(emails)
    ? emails.find((e) => e.primary && e.verified)
    : undefined;

  return {
    name: user?.name || user?.login,
    login: user?.login,
    avatar_url: user?.avatar_url,
    email: primary?.email
  };
}

export { getGitHubUserWithOauth2Code, GitHubUser };
