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
function isJwtExpired(token: string) {
  try {
    const [, payloadBase64] = token.split(".");

    const payloadJson = Buffer.from(payloadBase64, "base64").toString("utf8");
    const payload = JSON.parse(payloadJson);

    if (!payload.exp) {
      return false;
    }

    const expirationTime = payload.exp * 1000;
    const currentTime = Date.now();

    return currentTime > expirationTime;
  } catch (error) {
    return true;
  }
}

export { isJwtExpired };
