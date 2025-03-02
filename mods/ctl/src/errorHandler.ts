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
function errorHandler(e: unknown, log: (message: string) => void): void {
  const error = e as { code?: number; message: string };
  if (error.code === 3) {
    const splitPoint = "3 INVALID_ARGUMENT:";
    const message = error.message.split(splitPoint);
    log(message[1]);
    return;
  }
  log?.(error.message.trim());
}

export default errorHandler;
