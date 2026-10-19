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
/** A command failed: AppBridge sent `error` with `relatesTo` set to the command's id. */
export class SessionError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly fatal = false
  ) {
    super(message);
    this.name = "SessionError";
  }
}

/** The session ended (or a fatal error arrived) while the command was pending. */
export class SessionEndedError extends Error {
  constructor(readonly reason: string) {
    super(`the session ended (${reason})`);
    this.name = "SessionEndedError";
  }
}
