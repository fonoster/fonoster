/*
 * Copyright (C) 2023 by Fonoster Inc (https://fonoster.com)
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

// Add a helper function that will check for a service-prefixed environment variable
// For example, for key "LOGS_FORMAT" it will return process.env.APISERVER_LOGS_FORMAT if exists,
// and fall back to process.env.LOGS_FORMAT otherwise.
function getEnv(key: string, defaultValue?: any): any {
  // Look for any environment variable that is a service-prefixed variable (e.g. APISERVER_LOGS_FORMAT)
  const prefixedKey = Object.keys(process.env).find(
    (envKey) => envKey !== key && envKey.endsWith(`_${key}`)
  );
  if (prefixedKey !== undefined && process.env[prefixedKey] !== undefined) {
    return process.env[prefixedKey];
  }
  return process.env[key] !== undefined ? process.env[key] : defaultValue;
}

export { getEnv };
